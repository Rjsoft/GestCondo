'use server'

import { db } from '@/lib/db'
import { fracao, movimento } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getMovimentos() {
  // Dados financeiros: admin, gestor, condómino ou auditor — não
  // inquilino nem fornecedor (ver lib/session.ts).
  const m = await requireAcessoFinanceiro()
  return db
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        isNull(movimento.deletedAt),
      ),
    )
    .orderBy(desc(movimento.data))
}

/**
 * Saldo do fundo de reserva (movimentos com destino "reserva"). O fundo de
 * reserva é obrigatório por lei (art.º 4.º do DL n.º 268/94) e segue-se à
 * parte das contas correntes do condomínio — nunca somado às quotas normais.
 */
export async function getSaldoFundoReserva() {
  const m = await requireAcessoFinanceiro()
  const movimentosReserva = await db
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        eq(movimento.destino, 'reserva'),
        isNull(movimento.deletedAt),
      ),
    )

  const receitas = movimentosReserva
    .filter((mv) => mv.tipo === 'receita')
    .reduce((s, mv) => s + Number(mv.valor), 0)
  const despesas = movimentosReserva
    .filter((mv) => mv.tipo === 'despesa')
    .reduce((s, mv) => s + Number(mv.valor), 0)

  return { receitas, despesas, saldo: receitas - despesas }
}

/**
 * Um único movimento (para o recibo). Devolve `null` em vez de lançar se
 * não existir ou não pertencer ao condomínio do membro atual — a página do
 * recibo trata isso como "não encontrado", não como erro.
 */
export async function getMovimentoPorId(id: number) {
  const m = await requireAcessoFinanceiro()
  const [mov] = await db
    .select()
    .from(movimento)
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, m.condominioId)))
    .limit(1)
  return mov ?? null
}

/**
 * Mapa de saldos: para cada fração, quanto foi lançado em quotas (receitas
 * ligadas a essa fração), quanto já foi pago, e quanto está em dívida.
 * Responde diretamente a "quanto deve o 2ºEsq?" — a peça financeira mais
 * pedida na auditoria (FUNCTIONAL_GAPS.md secção 3).
 */
export async function getMapaSaldos() {
  const m = await requireAcessoFinanceiro()

  const [fracoes, quotas] = await Promise.all([
    db
      .select()
      .from(fracao)
      .where(eq(fracao.condominioId, m.condominioId))
      .orderBy(asc(fracao.identificacao)),
    db
      .select()
      .from(movimento)
      .where(
        and(
          eq(movimento.condominioId, m.condominioId),
          eq(movimento.tipo, 'receita'),
          isNull(movimento.deletedAt),
        ),
      ),
  ])

  return fracoes.map((f) => {
    const quotasDaFracao = quotas.filter((q) => q.fracaoId === f.id)
    const totalLancado = quotasDaFracao.reduce((s, q) => s + Number(q.valor), 0)
    const totalPago = quotasDaFracao
      .filter((q) => q.pago)
      .reduce((s, q) => s + Number(q.valor), 0)
    return {
      fracaoId: f.id,
      identificacao: f.identificacao,
      proprietario: f.proprietario,
      totalLancado,
      totalPago,
      emDivida: totalLancado - totalPago,
    }
  })
}

export async function criarMovimento(formData: FormData) {
  const admin = await requireAdmin()

  const tipo = String(formData.get('tipo') || 'despesa')
  const categoria = String(formData.get('categoria') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const valor = String(formData.get('valor') || '0')
  const dataStr = String(formData.get('data') || '')
  const pago = formData.get('pago') === 'on' || formData.get('pago') === 'true'
  const fracaoIdRaw = String(formData.get('fracaoId') || '').trim()
  const fracaoId = fracaoIdRaw ? Number(fracaoIdRaw) : null
  const destino = String(formData.get('destino') || 'geral')

  if (!categoria || !descricao || !valor) {
    throw new Error('Preencha todos os campos obrigatórios')
  }
  // Uma quota (receita) tem de estar ligada a uma fração para se poder
  // calcular a dívida por fração (ver getMapaSaldos); despesas são gerais
  // do condomínio e não precisam de fração.
  if (tipo === 'receita' && !fracaoId) {
    throw new Error('Selecione a fração a que esta quota diz respeito')
  }
  if (destino !== 'geral' && destino !== 'reserva') {
    throw new Error('Destino inválido')
  }

  const [novo] = await db
    .insert(movimento)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      tipo,
      categoria,
      descricao,
      valor,
      pago,
      fracaoId: tipo === 'receita' ? fracaoId : null,
      destino,
      ...(dataStr ? { data: new Date(dataStr) } : {}),
    })
    .returning({ id: movimento.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'movimento',
    entidadeId: novo.id,
    detalhes: `${tipo}: ${categoria} — ${descricao} (${valor} €)${destino === 'reserva' ? ' [fundo de reserva]' : ''}`,
  })

  revalidatePath('/financas')
  revalidatePath('/')
}

export async function eliminarMovimento(id: number) {
  const admin = await requireAdmin()
  // Soft-delete: registos financeiros têm obrigação legal de retenção —
  // nunca eliminar fisicamente (ver comentário em lib/db/schema.ts).
  await db
    .update(movimento)
    .set({ deletedAt: new Date() })
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'movimento',
    entidadeId: id,
  })

  revalidatePath('/financas')
  revalidatePath('/')
}

export async function alternarPago(id: number, pago: boolean) {
  const admin = await requireAdmin()
  await db
    .update(movimento)
    .set({ pago })
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'movimento',
    entidadeId: id,
    detalhes: pago ? 'Marcado como pago' : 'Marcado como pendente',
  })

  revalidatePath('/financas')
}
