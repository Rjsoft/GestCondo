'use server'

import { db } from '@/lib/db'
import { aviso } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAdmin, requireMembroAprovado } from '@/lib/session'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getAvisos() {
  const m = await requireMembroAprovado()
  return db
    .select()
    .from(aviso)
    .where(eq(aviso.condominioId, m.condominioId))
    .orderBy(desc(aviso.createdAt))
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
