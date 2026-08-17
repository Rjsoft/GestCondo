// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Toda a fixture corre dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Reproduz a lógica de app/actions/orcamentos.ts:copiarRubricasOrcamentoAnterior
// (a própria função exige sessão via requireAdmin, não testável fora de um
// pedido — mesmo padrão já usado em lib/db/balanco-orcamento.dbtest.ts).
import { and, desc, eq, lt } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, orcamento, orcamentoRubrica } from './schema'

class RollbackDeTeste extends Error {}

describe('copiar rubricas do orçamento anterior', () => {
  it('copia do orçamento anterior mais recente, mesmo com anos em falta pelo meio', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste copiar rubricas] Condomínio' })
          .returning({ id: condominio.id })

        const [orc2024] = await tx
          .insert(orcamento)
          .values({ condominioId: condo.id, userId: 'user-admin', ano: 2024, valorAnual: '1000.00' })
          .returning({ id: orcamento.id })
        await tx.insert(orcamentoRubrica).values([
          { orcamentoId: orc2024.id, categoria: 'Limpeza', valorOrcamentado: '400.00' },
          { orcamentoId: orc2024.id, categoria: 'Elevador', valorOrcamentado: '300.00' },
        ])

        // 2025 não tem orçamento nenhum — o "anterior" de 2026 tem de saltar
        // para 2024, não assumir ano - 1.
        const [orc2026] = await tx
          .insert(orcamento)
          .values({ condominioId: condo.id, userId: 'user-admin', ano: 2026, valorAnual: '1100.00' })
          .returning({ id: orcamento.id })

        const [orcamentoAnterior] = await tx
          .select({ id: orcamento.id, ano: orcamento.ano })
          .from(orcamento)
          .where(and(eq(orcamento.condominioId, condo.id), lt(orcamento.ano, 2026)))
          .orderBy(desc(orcamento.ano))
          .limit(1)

        expect(orcamentoAnterior.ano).toBe(2024)

        const rubricasAnteriores = await tx
          .select({ categoria: orcamentoRubrica.categoria, valorOrcamentado: orcamentoRubrica.valorOrcamentado })
          .from(orcamentoRubrica)
          .where(eq(orcamentoRubrica.orcamentoId, orcamentoAnterior.id))

        await tx.insert(orcamentoRubrica).values(
          rubricasAnteriores.map((r) => ({
            orcamentoId: orc2026.id,
            categoria: r.categoria,
            valorOrcamentado: r.valorOrcamentado,
          })),
        )

        const copiadas = await tx
          .select()
          .from(orcamentoRubrica)
          .where(eq(orcamentoRubrica.orcamentoId, orc2026.id))

        expect(copiadas).toHaveLength(2)
        expect(copiadas.map((r) => r.categoria).sort()).toEqual(['Elevador', 'Limpeza'])
        expect(copiadas.find((r) => r.categoria === 'Limpeza')?.valorOrcamentado).toBe('400.00')

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('não escolhe um orçamento anterior de outro condomínio (isolamento multi-tenant)', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condoA] = await tx
          .insert(condominio)
          .values({ nome: '[teste copiar rubricas] Condomínio A' })
          .returning({ id: condominio.id })
        const [condoB] = await tx
          .insert(condominio)
          .values({ nome: '[teste copiar rubricas] Condomínio B' })
          .returning({ id: condominio.id })

        // Condomínio B tem um orçamento de 2025 — não pode "vazar" para A.
        const [orcB2025] = await tx
          .insert(orcamento)
          .values({ condominioId: condoB.id, userId: 'user-admin', ano: 2025, valorAnual: '500.00' })
          .returning({ id: orcamento.id })
        await tx
          .insert(orcamentoRubrica)
          .values([{ orcamentoId: orcB2025.id, categoria: 'Segurança', valorOrcamentado: '500.00' }])

        await tx
          .insert(orcamento)
          .values({ condominioId: condoA.id, userId: 'user-admin', ano: 2026, valorAnual: '900.00' })

        const anteriorParaA = await tx
          .select({ id: orcamento.id })
          .from(orcamento)
          .where(and(eq(orcamento.condominioId, condoA.id), lt(orcamento.ano, 2026)))
          .orderBy(desc(orcamento.ano))
          .limit(1)

        expect(anteriorParaA).toHaveLength(0)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
