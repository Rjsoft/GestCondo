'use server'

import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { assembleia, assembleiaPonto, fracao, movimento } from '@/lib/db/schema'
import { requireMembroPagina, temPermissaoGestao } from '@/lib/session'
import {
  detetarAtasPorEscrever,
  detetarFracoesSemPermilagem,
  detetarMovimentosDuplicados,
  detetarPontosSemResultado,
  type Inconsistencia,
} from '@/lib/inconsistencias'

/**
 * Deteção preventiva de inconsistências (docs/audit/AI_FEATURES_VIABILITY.md,
 * item P0) — só verificações determinísticas sobre estados reais do schema,
 * sem IA. Só administradores/gestores, pelo mesmo critério já usado para
 * outras ferramentas operacionais (ex. antiguidade da dívida).
 */
export async function getInconsistencias(): Promise<Inconsistencia[]> {
  const m = await requireMembroPagina()
  if (!temPermissaoGestao(m)) return []

  const [fracoes, movimentos, assembleias] = await Promise.all([
    db.select().from(fracao).where(eq(fracao.condominioId, m.condominioId)),
    db
      .select()
      .from(movimento)
      .where(and(eq(movimento.condominioId, m.condominioId), isNull(movimento.deletedAt))),
    db.select().from(assembleia).where(eq(assembleia.condominioId, m.condominioId)),
  ])

  const assembleiaIds = assembleias.map((a) => a.id)
  const pontos = assembleiaIds.length
    ? await db.select().from(assembleiaPonto).where(inArray(assembleiaPonto.assembleiaId, assembleiaIds))
    : []

  const hoje = new Date()

  return [
    ...detetarFracoesSemPermilagem(
      fracoes.map((f) => ({ id: f.id, identificacao: f.identificacao, permilagem: Number(f.permilagem) })),
    ),
    ...detetarMovimentosDuplicados(
      movimentos.map((mv) => ({
        id: mv.id,
        fracaoId: mv.fracaoId,
        valor: Number(mv.valor),
        data: mv.data,
        tipo: mv.tipo,
        descricao: mv.descricao,
      })),
    ),
    ...detetarAtasPorEscrever(
      assembleias.map((a) => ({
        id: a.id,
        dataPrimeiraConvocatoria: a.dataPrimeiraConvocatoria,
        estado: a.estado,
        textoAta: a.textoAta,
      })),
      hoje,
    ),
    ...detetarPontosSemResultado(
      assembleias.map((a) => ({
        id: a.id,
        dataPrimeiraConvocatoria: a.dataPrimeiraConvocatoria,
        estado: a.estado,
        textoAta: a.textoAta,
      })),
      pontos.map((p) => ({ id: p.id, assembleiaId: p.assembleiaId, titulo: p.titulo, resultado: p.resultado })),
    ),
  ]
}
