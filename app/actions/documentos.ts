'use server'

import { db } from '@/lib/db'
import { documento } from '@/lib/db/schema'
import { requireAdmin, requireMembroAprovado } from '@/lib/session'
import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getDocumentos() {
  await requireMembroAprovado()
  return db.select().from(documento).orderBy(desc(documento.createdAt))
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

  await db.insert(documento).values({
    userId: admin.userId,
    titulo,
    categoria,
    descricao: descricao || null,
    url: url || null,
  })

  revalidatePath('/documentos')
}

export async function eliminarDocumento(id: number) {
  await requireAdmin()
  await db.delete(documento).where(eq(documento.id, id))
  revalidatePath('/documentos')
}
