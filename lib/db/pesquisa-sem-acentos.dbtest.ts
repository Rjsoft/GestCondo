// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Fixture dentro de uma transação sempre revertida.
//
// Confirma que a extensão `unaccent` (drizzle/0028_enable_unaccent_extension.sql)
// está mesmo ativa e que a pesquisa por texto ignora acentos — reproduz a
// condição usada em app/actions/avisos.ts:getAvisos, representativa do
// mesmo padrão repetido em auditoria.ts, documentos.ts, financas.ts
// (movimentos) e ocorrencias.ts. Não duplicado nos outros 4, por ser
// exatamente o mesmo padrão de SQL.
import { and, eq, or, sql } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { aviso, condominio } from './schema'

class RollbackDeTeste extends Error {}

describe('pesquisa insensível a acentos (extensão unaccent)', () => {
  it('encontra "orcamento" (sem cedilha) num aviso escrito com "orçamento"', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste unaccent] Condomínio' })
          .returning({ id: condominio.id })

        await tx.insert(aviso).values({
          condominioId: condo.id,
          userId: 'user-teste',
          autorNome: 'Teste',
          titulo: 'Aprovação do orçamento anual',
          conteudo: 'Reunião sobre o orçamento do condomínio.',
        })

        const search = 'orcamento'
        const linhas = await tx
          .select()
          .from(aviso)
          .where(
            and(
              eq(aviso.condominioId, condo.id),
              or(
                sql`unaccent(${aviso.titulo}) ilike unaccent(${`%${search}%`})`,
                sql`unaccent(${aviso.conteudo}) ilike unaccent(${`%${search}%`})`,
              ),
            ),
          )

        expect(linhas).toHaveLength(1)
        expect(linhas[0].titulo).toBe('Aprovação do orçamento anual')

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
