// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Toda a fixture corre dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Reproduz a lógica de app/actions/documentos.ts:alternarArquivoDocumento
// e o filtro de arquivado em getDocumentos diretamente (as próprias server
// actions exigem sessão via requireAdmin/requireMembroAprovado, não
// testáveis fora de um pedido — mesmo padrão já usado em
// lib/db/cobranca.dbtest.ts e outros *.dbtest.ts).
import { and, eq, isNull } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { condominio, documento } from './schema'

class RollbackDeTeste extends Error {}

async function rollback(fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<void>) {
  await expect(
    db.transaction(async (tx) => {
      await fn(tx)
      throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
    }),
  ).rejects.toThrow(RollbackDeTeste)
}

describe('documento: arquivo morto', () => {
  it('um documento nasce não arquivado e pode ser arquivado/desarquivado', async () => {
    await rollback(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste arquivo] Condomínio' })
        .returning({ id: condominio.id })

      const [doc] = await tx
        .insert(documento)
        .values({ condominioId: condo.id, userId: 'user-admin', titulo: 'Regulamento antigo' })
        .returning()
      expect(doc.arquivado).toBe(false)

      await tx.update(documento).set({ arquivado: true }).where(eq(documento.id, doc.id))
      const [depois] = await tx.select().from(documento).where(eq(documento.id, doc.id))
      expect(depois.arquivado).toBe(true)

      await tx.update(documento).set({ arquivado: false }).where(eq(documento.id, doc.id))
      const [final] = await tx.select().from(documento).where(eq(documento.id, doc.id))
      expect(final.arquivado).toBe(false)
    })
  })

  it('a listagem principal exclui arquivados por omissão, e mostrarArquivados=true mostra só os arquivados', async () => {
    await rollback(async (tx) => {
      const [condo] = await tx
        .insert(condominio)
        .values({ nome: '[teste arquivo] Condomínio' })
        .returning({ id: condominio.id })

      await tx.insert(documento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        titulo: 'Ativo',
        arquivado: false,
      })
      await tx.insert(documento).values({
        condominioId: condo.id,
        userId: 'user-admin',
        titulo: 'Arquivado',
        arquivado: true,
      })

      // Reproduz o filtro de app/actions/documentos.ts:getDocumentos.
      const ativos = await tx
        .select()
        .from(documento)
        .where(and(eq(documento.condominioId, condo.id), isNull(documento.deletedAt), eq(documento.arquivado, false)))
      expect(ativos.map((d) => d.titulo)).toEqual(['Ativo'])

      const arquivados = await tx
        .select()
        .from(documento)
        .where(and(eq(documento.condominioId, condo.id), isNull(documento.deletedAt), eq(documento.arquivado, true)))
      expect(arquivados.map((d) => d.titulo)).toEqual(['Arquivado'])
    })
  })

  it('isolamento multi-tenant: arquivar um documento de um condomínio nunca afeta outro', async () => {
    await rollback(async (tx) => {
      const [condoA] = await tx
        .insert(condominio)
        .values({ nome: '[teste arquivo isolamento] Condomínio A' })
        .returning({ id: condominio.id })
      const [condoB] = await tx
        .insert(condominio)
        .values({ nome: '[teste arquivo isolamento] Condomínio B' })
        .returning({ id: condominio.id })

      const [docA] = await tx
        .insert(documento)
        .values({ condominioId: condoA.id, userId: 'user-a', titulo: 'Doc A' })
        .returning({ id: documento.id })
      const [docB] = await tx
        .insert(documento)
        .values({ condominioId: condoB.id, userId: 'user-b', titulo: 'Doc B' })
        .returning({ id: documento.id })

      // Reproduz a condição de app/actions/documentos.ts:alternarArquivoDocumento
      // — o update tem sempre de filtrar também por condominioId.
      await tx
        .update(documento)
        .set({ arquivado: true })
        .where(and(eq(documento.id, docA.id), eq(documento.condominioId, condoA.id)))

      const [a] = await tx.select({ arquivado: documento.arquivado }).from(documento).where(eq(documento.id, docA.id))
      const [b] = await tx.select({ arquivado: documento.arquivado }).from(documento).where(eq(documento.id, docB.id))
      expect(a.arquivado).toBe(true)
      expect(b.arquivado).toBe(false)
    })
  })
})
