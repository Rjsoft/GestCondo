// Teste de integração contra uma base de dados PostgreSQL REAL (ver
// vitest.db.config.ts) — corre com `pnpm test:db`, não faz parte de
// `pnpm test`/CI. Fixture e asserções correm dentro de uma transação sempre
// revertida no fim, pelo que nada fica persistido na base de dados real.
//
// Cobre a parte tecnicamente mais arriscada de
// app/actions/condominio.ts:exportarCondominio/importarCondominio: que uma
// única instrução INSERT...RETURNING do Postgres devolve as linhas na MESMA
// ordem do array de `.values()` (pressuposto de que depende todo o
// remapeamento de ids feito em importarCondominio), combinada com os
// helpers reais de lib/importacao-condominio.ts (não reproduzidos — são
// puros e pequenos, por isso importados diretamente). Não repete aqui o
// remapeamento das ~20 tabelas cobertas pela função real — só a cadeia de
// duas fases (fração → movimento; assembleia → ponto → voto) que exercita
// o padrão de remapeamento em vários níveis.
import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { db } from './index'
import {
  assembleia,
  assembleiaPonto,
  assembleiaVoto,
  condominio,
  fracao,
  movimento,
  orcamento,
  orcamentoRubrica,
} from './schema'
import { paraData, remapear, remapearOpcional } from '@/lib/importacao-condominio'

class RollbackDeTeste extends Error {}

describe('exportação/importação de condomínio — remapeamento de ids', () => {
  it('recria frações, orçamento+rubrica, movimentos e assembleia+ponto+voto num condomínio novo, com ids remapeados corretamente', async () => {
    await expect(
      db.transaction(async (tx) => {
        // --- fixture: condomínio de origem com dados relacionados ---
        const [condoOrigem] = await tx
          .insert(condominio)
          .values({ nome: '[teste import/export] origem' })
          .returning({ id: condominio.id })

        const fracoesOrigem = await tx
          .insert(fracao)
          .values([
            { condominioId: condoOrigem.id, userId: 'u1', identificacao: 'A', proprietario: 'Ana', permilagem: '600' },
            { condominioId: condoOrigem.id, userId: 'u1', identificacao: 'B', proprietario: 'Bruno', permilagem: '400' },
          ])
          .returning()

        const [orcamentoOrigem] = await tx
          .insert(orcamento)
          .values({ condominioId: condoOrigem.id, userId: 'u1', ano: 2026, valorAnual: '1200.00' })
          .returning()

        await tx
          .insert(orcamentoRubrica)
          .values({ orcamentoId: orcamentoOrigem.id, categoria: 'Limpeza', valorOrcamentado: '500.00' })

        await tx
          .insert(movimento)
          .values([
            {
              condominioId: condoOrigem.id,
              userId: 'u1',
              tipo: 'receita',
              categoria: 'Quota',
              descricao: 'Quota Janeiro — fração A',
              valor: '50.00',
              fracaoId: fracoesOrigem[0].id,
              orcamentoId: orcamentoOrigem.id,
            },
            {
              condominioId: condoOrigem.id,
              userId: 'u1',
              tipo: 'despesa',
              categoria: 'Limpeza',
              descricao: 'Limpeza mensal',
              valor: '80.00',
            },
          ])

        const [assembleiaOrigem] = await tx
          .insert(assembleia)
          .values({
            condominioId: condoOrigem.id,
            userId: 'u1',
            tipo: 'ordinaria',
            local: 'Hall',
            dataPrimeiraConvocatoria: new Date('2026-03-01T18:00:00.000Z'),
            numero: 1,
          })
          .returning()

        const [pontoOrigem] = await tx
          .insert(assembleiaPonto)
          .values({ assembleiaId: assembleiaOrigem.id, ordem: 1, titulo: 'Aprovação de contas' })
          .returning()

        const votosOrigem = await tx
          .insert(assembleiaVoto)
          .values([
            { pontoId: pontoOrigem.id, fracaoId: fracoesOrigem[0].id, voto: 'favor' },
            { pontoId: pontoOrigem.id, fracaoId: fracoesOrigem[1].id, voto: 'contra' },
          ])
          .returning()

        // --- "exportação": leitura filtrada por condominioId (mesmo padrão de exportarCondominio) ---
        const dados = {
          fracoes: await tx.select().from(fracao).where(eq(fracao.condominioId, condoOrigem.id)),
          orcamentos: await tx.select().from(orcamento).where(eq(orcamento.condominioId, condoOrigem.id)),
          orcamentoRubricas: await tx
            .select()
            .from(orcamentoRubrica)
            .where(eq(orcamentoRubrica.orcamentoId, orcamentoOrigem.id)),
          movimentos: await tx.select().from(movimento).where(eq(movimento.condominioId, condoOrigem.id)),
          assembleias: await tx.select().from(assembleia).where(eq(assembleia.condominioId, condoOrigem.id)),
          assembleiaPontos: [pontoOrigem],
          assembleiaVotos: votosOrigem,
        }

        // --- "importação": condomínio novo, ids remapeados (mesma lógica de importarCondominio) ---
        const [condoDestino] = await tx
          .insert(condominio)
          .values({ nome: '[teste import/export] destino (importado)' })
          .returning({ id: condominio.id })

        const mapaFracao = new Map<number, number>()
        const fracoesInseridas = await tx
          .insert(fracao)
          .values(
            dados.fracoes.map((f) => ({
              condominioId: condoDestino.id,
              userId: f.userId,
              identificacao: f.identificacao,
              proprietario: f.proprietario,
              permilagem: f.permilagem,
              createdAt: paraData(f.createdAt),
            })),
          )
          .returning({ id: fracao.id })
        dados.fracoes.forEach((f, i) => mapaFracao.set(f.id, fracoesInseridas[i].id))

        const mapaOrcamento = new Map<number, number>()
        const orcamentosInseridos = await tx
          .insert(orcamento)
          .values(
            dados.orcamentos.map((o) => ({
              condominioId: condoDestino.id,
              userId: o.userId,
              ano: o.ano,
              valorAnual: o.valorAnual,
              createdAt: paraData(o.createdAt),
            })),
          )
          .returning({ id: orcamento.id })
        dados.orcamentos.forEach((o, i) => mapaOrcamento.set(o.id, orcamentosInseridos[i].id))

        await tx.insert(orcamentoRubrica).values(
          dados.orcamentoRubricas.map((r) => ({
            orcamentoId: remapear(mapaOrcamento, r.orcamentoId),
            categoria: r.categoria,
            valorOrcamentado: r.valorOrcamentado,
            createdAt: paraData(r.createdAt),
          })),
        )

        const movimentosInseridos = await tx
          .insert(movimento)
          .values(
            dados.movimentos.map((m) => ({
              condominioId: condoDestino.id,
              userId: m.userId,
              tipo: m.tipo,
              categoria: m.categoria,
              descricao: m.descricao,
              valor: m.valor,
              fracaoId: remapearOpcional(mapaFracao, m.fracaoId),
              orcamentoId: remapearOpcional(mapaOrcamento, m.orcamentoId),
              createdAt: paraData(m.createdAt),
            })),
          )
          .returning()

        const mapaAssembleia = new Map<number, number>()
        const assembleiasInseridas = await tx
          .insert(assembleia)
          .values(
            dados.assembleias.map((a) => ({
              condominioId: condoDestino.id,
              userId: a.userId,
              tipo: a.tipo,
              local: a.local,
              dataPrimeiraConvocatoria: paraData(a.dataPrimeiraConvocatoria),
              numero: a.numero,
              createdAt: paraData(a.createdAt),
            })),
          )
          .returning({ id: assembleia.id })
        dados.assembleias.forEach((a, i) => mapaAssembleia.set(a.id, assembleiasInseridas[i].id))

        const mapaPonto = new Map<number, number>()
        const pontosInseridos = await tx
          .insert(assembleiaPonto)
          .values(
            dados.assembleiaPontos.map((p) => ({
              assembleiaId: remapear(mapaAssembleia, p.assembleiaId),
              ordem: p.ordem,
              titulo: p.titulo,
              createdAt: paraData(p.createdAt),
            })),
          )
          .returning({ id: assembleiaPonto.id })
        dados.assembleiaPontos.forEach((p, i) => mapaPonto.set(p.id, pontosInseridos[i].id))

        await tx.insert(assembleiaVoto).values(
          dados.assembleiaVotos.map((v) => ({
            pontoId: remapear(mapaPonto, v.pontoId),
            fracaoId: remapear(mapaFracao, v.fracaoId),
            voto: v.voto,
            createdAt: paraData(v.createdAt),
          })),
        )

        // --- asserções ---

        // Mesmas contagens que a origem.
        expect(fracoesInseridas.length).toBe(2)
        expect(movimentosInseridos.length).toBe(2)

        // Os ids do condomínio novo são mesmo novos (nunca coincidem com os da origem).
        expect(fracoesInseridas.every((f, i) => f.id !== fracoesOrigem[i].id)).toBe(true)

        // Movimento "Quota" fica ligado à fração A e ao orçamento DO CONDOMÍNIO NOVO.
        const movQuota = movimentosInseridos.find((m) => m.categoria === 'Quota')!
        expect(movQuota.condominioId).toBe(condoDestino.id)
        expect(movQuota.fracaoId).toBe(mapaFracao.get(fracoesOrigem[0].id))
        expect(movQuota.orcamentoId).toBe(mapaOrcamento.get(orcamentoOrigem.id))
        // Nunca aponta para a fração/orçamento do condomínio de ORIGEM.
        expect(movQuota.fracaoId).not.toBe(fracoesOrigem[0].id)
        expect(movQuota.orcamentoId).not.toBe(orcamentoOrigem.id)

        // Movimento sem fração/orçamento (despesa solta) continua sem eles.
        const movDespesa = movimentosInseridos.find((m) => m.categoria === 'Limpeza')!
        expect(movDespesa.fracaoId).toBeNull()
        expect(movDespesa.orcamentoId).toBeNull()

        // Número da ata (facto histórico) preservado tal e qual.
        expect(assembleiasInseridas.length).toBe(1)
        const [novaAssembleia] = await tx
          .select()
          .from(assembleia)
          .where(eq(assembleia.id, assembleiasInseridas[0].id))
        expect(novaAssembleia.numero).toBe(1)

        // Votos remapeados: pontoId aponta para o ponto novo, fracaoId para a fração nova certa.
        const votosNovos = await tx
          .select()
          .from(assembleiaVoto)
          .where(eq(assembleiaVoto.pontoId, pontosInseridos[0].id))
        expect(votosNovos).toHaveLength(2)
        const votoFavor = votosNovos.find((v) => v.voto === 'favor')!
        expect(votoFavor.fracaoId).toBe(mapaFracao.get(fracoesOrigem[0].id))

        // O condomínio de origem continua intacto (isolamento — nada foi alterado lá).
        const fracoesOrigemDepois = await tx
          .select()
          .from(fracao)
          .where(eq(fracao.condominioId, condoOrigem.id))
        expect(fracoesOrigemDepois).toHaveLength(2)

        throw new RollbackDeTeste('reverter fixture de teste, nunca persistir')
      }),
    ).rejects.toThrow(RollbackDeTeste)
  })
})
