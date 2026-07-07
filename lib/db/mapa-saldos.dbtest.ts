// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Toda a fixture corre dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Reproduz exatamente a agregação de app/actions/financas.ts:getMapaSaldos
// contra o tipo `numeric` real do Postgres (não um mock) — é a lógica
// financeira mais sensível a erros de arredondamento/conversão string↔número
// introduzida na Fase 2 (gestão financeira formal).
import { and, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, fracao, movimento } from './schema'

class RollbackDeTeste extends Error {}

describe('cálculo de dívida por fração (mapa de saldos)', () => {
  it('dívida = quotas lançadas − quotas pagas, por fração', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste mapa de saldos] Condomínio' })
          .returning({ id: condominio.id })

        const [fracaoPaga] = await tx
          .insert(fracao)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            identificacao: '1ºEsq',
            proprietario: 'Proprietário Pago',
            permilagem: '500',
          })
          .returning({ id: fracao.id })
        const [fracaoDevedora] = await tx
          .insert(fracao)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            identificacao: '2ºDto',
            proprietario: 'Proprietário Devedor',
            permilagem: '500',
          })
          .returning({ id: fracao.id })

        // Fração paga: duas quotas de 50€, ambas liquidadas.
        await tx.insert(movimento).values([
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'receita',
            categoria: 'Quota',
            descricao: 'Quota janeiro',
            valor: '50.00',
            fracaoId: fracaoPaga.id,
            pago: true,
          },
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'receita',
            categoria: 'Quota',
            descricao: 'Quota fevereiro',
            valor: '50.00',
            fracaoId: fracaoPaga.id,
            pago: true,
          },
        ])

        // Fração devedora: uma quota paga (50€) e uma por pagar (50€) —
        // deve ficar com 50€ em dívida, não 100€ nem 0€.
        await tx.insert(movimento).values([
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'receita',
            categoria: 'Quota',
            descricao: 'Quota janeiro',
            valor: '50.00',
            fracaoId: fracaoDevedora.id,
            pago: true,
          },
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'receita',
            categoria: 'Quota',
            descricao: 'Quota fevereiro',
            valor: '50.00',
            fracaoId: fracaoDevedora.id,
            pago: false,
          },
        ])

        // Uma despesa geral (não deve entrar em nenhum cálculo de dívida,
        // porque despesas não têm fracaoId).
        await tx.insert(movimento).values({
          condominioId: condo.id,
          userId: 'user-admin',
          tipo: 'despesa',
          categoria: 'Limpeza',
          descricao: 'Limpeza mensal',
          valor: '80.00',
          pago: true,
        })

        // Reproduz exatamente a agregação de getMapaSaldos.
        const fracoes = await tx.select().from(fracao).where(eq(fracao.condominioId, condo.id))
        const quotas = await tx
          .select()
          .from(movimento)
          .where(and(eq(movimento.condominioId, condo.id), eq(movimento.tipo, 'receita')))

        const mapaSaldos = fracoes.map((f) => {
          const quotasDaFracao = quotas.filter((q) => q.fracaoId === f.id)
          const totalLancado = quotasDaFracao.reduce((s, q) => s + Number(q.valor), 0)
          const totalPago = quotasDaFracao
            .filter((q) => q.pago)
            .reduce((s, q) => s + Number(q.valor), 0)
          return {
            identificacao: f.identificacao,
            totalLancado,
            totalPago,
            emDivida: totalLancado - totalPago,
          }
        })

        const saldoPago = mapaSaldos.find((s) => s.identificacao === '1ºEsq')
        const saldoDevedor = mapaSaldos.find((s) => s.identificacao === '2ºDto')

        expect(saldoPago).toMatchObject({ totalLancado: 100, totalPago: 100, emDivida: 0 })
        expect(saldoDevedor).toMatchObject({ totalLancado: 100, totalPago: 50, emDivida: 50 })

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
