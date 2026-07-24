// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Toda a fixture corre dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Reproduz exatamente a agregação de app/actions/orcamentos.ts:getBalancoOrcamento
// contra o tipo `numeric`/`timestamp` real do Postgres — cobre os três
// filtros que decidem se um movimento entra no balanço (ano civil, destino
// "geral" excluindo fundo de reserva, e soft-delete) e o cálculo do desvio.
import { and, eq, gte, isNull, lt } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, movimento, orcamento, orcamentoRubrica } from './schema'

class RollbackDeTeste extends Error {}

describe('balanço orçamento aprovado vs. real', () => {
  it('só soma movimentos do ano certo, destino "geral" e não eliminados', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste balanço] Condomínio' })
          .returning({ id: condominio.id })

        const [orc] = await tx
          .insert(orcamento)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            ano: 2025,
            valorAnual: '1000.00',
          })
          .returning({ id: orcamento.id })

        await tx.insert(movimento).values([
          // Receita e despesa dentro do ano, destino geral — devem contar.
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'receita',
            categoria: 'Quota',
            descricao: 'Quota janeiro',
            valor: '100.00',
            data: new Date(2025, 0, 15),
            destino: 'geral',
          },
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'despesa',
            categoria: 'Limpeza',
            descricao: 'Limpeza janeiro',
            valor: '300.00',
            data: new Date(2025, 0, 20),
            destino: 'geral',
          },
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'despesa',
            categoria: 'Limpeza',
            descricao: 'Limpeza fevereiro',
            valor: '200.00',
            data: new Date(2025, 1, 20),
            destino: 'geral',
          },
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'despesa',
            categoria: 'Elevador',
            descricao: 'Manutenção elevador',
            valor: '900.00',
            data: new Date(2025, 5, 1),
            destino: 'geral',
          },
          // Fora do ano de 2025 — não deve contar.
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'despesa',
            categoria: 'Limpeza',
            descricao: 'Limpeza dezembro 2024',
            valor: '5000.00',
            data: new Date(2024, 11, 31),
            destino: 'geral',
          },
          // Fundo de reserva — não deve contar no balanço da conta corrente.
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'despesa',
            categoria: 'Obras',
            descricao: 'Obra do fundo de reserva',
            valor: '9999.00',
            data: new Date(2025, 3, 1),
            destino: 'reserva',
          },
        ])

        // Movimento eliminado (soft-delete) — não deve contar.
        await tx.insert(movimento).values({
          condominioId: condo.id,
          userId: 'user-admin',
          tipo: 'despesa',
          categoria: 'Limpeza',
          descricao: 'Lançamento eliminado',
          valor: '7777.00',
          data: new Date(2025, 2, 1),
          destino: 'geral',
          deletedAt: new Date(),
        })

        // Reproduz exatamente a agregação de getBalancoOrcamento.
        const inicioAno = new Date(2025, 0, 1)
        const fimAno = new Date(2026, 0, 1)
        const movimentosAno = await tx
          .select({ tipo: movimento.tipo, categoria: movimento.categoria, valor: movimento.valor })
          .from(movimento)
          .where(
            and(
              eq(movimento.condominioId, condo.id),
              eq(movimento.destino, 'geral'),
              isNull(movimento.deletedAt),
              gte(movimento.data, inicioAno),
              lt(movimento.data, fimAno),
            ),
          )

        const receitasReais = movimentosAno
          .filter((mv) => mv.tipo === 'receita')
          .reduce((s, mv) => s + Number(mv.valor), 0)
        const despesasReais = movimentosAno
          .filter((mv) => mv.tipo === 'despesa')
          .reduce((s, mv) => s + Number(mv.valor), 0)

        const despesasPorCategoriaMap = new Map<string, number>()
        for (const mv of movimentosAno) {
          if (mv.tipo !== 'despesa') continue
          despesasPorCategoriaMap.set(
            mv.categoria,
            (despesasPorCategoriaMap.get(mv.categoria) ?? 0) + Number(mv.valor),
          )
        }

        const previsto = Number((await tx.select().from(orcamento).where(eq(orcamento.id, orc.id)))[0].valorAnual)
        const desvio = despesasReais - previsto

        expect(receitasReais).toBe(100)
        expect(despesasReais).toBe(300 + 200 + 900) // exclui ano anterior, reserva e eliminado
        expect(despesasPorCategoriaMap.get('Limpeza')).toBe(500)
        expect(despesasPorCategoriaMap.get('Elevador')).toBe(900)
        expect(despesasPorCategoriaMap.has('Obras')).toBe(false)
        expect(desvio).toBe(1400 - 1000)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('cruza rubricas com a despesa real por categoria (Fase A.2, G08)', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste rubricas] Condomínio' })
          .returning({ id: condominio.id })

        const [orc] = await tx
          .insert(orcamento)
          .values({ condominioId: condo.id, userId: 'user-admin', ano: 2026, valorAnual: '1000.00' })
          .returning({ id: orcamento.id })

        // Duas rubricas definidas: Limpeza (dentro do orçado) e Elevador
        // (acima do orçado — desvio positivo esperado).
        await tx.insert(orcamentoRubrica).values([
          { orcamentoId: orc.id, categoria: 'Limpeza', valorOrcamentado: '400.00' },
          { orcamentoId: orc.id, categoria: 'Elevador', valorOrcamentado: '300.00' },
        ])

        await tx.insert(movimento).values([
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'despesa',
            categoria: 'Limpeza',
            descricao: 'Limpeza janeiro',
            valor: '350.00',
            data: new Date(2026, 0, 20),
            destino: 'geral',
          },
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'despesa',
            categoria: 'Elevador',
            descricao: 'Manutenção elevador',
            valor: '500.00',
            data: new Date(2026, 1, 1),
            destino: 'geral',
          },
          // Categoria com despesa real mas sem rubrica correspondente — tem
          // de aparecer no cruzamento na mesma, não pode ficar escondida.
          {
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'despesa',
            categoria: 'Seguros',
            descricao: 'Prémio anual',
            valor: '150.00',
            data: new Date(2026, 2, 1),
            destino: 'geral',
          },
        ])

        // Reproduz exatamente o cruzamento de getBalancoOrcamento.
        const movimentosAno = await tx
          .select({ categoria: movimento.categoria, valor: movimento.valor })
          .from(movimento)
          .where(and(eq(movimento.condominioId, condo.id), eq(movimento.tipo, 'despesa')))
        const despesasPorCategoriaMap = new Map<string, number>()
        for (const mv of movimentosAno) {
          despesasPorCategoriaMap.set(
            mv.categoria,
            (despesasPorCategoriaMap.get(mv.categoria) ?? 0) + Number(mv.valor),
          )
        }

        const rubricasRegistadas = await tx
          .select()
          .from(orcamentoRubrica)
          .where(eq(orcamentoRubrica.orcamentoId, orc.id))
        const categoriasComRubrica = new Set(rubricasRegistadas.map((r) => r.categoria))

        const cruzamento = rubricasRegistadas.map((r) => {
          const valorOrcamentado = Number(r.valorOrcamentado)
          const valorReal = despesasPorCategoriaMap.get(r.categoria) ?? 0
          return { categoria: r.categoria, valorOrcamentado, valorReal, desvio: valorReal - valorOrcamentado }
        })
        const semRubrica = Array.from(despesasPorCategoriaMap.keys()).filter(
          (categoria) => !categoriasComRubrica.has(categoria),
        )
        const somaRubricas = rubricasRegistadas.reduce((s, r) => s + Number(r.valorOrcamentado), 0)

        expect(cruzamento).toContainEqual({
          categoria: 'Limpeza',
          valorOrcamentado: 400,
          valorReal: 350,
          desvio: -50,
        })
        expect(cruzamento).toContainEqual({
          categoria: 'Elevador',
          valorOrcamentado: 300,
          valorReal: 500,
          desvio: 200,
        })
        expect(semRubrica).toEqual(['Seguros'])
        expect(somaRubricas).toBe(700)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
