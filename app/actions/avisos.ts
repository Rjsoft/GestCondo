'use server'

import { db } from '@/lib/db'
import { aviso, membro } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { requireAdmin, requireMembroAprovado } from '@/lib/session'
import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 20

export async function getAvisos({ page = 1, search = '' }: { page?: number; search?: string } = {}) {
  const m = await requireMembroAprovado()
  const condicao = search
    ? and(
        eq(aviso.condominioId, m.condominioId),
        or(ilike(aviso.titulo, `%${search}%`), ilike(aviso.conteudo, `%${search}%`)),
      )
    : eq(aviso.condominioId, m.condominioId)

  const [avisos, [{ total }]] = await Promise.all([
    db
      .select()
      .from(aviso)
      .where(condicao)
      .orderBy(desc(aviso.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(aviso).where(condicao),
  ])

  return { avisos, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
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
    .delete(aviso)
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
