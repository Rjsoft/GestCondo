// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Toda a fixture corre dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Cobre a Fase A.1 (exercícios financeiros + contas financeiras — ver
// docs/product/MBD_GEST_GAP_ANALYSIS.md): a constraint de não-sobreposição
// (EXCLUDE USING gist), as FKs compostas que impedem cruzar condomínios, e
// a lógica de cálculo de saldo (reproduzida aqui, não chamada diretamente
// de lib/contas-financeiras.ts, porque essas funções usam a ligação
// global `db`, não a transação `tx` deste teste — mesmo padrão já usado em
// mapa-saldos.dbtest.ts).
import { and, eq, gte, isNull, lte } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, contaFinanceira, exercicioFinanceiro, movimento, saldoInicialConta } from './schema'

class RollbackDeTeste extends Error {}

async function comFixtureRevertida(fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<void>) {
  await expect(
    db.transaction(async (tx) => {
      await fn(tx)
      throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
    }),
  ).rejects.toThrow(RollbackDeTeste)
}

describe('exercícios financeiros — sobreposição e limites de datas', () => {
  it('rejeita um exercício cujo período se sobrepõe a outro do mesmo condomínio', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste exercicios] sobreposicao' })
        .returning({ id: condominio.id })

      await tx.insert(exercicioFinanceiro).values({
        condominioId: condo.id,
        designacao: '2026',
        anoPrincipal: 2026,
        dataInicio: new Date('2026-01-01'),
        dataFim: new Date('2026-12-31'),
      })

      // Savepoint aninhado: a violação da constraint aborta esta
      // transação interna, não a exterior (que continua a poder ser
      // usada e revertida no fim do teste).
      await expect(
        tx.transaction(async (tx2) => {
          await tx2.insert(exercicioFinanceiro).values({
            condominioId: condo.id,
            designacao: '2026 (duplicado)',
            anoPrincipal: 2026,
            dataInicio: new Date('2026-06-01'),
            dataFim: new Date('2026-06-30'),
          })
        }),
      ).rejects.toMatchObject({ cause: { code: '23P01' } })
    })
  })

  it('rejeita sobreposição no limite inclusivo (novo exercício a começar no último dia do anterior)', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste exercicios] limite inclusivo' })
        .returning({ id: condominio.id })

      await tx.insert(exercicioFinanceiro).values({
        condominioId: condo.id,
        designacao: '2026',
        anoPrincipal: 2026,
        dataInicio: new Date('2026-01-01'),
        dataFim: new Date('2026-12-31'),
      })

      await expect(
        tx.transaction(async (tx2) => {
          await tx2.insert(exercicioFinanceiro).values({
            condominioId: condo.id,
            designacao: '2027 (começa cedo demais)',
            anoPrincipal: 2027,
            dataInicio: new Date('2026-12-31'), // mesmo dia que dataFim do anterior
            dataFim: new Date('2027-12-31'),
          })
        }),
      ).rejects.toMatchObject({ cause: { code: '23P01' } })
    })
  })

  it('aceita um exercício a começar no dia seguinte ao fim do anterior (sem sobreposição, sem gap)', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste exercicios] contiguo' })
        .returning({ id: condominio.id })

      await tx.insert(exercicioFinanceiro).values({
        condominioId: condo.id,
        designacao: '2026',
        anoPrincipal: 2026,
        dataInicio: new Date('2026-01-01'),
        dataFim: new Date('2026-12-31'),
      })

      const [seguinte] = await tx
        .insert(exercicioFinanceiro)
        .values({
          condominioId: condo.id,
          designacao: '2027',
          anoPrincipal: 2027,
          dataInicio: new Date('2027-01-01'),
          dataFim: new Date('2027-12-31'),
        })
        .returning({ id: exercicioFinanceiro.id })

      expect(seguinte.id).toBeGreaterThan(0)
    })
  })

  it('exercícios com as mesmas datas em condomínios diferentes não colidem (isolamento multi-tenant)', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condoA] = await tx
        .insert(condominio)
        .values({ nome: '[teste exercicios] condo A' })
        .returning({ id: condominio.id })
      const [condoB] = await tx
        .insert(condominio)
        .values({ nome: '[teste exercicios] condo B' })
        .returning({ id: condominio.id })

      await tx.insert(exercicioFinanceiro).values({
        condominioId: condoA.id,
        designacao: '2026',
        anoPrincipal: 2026,
        dataInicio: new Date('2026-01-01'),
        dataFim: new Date('2026-12-31'),
      })
      // Mesmas datas, condomínio diferente — não deve ser rejeitado.
      const [exB] = await tx
        .insert(exercicioFinanceiro)
        .values({
          condominioId: condoB.id,
          designacao: '2026',
          anoPrincipal: 2026,
          dataInicio: new Date('2026-01-01'),
          dataFim: new Date('2026-12-31'),
        })
        .returning({ id: exercicioFinanceiro.id })

      expect(exB.id).toBeGreaterThan(0)
    })
  })
})

describe('FKs compostas — nunca cruzar condomínios', () => {
  it('rejeita associar um movimento a uma conta financeira de outro condomínio', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condoA] = await tx
        .insert(condominio)
        .values({ nome: '[teste FK] condo A' })
        .returning({ id: condominio.id })
      const [condoB] = await tx
        .insert(condominio)
        .values({ nome: '[teste FK] condo B' })
        .returning({ id: condominio.id })

      const [contaDoB] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condoB.id, nome: 'Conta do B', tipo: 'ordem' })
        .returning({ id: contaFinanceira.id })

      await expect(
        tx.transaction(async (tx2) => {
          await tx2.insert(movimento).values({
            condominioId: condoA.id, // movimento é do condomínio A...
            userId: 'user-a',
            tipo: 'despesa',
            categoria: 'Teste',
            descricao: 'Tentativa de cruzar condomínios',
            valor: '10.00',
            contaFinanceiraId: contaDoB.id, // ...mas a conta é do condomínio B
          })
        }),
      ).rejects.toThrow()
    })
  })

  it('rejeita associar um movimento a um exercício de outro condomínio', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condoA] = await tx
        .insert(condominio)
        .values({ nome: '[teste FK] condo A (exercicio)' })
        .returning({ id: condominio.id })
      const [condoB] = await tx
        .insert(condominio)
        .values({ nome: '[teste FK] condo B (exercicio)' })
        .returning({ id: condominio.id })

      const [exercicioDoB] = await tx
        .insert(exercicioFinanceiro)
        .values({
          condominioId: condoB.id,
          designacao: '2026',
          anoPrincipal: 2026,
          dataInicio: new Date('2026-01-01'),
          dataFim: new Date('2026-12-31'),
        })
        .returning({ id: exercicioFinanceiro.id })

      await expect(
        tx.transaction(async (tx2) => {
          await tx2.insert(movimento).values({
            condominioId: condoA.id,
            userId: 'user-a',
            tipo: 'despesa',
            categoria: 'Teste',
            descricao: 'Tentativa de cruzar condomínios',
            valor: '10.00',
            exercicioId: exercicioDoB.id,
          })
        }),
      ).rejects.toThrow()
    })
  })

  it('rejeita um saldo inicial que relacione conta e exercício de condomínios diferentes', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condoA] = await tx
        .insert(condominio)
        .values({ nome: '[teste FK] condo A (saldo inicial)' })
        .returning({ id: condominio.id })
      const [condoB] = await tx
        .insert(condominio)
        .values({ nome: '[teste FK] condo B (saldo inicial)' })
        .returning({ id: condominio.id })

      const [contaDoA] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condoA.id, nome: 'Conta do A', tipo: 'ordem' })
        .returning({ id: contaFinanceira.id })
      const [exercicioDoB] = await tx
        .insert(exercicioFinanceiro)
        .values({
          condominioId: condoB.id,
          designacao: '2026',
          anoPrincipal: 2026,
          dataInicio: new Date('2026-01-01'),
          dataFim: new Date('2026-12-31'),
        })
        .returning({ id: exercicioFinanceiro.id })

      await expect(
        tx.transaction(async (tx2) => {
          await tx2.insert(saldoInicialConta).values({
            condominioId: condoA.id,
            contaFinanceiraId: contaDoA.id,
            exercicioId: exercicioDoB.id, // exercício é do condomínio B
            valor: '100.00',
            origem: 'manual',
            definidoPorUserId: 'user-a',
          })
        }),
      ).rejects.toThrow()
    })
  })
})

describe('cálculo de saldo de conta financeira', () => {
  it('só conta movimentos pagos, ignora pendentes e eliminados (soft-delete)', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste saldo] pendentes e eliminados' })
        .returning({ id: condominio.id })
      const [conta] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condo.id, nome: 'Conta', tipo: 'ordem' })
        .returning({ id: contaFinanceira.id })
      const [exercicio] = await tx
        .insert(exercicioFinanceiro)
        .values({
          condominioId: condo.id,
          designacao: '2026',
          anoPrincipal: 2026,
          dataInicio: new Date('2026-01-01'),
          dataFim: new Date('2026-12-31'),
        })
        .returning({ id: exercicioFinanceiro.id })

      await tx.insert(saldoInicialConta).values({
        condominioId: condo.id,
        contaFinanceiraId: conta.id,
        exercicioId: exercicio.id,
        valor: '1000.00',
        origem: 'manual',
        definidoPorUserId: 'user-admin',
      })

      await tx.insert(movimento).values([
        // Paga — conta.
        {
          condominioId: condo.id,
          userId: 'user-admin',
          tipo: 'receita',
          categoria: 'Quota',
          descricao: 'Paga',
          valor: '100.00',
          pago: true,
          contaFinanceiraId: conta.id,
          exercicioId: exercicio.id,
        },
        // Pendente — NÃO deve contar.
        {
          condominioId: condo.id,
          userId: 'user-admin',
          tipo: 'receita',
          categoria: 'Quota',
          descricao: 'Pendente',
          valor: '9999.00',
          pago: false,
          contaFinanceiraId: conta.id,
          exercicioId: exercicio.id,
        },
        // Paga mas eliminada (soft-delete) — NÃO deve contar.
        {
          condominioId: condo.id,
          userId: 'user-admin',
          tipo: 'despesa',
          categoria: 'Teste',
          descricao: 'Eliminada',
          valor: '9999.00',
          pago: true,
          contaFinanceiraId: conta.id,
          exercicioId: exercicio.id,
          deletedAt: new Date(),
        },
        // Despesa paga — conta (negativo).
        {
          condominioId: condo.id,
          userId: 'user-admin',
          tipo: 'despesa',
          categoria: 'Limpeza',
          descricao: 'Paga',
          valor: '30.00',
          pago: true,
          contaFinanceiraId: conta.id,
          exercicioId: exercicio.id,
        },
      ])

      // Reproduz exatamente lib/contas-financeiras.ts:calcularSaldoConta.
      const [inicial] = await tx
        .select()
        .from(saldoInicialConta)
        .where(and(eq(saldoInicialConta.contaFinanceiraId, conta.id), eq(saldoInicialConta.exercicioId, exercicio.id)))
      const movimentosLiquidados = await tx
        .select()
        .from(movimento)
        .where(
          and(
            eq(movimento.contaFinanceiraId, conta.id),
            eq(movimento.exercicioId, exercicio.id),
            eq(movimento.pago, true),
            isNull(movimento.deletedAt),
          ),
        )
      const soma = movimentosLiquidados.reduce(
        (s, mv) => s + (mv.tipo === 'receita' ? Number(mv.valor) : -Number(mv.valor)),
        0,
      )
      const saldo = Number(inicial.valor) + soma

      // 1000 (inicial) + 100 (receita paga) − 30 (despesa paga) = 1070.
      // A pendente (9999) e a eliminada (9999) nunca entram.
      expect(movimentosLiquidados).toHaveLength(2)
      expect(saldo).toBeCloseTo(1070, 2)
    })
  })

  it('lida corretamente com saldo inicial negativo e valores ao cêntimo', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste saldo] negativo e centimos' })
        .returning({ id: condominio.id })
      const [conta] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condo.id, nome: 'Conta', tipo: 'ordem' })
        .returning({ id: contaFinanceira.id })
      const [exercicio] = await tx
        .insert(exercicioFinanceiro)
        .values({
          condominioId: condo.id,
          designacao: '2026',
          anoPrincipal: 2026,
          dataInicio: new Date('2026-01-01'),
          dataFim: new Date('2026-12-31'),
        })
        .returning({ id: exercicioFinanceiro.id })

      await tx.insert(saldoInicialConta).values({
        condominioId: condo.id,
        contaFinanceiraId: conta.id,
        exercicioId: exercicio.id,
        valor: '-45.33', // conta a descoberto no início do exercício
        origem: 'manual',
        definidoPorUserId: 'user-admin',
      })
      await tx.insert(movimento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        tipo: 'receita',
        categoria: 'Quota',
        descricao: 'Quota',
        valor: '45.34',
        pago: true,
        contaFinanceiraId: conta.id,
        exercicioId: exercicio.id,
      })

      const [inicial] = await tx
        .select()
        .from(saldoInicialConta)
        .where(and(eq(saldoInicialConta.contaFinanceiraId, conta.id), eq(saldoInicialConta.exercicioId, exercicio.id)))
      const movimentosLiquidados = await tx
        .select()
        .from(movimento)
        .where(and(eq(movimento.contaFinanceiraId, conta.id), eq(movimento.pago, true), isNull(movimento.deletedAt)))
      const soma = movimentosLiquidados.reduce((s, mv) => s + Number(mv.valor), 0)
      const saldo = Number(inicial.valor) + soma

      expect(saldo).toBeCloseTo(0.01, 2)
    })
  })
})

describe('deteção de campos alterados em conta financeira (T1)', () => {
  // Reproduz atualizarContaFinanceira (app/actions/contas-financeiras.ts):
  // leitura prévia + comparação, sem UPDATE quando nada muda.
  type CamposEditaveisConta = {
    nome: string
    banco: string | null
    iban: string | null
    tipo: string
    moeda: string
    notaTransitoria: string | null
  }

  it('não regista alteração nem faz UPDATE quando os valores enviados são iguais', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste T1] sem alteracao' })
        .returning({ id: condominio.id })
      const [conta] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condo.id, nome: 'Conta Ordem', banco: 'BCP', tipo: 'ordem', moeda: 'EUR' })
        .returning({ id: contaFinanceira.id, updatedAt: contaFinanceira.updatedAt })

      const [anterior] = await tx
        .select({
          nome: contaFinanceira.nome,
          banco: contaFinanceira.banco,
          iban: contaFinanceira.iban,
          tipo: contaFinanceira.tipo,
          moeda: contaFinanceira.moeda,
          notaTransitoria: contaFinanceira.notaTransitoria,
        })
        .from(contaFinanceira)
        .where(and(eq(contaFinanceira.id, conta.id), eq(contaFinanceira.condominioId, condo.id)))
        .limit(1)

      const novosValores: CamposEditaveisConta = {
        nome: 'Conta Ordem',
        banco: 'BCP',
        iban: null,
        tipo: 'ordem',
        moeda: 'EUR',
        notaTransitoria: null,
      }
      const alterados = (Object.keys(novosValores) as (keyof CamposEditaveisConta)[]).filter(
        (campo) => anterior[campo] !== novosValores[campo],
      )
      expect(alterados).toHaveLength(0)

      const [depois] = await tx
        .select({ updatedAt: contaFinanceira.updatedAt })
        .from(contaFinanceira)
        .where(eq(contaFinanceira.id, conta.id))
      expect(depois.updatedAt).toEqual(conta.updatedAt)
    })
  })

  it('deteta só o IBAN como alterado quando só o IBAN muda', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste T1] iban alterado' })
        .returning({ id: condominio.id })
      const [conta] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condo.id, nome: 'Conta', tipo: 'ordem', iban: 'PT50000000000000000000000' })
        .returning({ id: contaFinanceira.id })

      const [anterior] = await tx
        .select({
          nome: contaFinanceira.nome,
          banco: contaFinanceira.banco,
          iban: contaFinanceira.iban,
          tipo: contaFinanceira.tipo,
          moeda: contaFinanceira.moeda,
          notaTransitoria: contaFinanceira.notaTransitoria,
        })
        .from(contaFinanceira)
        .where(eq(contaFinanceira.id, conta.id))
        .limit(1)

      const novosValores: CamposEditaveisConta = {
        nome: anterior.nome,
        banco: anterior.banco,
        iban: 'PT50111111111111111111111',
        tipo: anterior.tipo,
        moeda: anterior.moeda,
        notaTransitoria: anterior.notaTransitoria,
      }
      const alterados = (Object.keys(novosValores) as (keyof CamposEditaveisConta)[]).filter(
        (campo) => anterior[campo] !== novosValores[campo],
      )
      expect(alterados).toEqual(['iban'])
    })
  })

  it('deteta a remoção do IBAN como alteração', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste T1] iban removido' })
        .returning({ id: condominio.id })
      const [conta] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condo.id, nome: 'Conta', tipo: 'ordem', iban: 'PT50000000000000000000000' })
        .returning({ id: contaFinanceira.id })

      const [anterior] = await tx
        .select({
          nome: contaFinanceira.nome,
          banco: contaFinanceira.banco,
          iban: contaFinanceira.iban,
          tipo: contaFinanceira.tipo,
          moeda: contaFinanceira.moeda,
          notaTransitoria: contaFinanceira.notaTransitoria,
        })
        .from(contaFinanceira)
        .where(eq(contaFinanceira.id, conta.id))
        .limit(1)

      const novosValores: CamposEditaveisConta = { ...anterior, iban: null }
      const alterados = (Object.keys(novosValores) as (keyof CamposEditaveisConta)[]).filter(
        (campo) => anterior[campo] !== novosValores[campo],
      )
      expect(alterados).toEqual(['iban'])
    })
  })

  it('não encontra a conta quando o condomínio não corresponde (isolamento multi-tenant)', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condoA] = await tx
        .insert(condominio)
        .values({ nome: '[teste T1] condo A' })
        .returning({ id: condominio.id })
      const [condoB] = await tx
        .insert(condominio)
        .values({ nome: '[teste T1] condo B' })
        .returning({ id: condominio.id })
      const [contaDoA] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condoA.id, nome: 'Conta do A', tipo: 'ordem' })
        .returning({ id: contaFinanceira.id })

      const linhas = await tx
        .select()
        .from(contaFinanceira)
        .where(and(eq(contaFinanceira.id, contaDoA.id), eq(contaFinanceira.condominioId, condoB.id)))
      expect(linhas).toHaveLength(0) // reproduz o "Conta não encontrada" para o condomínio errado
    })
  })
})

describe('operações em massa só afetam o próprio condomínio (T2)', () => {
  it('associação por intervalo de datas não afeta movimentos de outro condomínio', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condoA] = await tx
        .insert(condominio)
        .values({ nome: '[teste T2] condo A' })
        .returning({ id: condominio.id })
      const [condoB] = await tx
        .insert(condominio)
        .values({ nome: '[teste T2] condo B' })
        .returning({ id: condominio.id })
      const [exercicioA] = await tx
        .insert(exercicioFinanceiro)
        .values({
          condominioId: condoA.id,
          designacao: '2026',
          anoPrincipal: 2026,
          dataInicio: new Date('2026-01-01'),
          dataFim: new Date('2026-12-31'),
        })
        .returning({ id: exercicioFinanceiro.id })

      await tx.insert(movimento).values([
        {
          condominioId: condoA.id,
          userId: 'user-a',
          tipo: 'despesa',
          categoria: 'Teste',
          descricao: 'Do condomínio A',
          valor: '10.00',
          data: new Date('2026-03-01'),
        },
        {
          condominioId: condoB.id,
          userId: 'user-b',
          tipo: 'despesa',
          categoria: 'Teste',
          descricao: 'Do condomínio B (não deve ser afetado)',
          valor: '20.00',
          data: new Date('2026-03-01'),
        },
      ])

      // Reproduz confirmarAssociacaoExercicio: filtra sempre por
      // condominioId do ator, nunca por um valor vindo do cliente.
      const afetados = await tx
        .update(movimento)
        .set({ exercicioId: exercicioA.id })
        .where(
          and(
            eq(movimento.condominioId, condoA.id),
            isNull(movimento.exercicioId),
            isNull(movimento.deletedAt),
            gte(movimento.data, new Date('2026-01-01')),
            lte(movimento.data, new Date('2026-12-31')),
          ),
        )
        .returning({ id: movimento.id })

      expect(afetados).toHaveLength(1)

      const [movimentoB] = await tx.select().from(movimento).where(eq(movimento.condominioId, condoB.id))
      expect(movimentoB.exercicioId).toBeNull()
    })
  })
})

describe('associação em massa é idempotente', () => {
  it('correr a mesma associação duas vezes não duplica nem falha', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste associacao] idempotencia' })
        .returning({ id: condominio.id })
      const [conta] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condo.id, nome: 'Conta', tipo: 'ordem' })
        .returning({ id: contaFinanceira.id })

      await tx.insert(movimento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        tipo: 'despesa',
        categoria: 'Teste',
        descricao: 'Movimento a associar',
        valor: '10.00',
        destino: 'geral',
      })

      // Reproduz confirmarAssociacaoConta: só afeta linhas ainda sem conta.
      const associar = () =>
        tx
          .update(movimento)
          .set({ contaFinanceiraId: conta.id })
          .where(
            and(
              eq(movimento.condominioId, condo.id),
              eq(movimento.destino, 'geral'),
              isNull(movimento.contaFinanceiraId),
              isNull(movimento.deletedAt),
            ),
          )
          .returning({ id: movimento.id })

      const primeira = await associar()
      const segunda = await associar()

      expect(primeira).toHaveLength(1)
      expect(segunda).toHaveLength(0) // já não há candidatos na segunda vez
    })
  })
})
