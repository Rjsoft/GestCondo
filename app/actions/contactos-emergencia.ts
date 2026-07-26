'use server'

import { db } from '@/lib/db'
import { contactoEmergencia } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAdmin, requireMembroAprovado } from '@/lib/session'
import { and, asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/** Visível a qualquer membro aprovado — não é gestão, é referência de urgência. */
export async function getContactosEmergencia() {
  const m = await requireMembroAprovado()
  return db
    .select()
    .from(contactoEmergencia)
    .where(eq(contactoEmergencia.condominioId, m.condominioId))
    .orderBy(asc(contactoEmergencia.nome))
}

export async function criarContactoEmergencia(formData: FormData) {
  const admin = await requireAdmin()

  const nome = String(formData.get('nome') || '').trim()
  const telefone = String(formData.get('telefone') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()

  if (!nome || !telefone) throw new Error('Indique o nome e o telefone')

  const [novo] = await db
    .insert(contactoEmergencia)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      nome,
      telefone,
      descricao: descricao || null,
    })
    .returning({ id: contactoEmergencia.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'contactoEmergencia',
    entidadeId: novo.id,
    detalhes: nome,
  })

  revalidatePath('/')
}

export async function eliminarContactoEmergencia(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(contactoEmergencia)
    .where(and(eq(contactoEmergencia.id, id), eq(contactoEmergencia.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'contactoEmergencia',
    entidadeId: id,
  })

  revalidatePath('/')
}
