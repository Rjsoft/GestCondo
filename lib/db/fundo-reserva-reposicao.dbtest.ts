// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Toda a fixture corre dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Reproduz a lógica de app/actions/fundo-reserva.ts diretamente (as
// próprias server actions exigem sessão via requireAdmin/
// requireAcessoFinanceiro, não testáveis fora de um pedido — mesmo padrão
// já usado em lib/db/cobranca.dbtest.ts e outros *.dbtest.ts).
import { and, eq, gte, isNull } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, fundoReservaReposicao, movimento } from './schema'

class RollbackDeTeste extends Error {}

async function rollback(fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<void>) {
  await expect(
    db.transaction(async (tx) => {
      await fn(tx)
      throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
    }),
  ).rejects.toThrow(RollbackDeTeste)
}

// Reproduz app/actions/fundo-reserva.ts:calcularValorReposto — soma real
// de receitas do fundo de reserva lançadas desde o início do plano, nunca
// guardada, sempre recalculada.
async function calcularValorReposto(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  condominioId: number,
  dataInicio: Date,
) {
  const receitas = await tx
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, condominioId),
        eq(movimento.tipo, 'receita'),
        eq(movimento.destino, 'reserva'),
        isNull(movimento.deletedAt),
        gte(movimento.data, dataInicio),
      ),
    )
  return receitas.reduce((s, mv) => s + Number(mv.valor), 0)
}

describe('fundo de reserva: plano de reposição', () => {
  it('cria um plano de reposição em_curso', async () => {
    await rollback(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste reposição] Condomínio' })
        .returning({ id: condominio.id })

      const [plano] = await tx
        .insert(fundoReservaReposicao)
        .values({
          condominioId: condo.id,
          descricao: 'Reposição após obra de pintura',
          valorAReposicao: '1000.00',
          dataInicio: new Date(),
          userId: 'user-admin',
        })
        .returning()

      expect(plano.estado).toBe('em_curso')
      expect(plano.valorRepostoFinal).toBeNull()
    })
  })

  it('só permite um plano em_curso por condomínio de cada vez (índice único parcial)', async () => {
    await rollback(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste reposição] Condomínio' })
        .returning({ id: condominio.id })

      const [plano1] = await tx
        .insert(fundoReservaReposicao)
        .values({
          condominioId: condo.id,
          descricao: 'Primeiro plano',
          valorAReposicao: '500.00',
          dataInicio: new Date(),
          userId: 'user-admin',
        })
        .returning({ id: fundoReservaReposicao.id })

      // Savepoint próprio: a violação do índice único aborta a
      // subtransação, não a transação exterior (continua a ser usada a seguir).
      await expect(
        tx.transaction(async (savepoint) =>
          savepoint.insert(fundoReservaReposicao).values({
            condominioId: condo.id,
            descricao: 'Segundo plano, ainda com o primeiro em curso',
            valorAReposicao: '300.00',
            dataInicio: new Date(),
            userId: 'user-admin',
          }),
        ),
      ).rejects.toThrow()

      // Depois de concluir o primeiro, já é possível criar um segundo.
      await tx
        .update(fundoReservaReposicao)
        .set({ estado: 'concluido', valorRepostoFinal: '500.00' })
        .where(eq(fundoReservaReposicao.id, plano1.id))
      await expect(
        tx.insert(fundoReservaReposicao).values({
          condominioId: condo.id,
          descricao: 'Segundo plano, depois de concluído o primeiro',
          valorAReposicao: '300.00',
          dataInicio: new Date(),
          userId: 'user-admin',
        }),
      ).resolves.not.toThrow()
    })
  })

  it('o valor reposto conta só as receitas de reserva lançadas depois do início do plano', async () => {
    await rollback(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste reposição] Condomínio' })
        .returning({ id: condominio.id })

      const dataInicio = new Date('2026-06-01')
      const [plano] = await tx
        .insert(fundoReservaReposicao)
        .values({
          condominioId: condo.id,
          descricao: 'Reposição',
          valorAReposicao: '1000.00',
          dataInicio,
          userId: 'user-admin',
        })
        .returning()

      // Receita de reserva ANTES do início do plano — não deve contar.
      await tx.insert(movimento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        tipo: 'receita',
        categoria: 'Quota',
        descricao: 'Antes do plano',
        valor: '999.00',
        destino: 'reserva',
        data: new Date('2026-05-01'),
      })
      // Receitas de reserva DEPOIS do início — devem contar.
      await tx.insert(movimento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        tipo: 'receita',
        categoria: 'Quota',
        descricao: 'Depois do plano, 1',
        valor: '200.00',
        destino: 'reserva',
        data: new Date('2026-06-15'),
      })
      await tx.insert(movimento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        tipo: 'receita',
        categoria: 'Quota',
        descricao: 'Depois do plano, 2',
        valor: '150.00',
        destino: 'reserva',
        data: new Date('2026-07-01'),
      })
      // Receita de reserva depois do início, mas eliminada — não deve contar.
      await tx.insert(movimento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        tipo: 'receita',
        categoria: 'Quota',
        descricao: 'Eliminada',
        valor: '500.00',
        destino: 'reserva',
        data: new Date('2026-06-20'),
        deletedAt: new Date(),
      })
      // Despesa de reserva (uma retirada) depois do início — não deve contar
      // como reposição (só receitas contam).
      await tx.insert(movimento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        tipo: 'despesa',
        categoria: 'Obra',
        descricao: 'Retirada',
        valor: '80.00',
        destino: 'reserva',
        data: new Date('2026-06-18'),
      })
      // Receita normal (destino "geral") depois do início — não conta para
      // a reposição do fundo de reserva.
      await tx.insert(movimento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        tipo: 'receita',
        categoria: 'Quota',
        descricao: 'Quota normal',
        valor: '90.00',
        destino: 'geral',
        data: new Date('2026-06-16'),
      })

      const valorReposto = await calcularValorReposto(tx, condo.id, plano.dataInicio)
      expect(valorReposto).toBe(350)
    })
  })

  // Regressão: encontrado em teste manual 2026-08-18 — um plano criado a
  // meio do dia (ex. 07:32) com dataInicio como `timestamp` excluía
  // silenciosamente uma receita lançada no MESMO dia, mas antes dessa
  // hora (o seletor de data só permite indicar o dia, nunca a hora, e o
  // valor resultante caía tipicamente à meia-noite local — antes da hora
  // exata em que o plano foi criado). Corrigido mudando dataInicio para
  // `date` (sem hora), mesmo padrão de exercicioFinanceiro.dataInicio.
  it('conta uma receita lançada no mesmo dia civil em que o plano foi criado', async () => {
    await rollback(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste reposição mesmo dia] Condomínio' })
        .returning({ id: condominio.id })

      // Plano "criado" a meio do dia 18/08 (dataInicio é `date`, sem hora).
      const [plano] = await tx
        .insert(fundoReservaReposicao)
        .values({
          condominioId: condo.id,
          descricao: 'Reposição',
          valorAReposicao: '1000.00',
          dataInicio: new Date('2026-08-18'),
          userId: 'user-admin',
        })
        .returning()

      // Receita lançada no mesmo dia civil, à meia-noite local (como o
      // seletor de data do formulário de movimentos sempre produz).
      await tx.insert(movimento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        tipo: 'receita',
        categoria: 'Quota',
        descricao: 'Receita do mesmo dia',
        valor: '50.00',
        destino: 'reserva',
        data: new Date('2026-08-18'),
      })

      const valorReposto = await calcularValorReposto(tx, condo.id, plano.dataInicio)
      expect(valorReposto).toBe(50)
    })
  })

  it('isolamento multi-tenant: o plano de um condomínio nunca aparece numa consulta de outro', async () => {
    await rollback(async (tx) => {
      const [condoA] = await tx
        .insert(condominio)
        .values({ nome: '[teste reposição isolamento] Condomínio A' })
        .returning({ id: condominio.id })
      const [condoB] = await tx
        .insert(condominio)
        .values({ nome: '[teste reposição isolamento] Condomínio B' })
        .returning({ id: condominio.id })

      await tx.insert(fundoReservaReposicao).values({
        condominioId: condoA.id,
        descricao: 'Plano A',
        valorAReposicao: '100.00',
        dataInicio: new Date(),
        userId: 'user-a',
      })
      await tx.insert(fundoReservaReposicao).values({
        condominioId: condoB.id,
        descricao: 'Plano B',
        valorAReposicao: '200.00',
        dataInicio: new Date(),
        userId: 'user-b',
      })

      const planosDoA = await tx
        .select()
        .from(fundoReservaReposicao)
        .where(eq(fundoReservaReposicao.condominioId, condoA.id))
      expect(planosDoA.map((p) => p.descricao)).toEqual(['Plano A'])
    })
  })

  it('concluir/cancelar congela o valor reposto — receitas lançadas depois já não alteram o histórico', async () => {
    await rollback(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste reposição congelamento] Condomínio' })
        .returning({ id: condominio.id })

      const dataInicio = new Date('2026-06-01')
      const [plano] = await tx
        .insert(fundoReservaReposicao)
        .values({
          condominioId: condo.id,
          descricao: 'Reposição',
          valorAReposicao: '1000.00',
          dataInicio,
          userId: 'user-admin',
        })
        .returning()

      await tx.insert(movimento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        tipo: 'receita',
        categoria: 'Quota',
        descricao: 'Antes de concluir',
        valor: '400.00',
        destino: 'reserva',
        data: new Date('2026-06-15'),
      })

      const valorNaConclusao = await calcularValorReposto(tx, condo.id, plano.dataInicio)
      await tx
        .update(fundoReservaReposicao)
        .set({ estado: 'concluido', valorRepostoFinal: valorNaConclusao.toFixed(2) })
        .where(eq(fundoReservaReposicao.id, plano.id))

      // Receita lançada DEPOIS de o plano ter sido concluído — não deve
      // alterar o valorRepostoFinal já gravado.
      await tx.insert(movimento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        tipo: 'receita',
        categoria: 'Quota',
        descricao: 'Depois de concluir',
        valor: '999.00',
        destino: 'reserva',
        data: new Date('2026-08-01'),
      })

      const [planoFinal] = await tx
        .select()
        .from(fundoReservaReposicao)
        .where(eq(fundoReservaReposicao.id, plano.id))
      expect(Number(planoFinal.valorRepostoFinal)).toBe(400)
    })
  })
})
