'use server'

import { db } from '@/lib/db'
import { extratoBancario, movimento } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { garantirExercicioAberto } from '@/lib/contas-financeiras'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// `data` viaja como string ISO (não Date) — evita qualquer dúvida sobre
// serialização de objetos Date na fronteira do server action.
export type LinhaParaImportar = { data: string; descricao: string; valor: number }

function chaveLinha(data: Date, descricao: string, valor: string | number) {
  return `${new Date(data).toISOString().slice(0, 10)}|${descricao}|${Number(valor).toFixed(2)}`
}

/**
 * Importa linhas de extrato já mapeadas (ver lib/extrato.ts:mapearLinhas)
 * para a tabela extratoBancario. Ignora silenciosamente linhas idênticas
 * (mesma data + descrição + valor) já importadas anteriormente para este
 * condomínio — protege contra reimportar o mesmo período por engano.
 */
export async function importarLinhas(linhas: LinhaParaImportar[]) {
  const admin = await requireAdmin()

  if (linhas.length === 0) {
    throw new Error('Nenhuma linha para importar')
  }

  const existentes = await db
    .select({
      data: extratoBancario.data,
      descricao: extratoBancario.descricao,
      valor: extratoBancario.valor,
    })
    .from(extratoBancario)
    .where(eq(extratoBancario.condominioId, admin.condominioId))

  const chavesExistentes = new Set(
    existentes.map((e) => chaveLinha(e.data, e.descricao, e.valor)),
  )

  const aInserir = linhas.filter(
    (l) => !chavesExistentes.has(chaveLinha(new Date(l.data), l.descricao, l.valor)),
  )

  if (aInserir.length === 0) {
    throw new Error('Todas as linhas já tinham sido importadas anteriormente')
  }

  const inseridas = await db
    .insert(extratoBancario)
    .values(
      aInserir.map((l) => ({
        condominioId: admin.condominioId,
        userId: admin.userId,
        data: new Date(l.data),
        descricao: l.descricao,
        valor: l.valor.toFixed(2),
      })),
    )
    .returning({ id: extratoBancario.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'extratoBancario',
    entidadeId: inseridas[0].id,
    detalhes: `Importadas ${aInserir.length} linha(s) de extrato (${linhas.length - aInserir.length} ignorada(s) por já existirem)`,
  })

  revalidatePath('/financas')

  return { importadas: aInserir.length, duplicadas: linhas.length - aInserir.length }
}

export async function getLinhasPorConciliar() {
  const m = await requireAcessoFinanceiro()
  return db
    .select()
    .from(extratoBancario)
    .where(
      and(
        eq(extratoBancario.condominioId, m.condominioId),
        isNull(extratoBancario.conciliadoMovimentoId),
        eq(extratoBancario.ignorado, false),
      ),
    )
    .orderBy(desc(extratoBancario.data))
}

/** Linhas já conciliadas, com o movimento associado — para permitir "desfazer". */
export async function getLinhasConciliadas() {
  const m = await requireAcessoFinanceiro()
  const linhas = await db
    .select()
    .from(extratoBancario)
    .where(
      and(
        eq(extratoBancario.condominioId, m.condominioId),
        isNotNull(extratoBancario.conciliadoMovimentoId),
      ),
    )
    .orderBy(desc(extratoBancario.data))

  const movimentoIds = linhas
    .map((l) => l.conciliadoMovimentoId)
    .filter((id): id is number => id !== null)
  if (movimentoIds.length === 0) return []

  const movimentosAssociados = await db
    .select({ id: movimento.id, categoria: movimento.categoria, descricao: movimento.descricao })
    .from(movimento)
    .where(and(eq(movimento.condominioId, m.condominioId), inArray(movimento.id, movimentoIds)))

  const movimentoPorId = new Map(movimentosAssociados.map((mv) => [mv.id, mv]))

  return linhas.map((l) => ({
    ...l,
    movimento: movimentoPorId.get(l.conciliadoMovimentoId!) ?? null,
  }))
}

/**
 * Movimentos elegíveis para conciliação: só conta corrente (destino
 * "geral"), já pagos/liquidados (pago = true — só estes chegaram a passar
 * pelo banco), não eliminados. A lista final exclui os já conciliados
 * comparando com getLinhasPorConciliarTodas (ver getMovimentosPorConciliar).
 */
async function getMovimentosElegiveis(condominioId: number) {
  return db
    .select({
      id: movimento.id,
      data: movimento.data,
      valor: movimento.valor,
      tipo: movimento.tipo,
      categoria: movimento.categoria,
      descricao: movimento.descricao,
    })
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, condominioId),
        eq(movimento.destino, 'geral'),
        eq(movimento.pago, true),
        isNull(movimento.deletedAt),
      ),
    )
    .orderBy(desc(movimento.data))
}

export async function getMovimentosPorConciliar() {
  const m = await requireAcessoFinanceiro()

  const [elegiveis, conciliados] = await Promise.all([
    getMovimentosElegiveis(m.condominioId),
    db
      .select({ movimentoId: extratoBancario.conciliadoMovimentoId })
      .from(extratoBancario)
      .where(eq(extratoBancario.condominioId, m.condominioId)),
  ])

  const idsConciliados = new Set(
    conciliados.map((c) => c.movimentoId).filter((id): id is number => id !== null),
  )

  return elegiveis.filter((mv) => !idsConciliados.has(mv.id))
}

export async function conciliarLinha(linhaId: number, movimentoId: number) {
  const admin = await requireAdmin()

  const [linha] = await db
    .select()
    .from(extratoBancario)
    .where(and(eq(extratoBancario.id, linhaId), eq(extratoBancario.condominioId, admin.condominioId)))
    .limit(1)
  if (!linha) throw new Error('Linha de extrato não encontrada')

  const [mov] = await db
    .select()
    .from(movimento)
    .where(and(eq(movimento.id, movimentoId), eq(movimento.condominioId, admin.condominioId)))
    .limit(1)
  if (!mov) throw new Error('Movimento não encontrado')

  // Nunca conciliar uma linha de uma conta com um movimento de outra —
  // só aplicável quando ambos já têm conta definida (dados anteriores a
  // esta funcionalidade continuam a poder conciliar-se livremente).
  if (linha.contaFinanceiraId && mov.contaFinanceiraId && linha.contaFinanceiraId !== mov.contaFinanceiraId) {
    throw new Error('Esta linha e este movimento pertencem a contas financeiras diferentes')
  }
  await garantirExercicioAberto(admin.condominioId, mov.data)

  await db
    .update(extratoBancario)
    .set({ conciliadoMovimentoId: movimentoId })
    .where(
      and(
        eq(extratoBancario.id, linhaId),
        eq(extratoBancario.condominioId, admin.condominioId),
      ),
    )

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'extratoBancario',
    entidadeId: linhaId,
    detalhes: `Conciliada com movimento #${movimentoId}`,
  })

  revalidatePath('/financas')
}

export async function desfazerConciliacao(linhaId: number) {
  const admin = await requireAdmin()

  const [linha] = await db
    .select()
    .from(extratoBancario)
    .where(and(eq(extratoBancario.id, linhaId), eq(extratoBancario.condominioId, admin.condominioId)))
    .limit(1)
  if (!linha) throw new Error('Linha de extrato não encontrada')

  if (linha.conciliadoMovimentoId) {
    const [mov] = await db
      .select()
      .from(movimento)
      .where(eq(movimento.id, linha.conciliadoMovimentoId))
      .limit(1)
    if (mov) await garantirExercicioAberto(admin.condominioId, mov.data)
  }

  await db
    .update(extratoBancario)
    .set({ conciliadoMovimentoId: null })
    .where(
      and(
        eq(extratoBancario.id, linhaId),
        eq(extratoBancario.condominioId, admin.condominioId),
      ),
    )

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'extratoBancario',
    entidadeId: linhaId,
    detalhes: 'Conciliação desfeita',
  })

  revalidatePath('/financas')
}

export async function ignorarLinha(linhaId: number, ignorado: boolean) {
  const admin = await requireAdmin()

  await db
    .update(extratoBancario)
    .set({ ignorado })
    .where(
      and(
        eq(extratoBancario.id, linhaId),
        eq(extratoBancario.condominioId, admin.condominioId),
      ),
    )

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'extratoBancario',
    entidadeId: linhaId,
    detalhes: ignorado ? 'Linha marcada como ignorada' : 'Linha reposta como por conciliar',
  })

  revalidatePath('/financas')
}
