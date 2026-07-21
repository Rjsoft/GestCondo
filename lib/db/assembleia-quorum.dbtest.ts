// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Toda a fixture corre dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Reproduz exatamente a agregação de app/actions/assembleias.ts:
// getTotalPermilagem/getAssembleiaDetalhe contra o tipo `numeric` real do
// Postgres — quórum e votação por permilagem são a lógica mais sensível a
// erros de arredondamento/conversão string↔número deste módulo.
import { eq, inArray } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import { assembleia, assembleiaPonto, assembleiaPresenca, assembleiaVoto, condominio, fracao } from './schema'

class RollbackDeTeste extends Error {}

describe('quórum e votação por permilagem (assembleias)', () => {
  it('quórum = permilagem presente / permilagem total do condomínio', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste quórum] Condomínio' })
          .returning({ id: condominio.id })

        const [fracaoPresente] = await tx
          .insert(fracao)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            identificacao: '1ºEsq',
            proprietario: 'Presente',
            permilagem: '600',
          })
          .returning({ id: fracao.id })
        await tx.insert(fracao).values({
          condominioId: condo.id,
          userId: 'user-admin',
          identificacao: '2ºDto',
          proprietario: 'Ausente',
          permilagem: '400',
        })

        const [reuniao] = await tx
          .insert(assembleia)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'ordinaria',
            local: 'Hall',
            dataPrimeiraConvocatoria: new Date(),
          })
          .returning({ id: assembleia.id })

        await tx.insert(assembleiaPresenca).values({
          assembleiaId: reuniao.id,
          fracaoId: fracaoPresente.id,
          tipo: 'presencial',
        })

        // Reproduz exatamente getTotalPermilagem + a soma de presenças de
        // getAssembleiaDetalhe.
        const fracoes = await tx.select().from(fracao).where(eq(fracao.condominioId, condo.id))
        const totalPermilagem = fracoes.reduce((s, f) => s + Number(f.permilagem), 0)

        const presencas = await tx
          .select()
          .from(assembleiaPresenca)
          .where(eq(assembleiaPresenca.assembleiaId, reuniao.id))
        const fracaoPorId = new Map(fracoes.map((f) => [f.id, f]))
        const permilagemPresente = presencas.reduce(
          (s, p) => s + Number(fracaoPorId.get(p.fracaoId)?.permilagem ?? 0),
          0,
        )

        expect(totalPermilagem).toBe(1000)
        expect(permilagemPresente).toBe(600)
        expect((permilagemPresente / totalPermilagem) * 100).toBeCloseTo(60, 5)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })

  it('soma de permilagem por opção de voto num ponto da ordem de trabalhos', async () => {
    await expect(
      db.transaction(async (tx) => {
        const [condo] = await tx
          .insert(condominio)
          .values({ nome: '[teste votação] Condomínio' })
          .returning({ id: condominio.id })

        const [fracaoFavor] = await tx
          .insert(fracao)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            identificacao: '1ºEsq',
            proprietario: 'A favor',
            permilagem: '300',
          })
          .returning({ id: fracao.id })
        const [fracaoContra] = await tx
          .insert(fracao)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            identificacao: '2ºDto',
            proprietario: 'Contra',
            permilagem: '450',
          })
          .returning({ id: fracao.id })
        const [fracaoAbstem] = await tx
          .insert(fracao)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            identificacao: '3ºFrt',
            proprietario: 'Abstenção',
            permilagem: '250',
          })
          .returning({ id: fracao.id })

        const [reuniao] = await tx
          .insert(assembleia)
          .values({
            condominioId: condo.id,
            userId: 'user-admin',
            tipo: 'ordinaria',
            local: 'Hall',
            dataPrimeiraConvocatoria: new Date(),
          })
          .returning({ id: assembleia.id })

        const [ponto] = await tx
          .insert(assembleiaPonto)
          .values({ assembleiaId: reuniao.id, ordem: 1, titulo: 'Aprovação do orçamento' })
          .returning({ id: assembleiaPonto.id })

        await tx.insert(assembleiaVoto).values([
          { pontoId: ponto.id, fracaoId: fracaoFavor.id, voto: 'favor' },
          { pontoId: ponto.id, fracaoId: fracaoContra.id, voto: 'contra' },
          { pontoId: ponto.id, fracaoId: fracaoAbstem.id, voto: 'abstencao' },
        ])

        // Reproduz exatamente a agregação de votos por ponto de
        // getAssembleiaDetalhe.
        const fracoes = await tx.select().from(fracao).where(eq(fracao.condominioId, condo.id))
        const fracaoPorId = new Map(fracoes.map((f) => [f.id, f]))
        const votos = await tx
          .select()
          .from(assembleiaVoto)
          .where(inArray(assembleiaVoto.pontoId, [ponto.id]))
        const somaPermilagem = (voto: string) =>
          votos
            .filter((v) => v.voto === voto)
            .reduce((s, v) => s + Number(fracaoPorId.get(v.fracaoId)?.permilagem ?? 0), 0)

        expect(somaPermilagem('favor')).toBe(300)
        expect(somaPermilagem('contra')).toBe(450)
        expect(somaPermilagem('abstencao')).toBe(250)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
