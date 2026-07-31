// Teste de integração contra uma base de dados PostgreSQL REAL
// (DATABASE_URL, ver vitest.db.config.ts) — corre com `pnpm test:db`, não
// faz parte de `pnpm test`/CI. Toda a fixture corre dentro de uma
// transação sempre revertida no fim.
//
// Reproduz as condições de segurança de app/actions/acesso-convidado.ts:
// getAtaPorToken (F13, docs/audit/USABILITY_FINDINGS.md) — um link
// revogado, expirado, ou apontando para uma ata ainda não aprovada nunca
// pode devolver dados, mesmo com o token exato.
import { and, eq, gt, isNull } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { acessoConvidado, assembleia, condominio } from './schema'

class RollbackDeTeste extends Error {}

async function condicaoAcessoValido(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  token: string,
  agora: Date,
) {
  const [acesso] = await tx
    .select()
    .from(acessoConvidado)
    .where(
      and(
        eq(acessoConvidado.token, token),
        isNull(acessoConvidado.revogadoEm),
        gt(acessoConvidado.expiraEm, agora),
      ),
    )
    .limit(1)
  if (!acesso) return null

  const [a] = await tx
    .select()
    .from(assembleia)
    .where(and(eq(assembleia.id, acesso.assembleiaId), eq(assembleia.estado, 'aprovada')))
    .limit(1)
  return a ?? null
}

describe('segurança do acesso convidado (F13)', () => {
  it('token válido, não revogado, dentro do prazo, ata aprovada: devolve a ata', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste F13] Condomínio' })
          .returning({ id: condominio.id })
        const [a] = await tx
          .insert(assembleia)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            local: 'Sala',
            dataPrimeiraConvocatoria: new Date('2026-01-10'),
            estado: 'aprovada',
          })
          .returning({ id: assembleia.id })
        await tx.insert(acessoConvidado).values({
          condominioId: condo.id,
          assembleiaId: a.id,
          criadoPorUserId: 'user-admin',
          token: 'token-valido',
          expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })

        const resultado = await condicaoAcessoValido(tx, 'token-valido', new Date())
        expect(resultado?.id).toBe(a.id)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('token revogado: nunca devolve a ata, mesmo dentro do prazo', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste F13] Condomínio revogado' })
          .returning({ id: condominio.id })
        const [a] = await tx
          .insert(assembleia)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            local: 'Sala',
            dataPrimeiraConvocatoria: new Date('2026-01-10'),
            estado: 'aprovada',
          })
          .returning({ id: assembleia.id })
        await tx.insert(acessoConvidado).values({
          condominioId: condo.id,
          assembleiaId: a.id,
          criadoPorUserId: 'user-admin',
          token: 'token-revogado',
          expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000),
          revogadoEm: new Date(),
        })

        const resultado = await condicaoAcessoValido(tx, 'token-revogado', new Date())
        expect(resultado).toBeNull()

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('token expirado: nunca devolve a ata, mesmo não revogado', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste F13] Condomínio expirado' })
          .returning({ id: condominio.id })
        const [a] = await tx
          .insert(assembleia)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            local: 'Sala',
            dataPrimeiraConvocatoria: new Date('2026-01-10'),
            estado: 'aprovada',
          })
          .returning({ id: assembleia.id })
        await tx.insert(acessoConvidado).values({
          condominioId: condo.id,
          assembleiaId: a.id,
          criadoPorUserId: 'user-admin',
          token: 'token-expirado',
          expiraEm: new Date(Date.now() - 1000),
        })

        const resultado = await condicaoAcessoValido(tx, 'token-expirado', new Date())
        expect(resultado).toBeNull()

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('ata ainda não aprovada (rascunho): nunca devolve, mesmo com um acesso "válido"', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste F13] Condomínio rascunho' })
          .returning({ id: condominio.id })
        const [a] = await tx
          .insert(assembleia)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            local: 'Sala',
            dataPrimeiraConvocatoria: new Date('2026-01-10'),
            estado: 'realizada', // ainda não aprovada
          })
          .returning({ id: assembleia.id })
        await tx.insert(acessoConvidado).values({
          condominioId: condo.id,
          assembleiaId: a.id,
          criadoPorUserId: 'user-admin',
          token: 'token-rascunho',
          expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })

        const resultado = await condicaoAcessoValido(tx, 'token-rascunho', new Date())
        expect(resultado).toBeNull()

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('token inexistente: nunca devolve nada', async () => {
    await expect(
      db.transaction(async (tx) => {
        const resultado = await condicaoAcessoValido(tx, 'token-que-nao-existe', new Date())
        expect(resultado).toBeNull()

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
