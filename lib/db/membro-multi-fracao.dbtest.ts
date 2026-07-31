// Teste de integração contra uma base de dados PostgreSQL REAL
// (DATABASE_URL, ver vitest.db.config.ts) — corre com `pnpm test:db`, não
// faz parte de `pnpm test`/CI.
//
// Verifica o achado F04 (docs/audit/USABILITY_FINDINGS.md — condómino ou
// senhorio com várias frações no mesmo condomínio) e a proteção de
// segurança que o torna seguro: os dois índices únicos PARCIAIS que
// substituíram `membro_user_condominio_idx` (ver lib/db/schema.ts)
// continuam a impedir duplicação por corrida para quem não tem fração
// (SECURITY_AUDIT.md S10), enquanto passam a permitir várias linhas por
// conta+condomínio quando cada uma tem uma fração diferente.
import { and, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, fracao, membro } from './schema'

class RollbackDeTeste extends Error {}

describe('membro: várias frações no mesmo condomínio (F04)', () => {
  it('permite duas linhas membro para a mesma conta+condomínio, com frações diferentes', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [c] = await tx
          .insert(condominio)
          .values({ nome: '[teste F04] Condomínio' })
          .returning({ id: condominio.id })
        const [fA] = await tx
          .insert(fracao)
          .values({ condominioId: c.id, userId: 'user-admin', identificacao: 'A', proprietario: 'Sandra Melo' })
          .returning({ id: fracao.id })
        const [fB] = await tx
          .insert(fracao)
          .values({ condominioId: c.id, userId: 'user-admin', identificacao: 'B', proprietario: 'Sandra Melo' })
          .returning({ id: fracao.id })

        await tx.insert(membro).values({
          condominioId: c.id,
          userId: 'user-multi-fracao',
          nome: 'Sandra Melo',
          email: 'sandra@example.com',
          perfil: 'condomino',
          estado: 'aprovado',
          fracaoId: fA.id,
        })
        await tx.insert(membro).values({
          condominioId: c.id,
          userId: 'user-multi-fracao',
          nome: 'Sandra Melo',
          email: 'sandra@example.com',
          perfil: 'condomino',
          estado: 'aprovado',
          fracaoId: fB.id,
        })

        const linhas = await tx
          .select()
          .from(membro)
          .where(and(eq(membro.userId, 'user-multi-fracao'), eq(membro.condominioId, c.id)))
        expect(linhas).toHaveLength(2)
        expect(linhas.map((l) => l.fracaoId).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual(
          [fA.id, fB.id].sort((a, b) => a - b),
        )

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('bloqueia associar a MESMA fração duas vezes à mesma conta', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [c] = await tx
          .insert(condominio)
          .values({ nome: '[teste F04] Condomínio' })
          .returning({ id: condominio.id })
        const [f] = await tx
          .insert(fracao)
          .values({ condominioId: c.id, userId: 'user-admin', identificacao: 'A', proprietario: 'X' })
          .returning({ id: fracao.id })

        await tx.insert(membro).values({
          condominioId: c.id,
          userId: 'user-dup-fracao',
          nome: 'X',
          email: 'x@example.com',
          perfil: 'condomino',
          estado: 'aprovado',
          fracaoId: f.id,
        })

        let erro: unknown
        try {
          await tx.insert(membro).values({
            condominioId: c.id,
            userId: 'user-dup-fracao',
            nome: 'X',
            email: 'x@example.com',
            perfil: 'condomino',
            estado: 'aprovado',
            fracaoId: f.id,
          })
        } catch (e) {
          erro = e
        }
        expect((erro as { cause?: { code?: string } } | undefined)?.cause?.code).toBe('23505')

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('continua a bloquear duas linhas SEM fração para a mesma conta+condomínio (regressão S10)', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [c] = await tx
          .insert(condominio)
          .values({ nome: '[teste F04] Condomínio' })
          .returning({ id: condominio.id })

        await tx.insert(membro).values({
          condominioId: c.id,
          userId: 'user-sem-fracao',
          nome: 'Admin',
          email: 'admin@example.com',
          perfil: 'admin',
          estado: 'aprovado',
          fracaoId: null,
        })

        let erro: unknown
        try {
          await tx.insert(membro).values({
            condominioId: c.id,
            userId: 'user-sem-fracao',
            nome: 'Admin',
            email: 'admin@example.com',
            perfil: 'admin',
            estado: 'aprovado',
            fracaoId: null,
          })
        } catch (e) {
          erro = e
        }
        expect((erro as { cause?: { code?: string } } | undefined)?.cause?.code).toBe('23505')

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  // Corrida real com ligações concorrentes (não cabe no padrão
  // transação-única-revertida acima, que só demonstra o comportamento
  // dentro de UMA transação) — mesmo espírito do teste de concorrência
  // original do S10 (SECURITY_AUDIT.md): N pedidos em paralelo à mesma
  // combinação só podem deixar 1 passar. Cria dados reais fora de uma
  // transação revertida, por isso limpa-os explicitamente no `finally`.
  it('corrida real: 8 pedidos concorrentes a associar a MESMA fração só deixam 1 passar', async () => {
    const [c] = await db
      .insert(condominio)
      .values({ nome: '[teste F04 concorrência] Condomínio' })
      .returning({ id: condominio.id })
    const [f] = await db
      .insert(fracao)
      .values({ condominioId: c.id, userId: 'user-admin', identificacao: 'A', proprietario: 'Y' })
      .returning({ id: fracao.id })

    try {
      const resultados = await Promise.allSettled(
        Array.from({ length: 8 }, () =>
          db.insert(membro).values({
            condominioId: c.id,
            userId: 'user-corrida',
            nome: 'Y',
            email: 'y@example.com',
            perfil: 'condomino',
            estado: 'aprovado',
            fracaoId: f.id,
          }),
        ),
      )

      const sucesso = resultados.filter((r) => r.status === 'fulfilled')
      const falha = resultados.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      )
      expect(sucesso).toHaveLength(1)
      expect(falha).toHaveLength(7)
      // Confirma que as 7 falhas são mesmo a violação de unicidade esperada
      // (índice parcial), não outro erro qualquer a mascarar-se de sucesso.
      for (const r of falha) {
        expect((r.reason as { cause?: { code?: string } })?.cause?.code).toBe('23505')
      }

      const linhas = await db
        .select()
        .from(membro)
        .where(and(eq(membro.userId, 'user-corrida'), eq(membro.condominioId, c.id)))
      expect(linhas).toHaveLength(1)
    } finally {
      // onDelete: 'cascade' em membro.condominioId e fracao.condominioId
      // apaga tudo o que este teste criou.
      await db.delete(condominio).where(eq(condominio.id, c.id))
    }
  })
})
