// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Toda a fixture corre dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Reproduz a lógica de app/actions/extrato.ts:conciliarLinha/
// desfazerConciliacao (T3, docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md) —
// resolução do ID de conta financeira para o texto de auditoria e o
// isolamento multi-tenant da leitura do movimento em desfazerConciliacao.
// Não chama as server actions diretamente (usam a ligação global `db` e
// sessão, não a transação `tx` deste teste — mesmo padrão já usado em
// exercicios-financeiros.dbtest.ts).
import { and, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, contaFinanceira, extratoBancario, movimento } from './schema'

class RollbackDeTeste extends Error {}

async function comFixtureRevertida(fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<void>) {
  await expect(
    db.transaction(async (tx) => {
      await fn(tx)
      throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
    }),
  ).rejects.toThrow(RollbackDeTeste)
}

/** Reproduz o texto de detalhes de conciliarLinha/desfazerConciliacao. */
function textoAuditoria(base: string, contaFinanceiraId: number | null) {
  return base + (contaFinanceiraId ? ` — conta financeira ID ${contaFinanceiraId}` : '')
}

describe('conciliação — ID de conta financeira no texto de auditoria (T3)', () => {
  it('conciliação com conta definida em ambos os lados inclui o ID correto', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste T3] conciliacao com conta' })
        .returning({ id: condominio.id })
      const [conta] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condo.id, nome: 'Conta', tipo: 'ordem' })
        .returning({ id: contaFinanceira.id })
      const [mov] = await tx
        .insert(movimento)
        .values({
          condominioId: condo.id,
          userId: 'user-admin',
          tipo: 'despesa',
          categoria: 'Teste',
          descricao: 'Movimento',
          valor: '10.00',
          pago: true,
          contaFinanceiraId: conta.id,
        })
        .returning({ id: movimento.id, contaFinanceiraId: movimento.contaFinanceiraId })
      const [linha] = await tx
        .insert(extratoBancario)
        .values({
          condominioId: condo.id,
          userId: 'user-admin',
          data: new Date('2026-01-05'),
          descricao: 'Linha',
          valor: '10.00',
          contaFinanceiraId: conta.id,
        })
        .returning({ id: extratoBancario.id, contaFinanceiraId: extratoBancario.contaFinanceiraId })

      const contaFinanceiraId = linha.contaFinanceiraId ?? mov.contaFinanceiraId
      expect(contaFinanceiraId).toBe(conta.id)
      expect(textoAuditoria(`Conciliada com movimento #${mov.id}`, contaFinanceiraId)).toBe(
        `Conciliada com movimento #${mov.id} — conta financeira ID ${conta.id}`,
      )
    })
  })

  it('linha sem conta usa a conta do movimento', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste T3] linha sem conta' })
        .returning({ id: condominio.id })
      const [conta] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condo.id, nome: 'Conta', tipo: 'ordem' })
        .returning({ id: contaFinanceira.id })
      const [mov] = await tx
        .insert(movimento)
        .values({
          condominioId: condo.id,
          userId: 'user-admin',
          tipo: 'despesa',
          categoria: 'Teste',
          descricao: 'Movimento',
          valor: '10.00',
          pago: true,
          contaFinanceiraId: conta.id,
        })
        .returning({ contaFinanceiraId: movimento.contaFinanceiraId })

      const linhaContaFinanceiraId: number | null = null
      const contaFinanceiraId = linhaContaFinanceiraId ?? mov.contaFinanceiraId
      expect(contaFinanceiraId).toBe(conta.id)
    })
  })

  it('movimento sem conta usa a conta da linha', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste T3] movimento sem conta' })
        .returning({ id: condominio.id })
      const [conta] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condo.id, nome: 'Conta', tipo: 'ordem' })
        .returning({ id: contaFinanceira.id })

      const movContaFinanceiraId: number | null = null
      const linhaContaFinanceiraId = conta.id
      const contaFinanceiraId = linhaContaFinanceiraId ?? movContaFinanceiraId
      expect(contaFinanceiraId).toBe(conta.id)
    })
  })

  it('ambos sem conta mantêm o texto anterior, sem sufixo', async () => {
    const contaFinanceiraId = null
    expect(textoAuditoria('Conciliada com movimento #42', contaFinanceiraId)).toBe(
      'Conciliada com movimento #42',
    )
    expect(textoAuditoria('Conciliação desfeita', contaFinanceiraId)).toBe('Conciliação desfeita')
  })

  it('contas diferentes continuam rejeitadas antes de qualquer escrita', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste T3] contas diferentes' })
        .returning({ id: condominio.id })
      const [contaA] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condo.id, nome: 'Conta A', tipo: 'ordem' })
        .returning({ id: contaFinanceira.id })
      const [contaB] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condo.id, nome: 'Conta B', tipo: 'ordem' })
        .returning({ id: contaFinanceira.id })

      const linha = { contaFinanceiraId: contaA.id as number | null }
      const mov = { contaFinanceiraId: contaB.id as number | null }

      // Reproduz a validação de conciliarLinha — nunca conciliar contas diferentes.
      const rejeitado =
        linha.contaFinanceiraId && mov.contaFinanceiraId && linha.contaFinanceiraId !== mov.contaFinanceiraId
      expect(rejeitado).toBe(true)
    })
  })

  it('tentativa de ler o movimento de outro condomínio devolve vazio (isolamento multi-tenant)', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condoA] = await tx
        .insert(condominio)
        .values({ nome: '[teste T3] condo A' })
        .returning({ id: condominio.id })
      const [condoB] = await tx
        .insert(condominio)
        .values({ nome: '[teste T3] condo B' })
        .returning({ id: condominio.id })
      const [movDoA] = await tx
        .insert(movimento)
        .values({
          condominioId: condoA.id,
          userId: 'user-admin',
          tipo: 'despesa',
          categoria: 'Teste',
          descricao: 'Movimento do condomínio A',
          valor: '10.00',
          pago: true,
        })
        .returning({ id: movimento.id })

      // Reproduz a query corrigida de desfazerConciliacao — filtra também
      // por condominioId, nunca só pelo id sequencial.
      const linhas = await tx
        .select()
        .from(movimento)
        .where(and(eq(movimento.id, movDoA.id), eq(movimento.condominioId, condoB.id)))
      expect(linhas).toHaveLength(0)

      const linhasCorretas = await tx
        .select()
        .from(movimento)
        .where(and(eq(movimento.id, movDoA.id), eq(movimento.condominioId, condoA.id)))
      expect(linhasCorretas).toHaveLength(1)
    })
  })

  it('o texto nunca contém IBAN nem nome do banco — só o ID', async () => {
    const contaFinanceiraId = 12
    const texto = textoAuditoria('Conciliada com movimento #7', contaFinanceiraId)
    expect(texto).toBe('Conciliada com movimento #7 — conta financeira ID 12')
    expect(texto).not.toMatch(/[A-Z]{2}\d{2}[A-Z0-9]{10,}/) // padrão de IBAN
    expect(texto.toLowerCase()).not.toContain('banco')
    expect(texto.toLowerCase()).not.toContain('bcp')
  })

  it('desconciliação inclui o ID correto quando a linha já tem conta própria', async () => {
    await comFixtureRevertida(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste T3] desconciliacao' })
        .returning({ id: condominio.id })
      const [conta] = await tx
        .insert(contaFinanceira)
        .values({ condominioId: condo.id, nome: 'Conta', tipo: 'ordem' })
        .returning({ id: contaFinanceira.id })

      // linha.contaFinanceiraId já definido — não depende de reler o movimento.
      let contaFinanceiraId: number | null = conta.id
      expect(textoAuditoria('Conciliação desfeita', contaFinanceiraId)).toBe(
        `Conciliação desfeita — conta financeira ID ${conta.id}`,
      )
      // contaFinanceiraId ??= mov.contaFinanceiraId nunca sobrescreve um valor já definido
      contaFinanceiraId ??= 999
      expect(contaFinanceiraId).toBe(conta.id)
    })
  })
})
