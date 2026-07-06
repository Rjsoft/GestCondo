'use server'

import { db } from '@/lib/db'
import { documento } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAdmin, requireMembroAprovado } from '@/lib/session'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getDocumentos() {
  const m = await requireMembroAprovado()
  return db
    .select()
    .from(documento)
    .where(eq(documento.condominioId, m.condominioId))
    .orderBy(desc(documento.createdAt))
}

export async function criarDocumento(formData: FormData) {
  const admin = await requireAdmin()

  const titulo = String(formData.get('titulo') || '').trim()
  const categoria = String(formData.get('categoria') || 'ata')
  const descricao = String(formData.get('descricao') || '').trim()
  const url = String(formData.get('url') || '').trim()

  if (!titulo) {
    throw new Error('Preencha o título do documento')
  }
  if (url && !/^https?:\/\//i.test(url)) {
    throw new Error('O link deve começar por http:// ou https://')
  }

  const [novo] = await db
    .insert(documento)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      titulo,
      categoria,
      descricao: descricao || null,
      url: url || null,
    })
    .returning({ id: documento.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'documento',
    entidadeId: novo.id,
    detalhes: titulo,
  })

  revalidatePath('/documentos')
}

export async function eliminarDocumento(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(documento)
    .where(and(eq(documento.id, id), eq(documento.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'documento',
    entidadeId: id,
  })

  revalidatePath('/documentos')
}
