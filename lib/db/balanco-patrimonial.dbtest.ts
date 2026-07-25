// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Toda a fixture corre dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Reproduz a agregação de
// app/actions/contas-financeiras.ts:getBalancoPatrimonial (G09) — não pode
// chamar a server action diretamente (exige sessão via
// requireAcessoFinanceiro), nem as funções puras que ela reutiliza
// (calcularSaldoConta, calcularSaldosDocumentosFornecedor): ambas usam o
// `db` global do módulo, não a `tx` da transação de teste, e por isso NUNCA
// veem dados ainda não commitados dentro da transação de teste (mesma razão
// por que lib/db/documentos-fornecedor.dbtest.ts também reproduz a lógica
// manualmente em vez de chamar essas funções). Todas as agregações abaixo
// são reproduzidas à mão com `tx`, espelhando exatamente a lógica das
// funções reais.
import { and, eq, isNull } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import {
  condominio,
  contaFinanceira,
  documentoFornecedor,
  exercicioFinanceiro,
  movimento,
  pagamentoDocumentoFornecedor,
  saldoInicialConta,
} from './schema'

class RollbackDeTeste extends Error {}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

// Espelha lib/contas-financeiras.ts:calcularSaldoConta.
async function saldoContaTx(tx: Tx, contaFinanceiraId: number, exercicioId: number) {
  const [inicial] = await tx
    .select()
    .from(saldoInicialConta)
    .where(
      and(
        eq(saldoInicialConta.contaFinanceiraId, contaFinanceiraId),
        eq(saldoInicialConta.exercicioId, exercicioId),
      ),
    )
    .limit(1)
  const movimentosLiquidados = await tx
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.contaFinanceiraId, contaFinanceiraId),
        eq(movimento.exercicioId, exercicioId),
        eq(movimento.pago, true),
        isNull(movimento.deletedAt),
      ),
    )
  const soma = movimentosLiquidados.reduce(
    (s, mv) => s + (mv.tipo === 'receita' ? Number(mv.valor) : -Number(mv.valor)),
    0,
  )
  const saldoInicial = inicial ? Number(inicial.valor) : 0
  return saldoInicial + soma
}

// Espelha lib/documentos-fornecedor.ts:calcularSaldosDocumentosFornecedor.
async function saldosDocumentosTx(tx: Tx, condominioId: number) {
  const documentos = await tx
    .select({ id: documentoFornecedor.id, valor: documentoFornecedor.valor })
    .from(documentoFornecedor)
    .where(and(eq(documentoFornecedor.condominioId, condominioId), isNull(documentoFornecedor.deletedAt)))
  if (documentos.length === 0) return 0

  const pagamentos = await tx
    .select()
    .from(pagamentoDocumentoFornecedor)
    .where(eq(pagamentoDocumentoFornecedor.condominioId, condominioId))
  const pagoPorDocumento = new Map<number, number>()
  for (const p of pagamentos) {
    const atual = pagoPorDocumento.get(p.documentoFornecedorId) ?? 0
    pagoPorDocumento.set(p.documentoFornecedorId, atual + Number(p.valor))
  }

  return documentos.reduce((s, doc) => {
    const valor = Number(doc.valor)
    const valorPago = pagoPorDocumento.get(doc.id) ?? 0
    const saldo = valor - valorPago
    return saldo > 0 ? s + saldo : s
  }, 0)
}

async function saldoFundoReserva(tx: Tx, condominioId: number) {
  const movimentosReserva = await tx
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, condominioId),
        eq(movimento.destino, 'reserva'),
        isNull(movimento.deletedAt),
      ),
    )
  const receitas = movimentosReserva
    .filter((m) => m.tipo === 'receita')
    .reduce((s, m) => s + Number(m.valor), 0)
  const despesas = movimentosReserva
    .filter((m) => m.tipo === 'despesa')
    .reduce((s, m) => s + Number(m.valor), 0)
  return receitas - despesas
}

describe('balanço patrimonial (Ativo/Passivo/Situação Líquida)', () => {
  it('calcula os três blocos corretamente e a equação bate sempre certo por construção', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste balanço patrimonial] Condomínio' })
          .returning({ id: condominio.id })

        const [exercicio] = await tx
          .insert(exercicioFinanceiro)
          .values({
            condominioId: condo.id,
            designacao: '2026',
            anoPrincipal: 2026,
            dataInicio: new Date('2026-01-01'),
            dataFim: new Date('2026-12-31'),
            estado: 'aberto',
          })
          .returning({ id: exercicioFinanceiro.id })

        const [conta] = await tx
          .insert(contaFinanceira)
          .values({ condominioId: condo.id, nome: 'Conta à ordem', tipo: 'ordem', estado: 'ativa' })
          .returning({ id: contaFinanceira.id })

        await tx.insert(saldoInicialConta).values({
          condominioId: condo.id,
          contaFinanceiraId: conta.id,
          exercicioId: exercicio.id,
          valor: '1000.00',
          origem: 'manual',
          definidoPorUserId: 'user-admin',
        })

        // Disponibilidades: 1000 (saldo inicial) + 500 (receita paga nesta conta/exercício) = 1500
        await tx.insert(movimento).values({
          condominioId: condo.id,
          userId: 'user-admin',
          tipo: 'receita',
          categoria: 'Quota',
          descricao: 'Quota de teste',
          valor: '500.00',
          pago: true,
          destino: 'geral',
          contaFinanceiraId: conta.id,
          exercicioId: exercicio.id,
        })

        // Dívida de condómino (quota por receber): 200
        await tx.insert(movimento).values({
          condominioId: condo.id,
          userId: 'user-admin',
          tipo: 'receita',
          categoria: 'Quota',
          descricao: 'Quota em dívida',
          valor: '200.00',
          pago: false,
          destino: 'geral',
        })

        // Fundo de reserva: 300
        await tx.insert(movimento).values({
          condominioId: condo.id,
          userId: 'user-admin',
          tipo: 'receita',
          categoria: 'Quota reserva',
          descricao: 'Quota fundo de reserva',
          valor: '300.00',
          pago: true,
          destino: 'reserva',
        })

        // Documento de fornecedor parcialmente pago: saldo 250, entra no passivo
        const [docParcial] = await tx
          .insert(documentoFornecedor)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            categoria: 'Manutenção',
            dataEmissao: new Date('2026-02-01'),
            valor: '400.00',
          })
          .returning({ id: documentoFornecedor.id })
        await tx.insert(pagamentoDocumentoFornecedor).values({
          condominioId: condo.id,
          userId: 'user-admin',
          documentoFornecedorId: docParcial.id,
          valor: '150.00',
          dataPagamento: new Date('2026-02-10'),
        })

        // Documento de fornecedor totalmente pago: saldo 0, NÃO entra no passivo
        const [docLiquidado] = await tx
          .insert(documentoFornecedor)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            categoria: 'Limpeza',
            dataEmissao: new Date('2026-02-01'),
            valor: '100.00',
          })
          .returning({ id: documentoFornecedor.id })
        await tx.insert(pagamentoDocumentoFornecedor).values({
          condominioId: condo.id,
          userId: 'user-admin',
          documentoFornecedorId: docLiquidado.id,
          valor: '100.00',
          dataPagamento: new Date('2026-02-15'),
        })

        // --- Reproduz getBalancoPatrimonial ---
        const disponibilidades = await saldoContaTx(tx, conta.id, exercicio.id)
        expect(disponibilidades).toBe(1500)

        const quotasPorReceber = await tx
          .select({ valor: movimento.valor })
          .from(movimento)
          .where(
            and(
              eq(movimento.condominioId, condo.id),
              eq(movimento.tipo, 'receita'),
              eq(movimento.pago, false),
              eq(movimento.destino, 'geral'),
              isNull(movimento.deletedAt),
            ),
          )
        const dividasCondominos = quotasPorReceber.reduce((s, m) => s + Number(m.valor), 0)
        expect(dividasCondominos).toBe(200)

        const ativoTotal = disponibilidades + dividasCondominos
        expect(ativoTotal).toBe(1700)

        const dividasFornecedores = await saldosDocumentosTx(tx, condo.id)
        expect(dividasFornecedores).toBe(250)

        const passivoTotal = dividasFornecedores
        const fundoReserva = await saldoFundoReserva(tx, condo.id)
        expect(fundoReserva).toBe(300)

        const resultadosAcumulados = ativoTotal - passivoTotal - fundoReserva
        const situacaoLiquidaTotal = fundoReserva + resultadosAcumulados
        expect(situacaoLiquidaTotal).toBe(1450)

        // A equação contabilística tem de bater sempre certo, por construção.
        expect(passivoTotal + situacaoLiquidaTotal).toBe(ativoTotal)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('isolamento multi-tenant: dados de outro condomínio nunca entram na soma', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condoA] = await tx
          .insert(condominio)
          .values({ nome: '[teste isolamento] Condomínio A' })
          .returning({ id: condominio.id })
        const [condoB] = await tx
          .insert(condominio)
          .values({ nome: '[teste isolamento] Condomínio B' })
          .returning({ id: condominio.id })

        // Dados de A: dívida de 100
        await tx.insert(movimento).values({
          condominioId: condoA.id,
          userId: 'user-admin',
          tipo: 'receita',
          categoria: 'Quota',
          descricao: 'Quota de A',
          valor: '100.00',
          pago: false,
          destino: 'geral',
        })

        // Dados de B: dívida de 999 — nunca deve aparecer na soma de A.
        await tx.insert(movimento).values({
          condominioId: condoB.id,
          userId: 'user-admin',
          tipo: 'receita',
          categoria: 'Quota',
          descricao: 'Quota de B',
          valor: '999.00',
          pago: false,
          destino: 'geral',
        })

        const quotasPorReceberDeA = await tx
          .select({ valor: movimento.valor })
          .from(movimento)
          .where(
            and(
              eq(movimento.condominioId, condoA.id),
              eq(movimento.tipo, 'receita'),
              eq(movimento.pago, false),
              eq(movimento.destino, 'geral'),
              isNull(movimento.deletedAt),
            ),
          )
        const dividasCondominosDeA = quotasPorReceberDeA.reduce((s, m) => s + Number(m.valor), 0)
        expect(dividasCondominosDeA).toBe(100)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
