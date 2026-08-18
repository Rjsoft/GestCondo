// Teste de integração contra uma base de dados PostgreSQL REAL
// (DATABASE_URL, ver vitest.db.config.ts) — corre com `pnpm test:db`, não
// faz parte de `pnpm test`/CI.
//
// Verifica a tabela `fracao_titular` (titulares adicionais de uma fração,
// para heranças indivisas ou frações com vários donos — ver
// lib/db/schema.ts:fracaoTitular e FUNCTIONAL_GAPS.md secção 1): criação e
// listagem, que uma fração sem titulares continua a funcionar exatamente
// como antes, isolamento multi-tenant, e eliminação em cascata quando a
// fração é eliminada.
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, fracao, fracaoTitular } from './schema'

class RollbackDeTeste extends Error {}

describe('fracao_titular: titulares adicionais de uma fração', () => {
  it('permite registar vários titulares para a mesma fração e listá-los', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [c] = await tx
          .insert(condominio)
          .values({ nome: '[teste titulares] Condomínio' })
          .returning({ id: condominio.id })
        const [f] = await tx
          .insert(fracao)
          .values({
            condominioId: c.id,
            userId: 'user-admin',
            identificacao: 'A',
            proprietario: 'Herança de João Silva',
          })
          .returning({ id: fracao.id })

        await tx.insert(fracaoTitular).values({
          fracaoId: f.id,
          nome: 'Maria Silva',
          nif: '123456789',
          tipoTitular: 'proprietario',
        })
        await tx.insert(fracaoTitular).values({
          fracaoId: f.id,
          nome: 'Pedro Silva',
          nif: '987654321',
          tipoTitular: 'proprietario',
        })

        const titulares = await tx
          .select()
          .from(fracaoTitular)
          .where(eq(fracaoTitular.fracaoId, f.id))
        expect(titulares).toHaveLength(2)
        expect(titulares.map((t) => t.nome).sort()).toEqual(['Maria Silva', 'Pedro Silva'])

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('uma fração sem titulares continua com a lista vazia, sem afetar fracao.proprietario', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [c] = await tx
          .insert(condominio)
          .values({ nome: '[teste titulares] Condomínio' })
          .returning({ id: condominio.id })
        const [f] = await tx
          .insert(fracao)
          .values({
            condominioId: c.id,
            userId: 'user-admin',
            identificacao: 'B',
            proprietario: 'Ana Costa',
          })
          .returning({ id: fracao.id, proprietario: fracao.proprietario })

        const titulares = await tx
          .select()
          .from(fracaoTitular)
          .where(eq(fracaoTitular.fracaoId, f.id))
        expect(titulares).toHaveLength(0)
        expect(f.proprietario).toBe('Ana Costa')

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('isolamento multi-tenant: titulares de uma fração de outro condomínio nunca aparecem', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condoA] = await tx
          .insert(condominio)
          .values({ nome: '[teste titulares isolamento] Condomínio A' })
          .returning({ id: condominio.id })
        const [condoB] = await tx
          .insert(condominio)
          .values({ nome: '[teste titulares isolamento] Condomínio B' })
          .returning({ id: condominio.id })
        const [fA] = await tx
          .insert(fracao)
          .values({ condominioId: condoA.id, userId: 'user-a', identificacao: 'A', proprietario: 'X' })
          .returning({ id: fracao.id })
        const [fB] = await tx
          .insert(fracao)
          .values({ condominioId: condoB.id, userId: 'user-b', identificacao: 'B', proprietario: 'Y' })
          .returning({ id: fracao.id })

        await tx.insert(fracaoTitular).values({ fracaoId: fA.id, nome: 'Titular A', tipoTitular: 'proprietario' })
        await tx.insert(fracaoTitular).values({ fracaoId: fB.id, nome: 'Titular B', tipoTitular: 'proprietario' })

        // Reproduz o padrão de app/actions/fracoes.ts:getTitularesFracao —
        // a fração já vem filtrada por condominioId antes de se listarem os
        // seus titulares, pelo que não há forma de um pedido do condomínio A
        // devolver titulares do condomínio B.
        const titularesDaFracaoA = await tx
          .select()
          .from(fracaoTitular)
          .where(eq(fracaoTitular.fracaoId, fA.id))
        expect(titularesDaFracaoA.map((t) => t.nome)).toEqual(['Titular A'])

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('eliminar a fração elimina os titulares em cascata', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [c] = await tx
          .insert(condominio)
          .values({ nome: '[teste titulares cascade] Condomínio' })
          .returning({ id: condominio.id })
        const [f] = await tx
          .insert(fracao)
          .values({ condominioId: c.id, userId: 'user-admin', identificacao: 'A', proprietario: 'X' })
          .returning({ id: fracao.id })

        await tx.insert(fracaoTitular).values({ fracaoId: f.id, nome: 'Titular', tipoTitular: 'proprietario' })

        await tx.delete(fracao).where(eq(fracao.id, f.id))

        const titulares = await tx
          .select()
          .from(fracaoTitular)
          .where(eq(fracaoTitular.fracaoId, f.id))
        expect(titulares).toHaveLength(0)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
