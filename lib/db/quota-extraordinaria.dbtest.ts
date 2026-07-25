// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Toda a fixture corre dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Reproduz exatamente a query de
// app/actions/financas.ts:validarAssembleiaPonto (G05) — não pode chamar a
// server action diretamente (exige sessão via requireAdmin), e a validação
// é feita na aplicação, não por uma FK composta na BD (assembleiaPonto não
// tem condominioId próprio nem unique(id, condominioId) — ver comentário em
// lib/db/schema.ts, tabela movimento).
import { and, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { assembleia, assembleiaPonto, condominio } from './schema'

class RollbackDeTeste extends Error {}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function pontoElegivel(tx: Tx, condominioId: number, assembleiaPontoId: number) {
  const [ponto] = await tx
    .select({ id: assembleiaPonto.id })
    .from(assembleiaPonto)
    .innerJoin(assembleia, eq(assembleiaPonto.assembleiaId, assembleia.id))
    .where(
      and(
        eq(assembleiaPonto.id, assembleiaPontoId),
        eq(assembleia.condominioId, condominioId),
        eq(assembleia.estado, 'aprovada'),
        eq(assembleiaPonto.resultado, 'aprovado'),
      ),
    )
    .limit(1)
  return ponto ?? null
}

describe('elegibilidade de ponto de assembleia para quota extraordinária (G05)', () => {
  it('ponto aprovado de assembleia aprovada, do próprio condomínio: elegível', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste quota extraordinária] Condomínio' })
          .returning({ id: condominio.id })

        const [assemb] = await tx
          .insert(assembleia)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            local: 'Sala de condóminos',
            dataPrimeiraConvocatoria: new Date('2026-03-01'),
            estado: 'aprovada',
          })
          .returning({ id: assembleia.id })

        const [ponto] = await tx
          .insert(assembleiaPonto)
          .values({
            assembleiaId: assemb.id,
            ordem: 1,
            titulo: 'Obra extraordinária no telhado',
            resultado: 'aprovado',
          })
          .returning({ id: assembleiaPonto.id })

        const elegivel = await pontoElegivel(tx, condo.id, ponto.id)
        expect(elegivel).not.toBeNull()

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('ponto de outro condomínio: não elegível (isolamento multi-tenant)', async () => {
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

        const [assembB] = await tx
          .insert(assembleia)
          .values({
            condominioId: condoB.id,
            userId: 'user-admin',
            local: 'Sala de condóminos',
            dataPrimeiraConvocatoria: new Date('2026-03-01'),
            estado: 'aprovada',
          })
          .returning({ id: assembleia.id })

        const [pontoDeB] = await tx
          .insert(assembleiaPonto)
          .values({
            assembleiaId: assembB.id,
            ordem: 1,
            titulo: 'Obra do condomínio B',
            resultado: 'aprovado',
          })
          .returning({ id: assembleiaPonto.id })

        // Consulta com o condominioId de A, mas o ponto pertence a B.
        const elegivel = await pontoElegivel(tx, condoA.id, pontoDeB.id)
        expect(elegivel).toBeNull()

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('ponto ainda não aprovado (resultado nulo): não elegível', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste quota extraordinária] Condomínio' })
          .returning({ id: condominio.id })

        const [assemb] = await tx
          .insert(assembleia)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            local: 'Sala de condóminos',
            dataPrimeiraConvocatoria: new Date('2026-03-01'),
            estado: 'aprovada',
          })
          .returning({ id: assembleia.id })

        const [ponto] = await tx
          .insert(assembleiaPonto)
          .values({
            assembleiaId: assemb.id,
            ordem: 1,
            titulo: 'Ponto ainda sem votação',
          })
          .returning({ id: assembleiaPonto.id })

        const elegivel = await pontoElegivel(tx, condo.id, ponto.id)
        expect(elegivel).toBeNull()

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('ponto aprovado mas de assembleia ainda não aprovada (ata não fechada): não elegível', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste quota extraordinária] Condomínio' })
          .returning({ id: condominio.id })

        const [assemb] = await tx
          .insert(assembleia)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            local: 'Sala de condóminos',
            dataPrimeiraConvocatoria: new Date('2026-03-01'),
            estado: 'realizada',
          })
          .returning({ id: assembleia.id })

        const [ponto] = await tx
          .insert(assembleiaPonto)
          .values({
            assembleiaId: assemb.id,
            ordem: 1,
            titulo: 'Obra votada mas ata ainda não aprovada',
            resultado: 'aprovado',
          })
          .returning({ id: assembleiaPonto.id })

        const elegivel = await pontoElegivel(tx, condo.id, ponto.id)
        expect(elegivel).toBeNull()

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
