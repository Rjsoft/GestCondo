// Teste de integração contra uma base de dados PostgreSQL REAL
// (DATABASE_URL, ver vitest.db.config.ts) — corre com `pnpm test:db`, não
// faz parte de `pnpm test`/CI.
//
// Verifica a garantia de segurança mais crítica de toda a aplicação
// (SECURITY_AUDIT.md S9): que dados de um condomínio nunca ficam visíveis
// nem alteráveis a partir de outro. Toda a fixture e todas as asserções
// correm dentro de uma transação que é sempre revertida no fim — mesmo
// quando os testes passam — pelo que nada fica persistido na base de dados
// real (incluindo a de desenvolvimento do utilizador).
import { and, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { assembleia, aviso, condominio, movimento } from './schema'

class RollbackDeTeste extends Error {}

describe('isolamento multi-tenant (condominioId)', () => {
  it('uma leitura filtrada por condominioId nunca devolve linhas de outro condomínio', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condoA] = await tx
          .insert(condominio)
          .values({ nome: '[teste isolamento] Condomínio A' })
          .returning({ id: condominio.id })
        const [condoB] = await tx
          .insert(condominio)
          .values({ nome: '[teste isolamento] Condomínio B' })
          .returning({ id: condominio.id })

        await tx.insert(aviso).values({
          condominioId: condoA.id,
          userId: 'user-a',
          autorNome: 'Admin A',
          titulo: 'Aviso do condomínio A',
          conteudo: 'Só deve aparecer para quem está no condomínio A',
          prioridade: 'normal',
        })
        await tx.insert(aviso).values({
          condominioId: condoB.id,
          userId: 'user-b',
          autorNome: 'Admin B',
          titulo: 'Aviso do condomínio B',
          conteudo: 'Só deve aparecer para quem está no condomínio B',
          prioridade: 'normal',
        })

        // Reproduz exatamente o filtro de app/actions/avisos.ts:getAvisos.
        const avisosDoA = await tx
          .select()
          .from(aviso)
          .where(eq(aviso.condominioId, condoA.id))
        const avisosDoB = await tx
          .select()
          .from(aviso)
          .where(eq(aviso.condominioId, condoB.id))

        expect(avisosDoA.map((a) => a.titulo)).toEqual(['Aviso do condomínio A'])
        expect(avisosDoB.map((a) => a.titulo)).toEqual(['Aviso do condomínio B'])

        // Confirma que os dois avisos de facto coexistem na mesma tabela
        // (prova que é o `where` que separa os tenants, e não os dados de
        // teste acontecerem a não colidir por acaso).
        const todosOsAvisos = await tx
          .select({ condominioId: aviso.condominioId })
          .from(aviso)
        const condominiosPresentes = new Set(todosOsAvisos.map((a) => a.condominioId))
        expect(condominiosPresentes.has(condoA.id)).toBe(true)
        expect(condominiosPresentes.has(condoB.id)).toBe(true)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('eliminar por id tem de filtrar também por condominioId (IDOR entre tenants)', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condoAtacante] = await tx
          .insert(condominio)
          .values({ nome: '[teste isolamento] Condomínio do atacante' })
          .returning({ id: condominio.id })
        const [condoVitima] = await tx
          .insert(condominio)
          .values({ nome: '[teste isolamento] Condomínio da vítima' })
          .returning({ id: condominio.id })

        const [movimentoDaVitima] = await tx
          .insert(movimento)
          .values({
            condominioId: condoVitima.id,
            userId: 'user-vitima',
            tipo: 'despesa',
            categoria: 'Teste',
            descricao: 'Despesa do condomínio da vítima',
            valor: '100.00',
          })
          .returning({ id: movimento.id })

        // Um admin do condomínio ATACANTE tenta eliminar, por id, um
        // movimento que na verdade pertence ao condomínio da VÍTIMA (ex.
        // por adivinhar/incrementar o id) — reproduz exatamente o `where`
        // de eliminarMovimento em app/actions/financas.ts, usando o
        // condominioId do atacante (não o da vítima).
        await tx
          .update(movimento)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(movimento.id, movimentoDaVitima.id),
              eq(movimento.condominioId, condoAtacante.id),
            ),
          )

        const [aindaExiste] = await tx
          .select()
          .from(movimento)
          .where(eq(movimento.id, movimentoDaVitima.id))

        // O movimento da vítima tem de continuar intacto (deletedAt null)
        // -- o UPDATE do atacante não deve ter afetado nenhuma linha,
        // porque o condominioId não bate certo.
        expect(aindaExiste.deletedAt).toBeNull()

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('assembleias de um condomínio nunca aparecem numa leitura filtrada de outro', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condoA] = await tx
          .insert(condominio)
          .values({ nome: '[teste isolamento] Condomínio A (assembleias)' })
          .returning({ id: condominio.id })
        const [condoB] = await tx
          .insert(condominio)
          .values({ nome: '[teste isolamento] Condomínio B (assembleias)' })
          .returning({ id: condominio.id })

        await tx.insert(assembleia).values({
          condominioId: condoA.id,
          userId: 'user-a',
          tipo: 'ordinaria',
          local: 'Hall do condomínio A',
          dataPrimeiraConvocatoria: new Date(),
        })
        await tx.insert(assembleia).values({
          condominioId: condoB.id,
          userId: 'user-b',
          tipo: 'ordinaria',
          local: 'Hall do condomínio B',
          dataPrimeiraConvocatoria: new Date(),
        })

        // Reproduz exatamente o filtro de app/actions/assembleias.ts:getAssembleias.
        const assembleiasDoA = await tx
          .select()
          .from(assembleia)
          .where(eq(assembleia.condominioId, condoA.id))
        const assembleiasDoB = await tx
          .select()
          .from(assembleia)
          .where(eq(assembleia.condominioId, condoB.id))

        expect(assembleiasDoA.map((a) => a.local)).toEqual(['Hall do condomínio A'])
        expect(assembleiasDoB.map((a) => a.local)).toEqual(['Hall do condomínio B'])

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
