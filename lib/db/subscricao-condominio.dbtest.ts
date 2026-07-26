// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Fixture e asserções correm dentro de uma transação
// sempre revertida no fim, pelo que nada fica persistido na base de dados
// real.
//
// Cobre o controlo de acesso por subscrição (app/actions/plataforma.ts,
// lib/session.ts): condomínios novos nascem "ativo" por omissão, e a
// query com innerJoin usada em getMembroAtual (lib/session.ts) traz o
// estadoSubscricao correto para decidir o bloqueio de acesso — reproduzida
// aqui com `tx`, não chamada diretamente, porque getMembroAtual depende de
// getSession() (cookies), indisponível fora de um pedido HTTP real (mesmo
// padrão já usado em tenant-isolation.dbtest.ts).
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, membro } from './schema'

class RollbackDeTeste extends Error {}

describe('controlo de acesso por subscrição', () => {
  it('um condomínio novo nasce com estadoSubscricao "ativo" por omissão', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste subscricao] novo' })
          .returning()

        expect(condo.estadoSubscricao).toBe('ativo')
        expect(condo.notaSubscricao).toBeNull()
        expect(condo.subscricaoAtualizadaEm).toBeNull()

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('a query com innerJoin (mesma de getMembroAtual) traz o estadoSubscricao correto', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condoAtivo] = await tx
          .insert(condominio)
          .values({ nome: '[teste subscricao] ativo' })
          .returning({ id: condominio.id })
        const [condoSuspenso] = await tx
          .insert(condominio)
          .values({ nome: '[teste subscricao] suspenso', estadoSubscricao: 'suspenso' })
          .returning({ id: condominio.id })

        await tx.insert(membro).values([
          { condominioId: condoAtivo.id, userId: 'user-ativo', nome: 'A', email: 'a@teste.pt', perfil: 'admin', estado: 'aprovado' },
          { condominioId: condoSuspenso.id, userId: 'user-suspenso', nome: 'B', email: 'b@teste.pt', perfil: 'admin', estado: 'aprovado' },
        ])

        // Reproduz exatamente a query de lib/session.ts:getMembroAtual.
        const buscar = (userId: string) =>
          tx
            .select({ membro, estadoSubscricao: condominio.estadoSubscricao })
            .from(membro)
            .innerJoin(condominio, eq(membro.condominioId, condominio.id))
            .where(eq(membro.userId, userId))
            .limit(1)

        const [linhaAtivo] = await buscar('user-ativo')
        const [linhaSuspenso] = await buscar('user-suspenso')

        expect(linhaAtivo.estadoSubscricao).toBe('ativo')
        expect(linhaSuspenso.estadoSubscricao).toBe('suspenso')

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('alterar o estado de subscrição persiste notaSubscricao e subscricaoAtualizadaEm', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste subscricao] alterar' })
          .returning({ id: condominio.id })

        // Mesma operação de app/actions/plataforma.ts:alterarEstadoSubscricao.
        await tx
          .update(condominio)
          .set({
            estadoSubscricao: 'suspenso',
            notaSubscricao: 'sem pagamento desde julho',
            subscricaoAtualizadaEm: new Date(),
          })
          .where(eq(condominio.id, condo.id))

        const [atualizado] = await tx.select().from(condominio).where(eq(condominio.id, condo.id))

        expect(atualizado.estadoSubscricao).toBe('suspenso')
        expect(atualizado.notaSubscricao).toBe('sem pagamento desde julho')
        expect(atualizado.subscricaoAtualizadaEm).not.toBeNull()

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
