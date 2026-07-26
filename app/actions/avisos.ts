'use server'

import { db } from '@/lib/db'
import { aviso, confirmacaoLeitura, membro } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { requireAdmin, requireMembroAprovado } from '@/lib/session'
import { confirmarLeitura, getConfirmacoesLeitura } from '@/lib/confirmacao-leitura'
import { and, count, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 20

export async function getAvisos({ page = 1, search = '' }: { page?: number; search?: string } = {}) {
  const m = await requireMembroAprovado()
  const base = and(eq(aviso.condominioId, m.condominioId), isNull(aviso.deletedAt))
  const condicao = search
    ? and(
        base,
        or(
          sql`unaccent(${aviso.titulo}) ilike unaccent(${`%${search}%`})`,
          sql`unaccent(${aviso.conteudo}) ilike unaccent(${`%${search}%`})`,
        ),
      )
    : base

  const [avisosPagina, [{ total }]] = await Promise.all([
    db
      .select()
      .from(aviso)
      .where(condicao)
      .orderBy(desc(aviso.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(aviso).where(condicao),
  ])

  const avisoIds = avisosPagina.map((a) => a.id)
  const confirmacoes = avisoIds.length
    ? await db
        .select({ entidadeId: confirmacaoLeitura.entidadeId, membroId: confirmacaoLeitura.membroId })
        .from(confirmacaoLeitura)
        .where(
          and(
            eq(confirmacaoLeitura.condominioId, m.condominioId),
            eq(confirmacaoLeitura.entidade, 'aviso'),
            inArray(confirmacaoLeitura.entidadeId, avisoIds),
          ),
        )
    : []

  const avisos = avisosPagina.map((a) => ({
    ...a,
    totalConfirmacoes: confirmacoes.filter((c) => c.entidadeId === a.id).length,
    jaConfirmei: confirmacoes.some((c) => c.entidadeId === a.id && c.membroId === m.id),
  }))

  return { avisos, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

/** Regista que o membro autenticado confirma ter lido este aviso. */
export async function confirmarLeituraAviso(id: number) {
  const m = await requireMembroAprovado()
  const [a] = await db
    .select({ id: aviso.id })
    .from(aviso)
    .where(and(eq(aviso.id, id), eq(aviso.condominioId, m.condominioId), isNull(aviso.deletedAt)))
    .limit(1)
  if (!a) throw new Error('Aviso não encontrado')

  await confirmarLeitura({
    condominioId: m.condominioId,
    membroId: m.id,
    entidade: 'aviso',
    entidadeId: id,
  })

  await registarAuditoria({
    actor: m,
    acao: 'atualizar',
    entidade: 'aviso',
    entidadeId: id,
    detalhes: 'Confirmação de leitura',
  })

  revalidatePath('/avisos')
}

/**
 * Lista de quem já confirmou a leitura — visível a qualquer membro aprovado,
 * mesmo critério já usado para presenças/votos de assembleia (accountability
 * partilhada, não é dado sensível de um membro em particular).
 */
export async function getConfirmacoesLeituraAviso(id: number) {
  const m = await requireMembroAprovado()
  return getConfirmacoesLeitura(m.condominioId, 'aviso', id)
}

export async function criarAviso(formData: FormData) {
  const admin = await requireAdmin()

  const titulo = String(formData.get('titulo') || '').trim()
  const conteudo = String(formData.get('conteudo') || '').trim()
  const prioridade = String(formData.get('prioridade') || 'normal')

  if (!titulo || !conteudo) {
    throw new Error('Preencha o título e o conteúdo')
  }

  const [novo] = await db
    .insert(aviso)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      autorNome: admin.nome,
      titulo,
      conteudo,
      prioridade,
    })
    .returning({ id: aviso.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'aviso',
    entidadeId: novo.id,
    detalhes: titulo,
  })

  // Avisos "importante"/"urgente" são notificados por email — os
  // "normal" ficam só na listagem, para não sobrecarregar a caixa de
  // entrada dos condóminos com comunicações rotineiras.
  if (prioridade === 'importante' || prioridade === 'urgente') {
    const membrosAprovados = await db
      .select({ email: membro.email })
      .from(membro)
      .where(and(eq(membro.condominioId, admin.condominioId), eq(membro.estado, 'aprovado')))

    await Promise.all(
      membrosAprovados.map((mb) =>
        sendEmail({
          to: mb.email,
          subject: `[${prioridade === 'urgente' ? 'Urgente' : 'Importante'}] ${titulo}`,
          html: `<p>${conteudo.replace(/\n/g, '<br>')}</p><p>— ${admin.nome}, GestCondo</p>`,
        }),
      ),
    )
  }

  revalidatePath('/avisos')
  revalidatePath('/')
}

export async function eliminarAviso(id: number) {
  const admin = await requireAdmin()
  await db
    .update(aviso)
    .set({ deletedAt: new Date() })
    .where(and(eq(aviso.id, id), eq(aviso.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'aviso',
    entidadeId: id,
  })

  revalidatePath('/avisos')
  revalidatePath('/')
}
