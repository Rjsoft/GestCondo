'use server'

import { db } from '@/lib/db'
import { aviso } from '@/lib/db/schema'
import { requireAdmin, requireMembroAprovado } from '@/lib/session'
import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getAvisos() {
  await requireMembroAprovado()
  return db.select().from(aviso).orderBy(desc(aviso.createdAt))
}

export async function criarAviso(formData: FormData) {
  const admin = await requireAdmin()

  const titulo = String(formData.get('titulo') || '').trim()
  const conteudo = String(formData.get('conteudo') || '').trim()
  const prioridade = String(formData.get('prioridade') || 'normal')

  if (!titulo || !conteudo) {
    throw new Error('Preencha o título e o conteúdo')
  }

  await db.insert(aviso).values({
    userId: admin.userId,
    autorNome: admin.nome,
    titulo,
    conteudo,
    prioridade,
  })

  revalidatePath('/avisos')
  revalidatePath('/')
}

export async function eliminarAviso(id: number) {
  await requireAdmin()
  await db.delete(aviso).where(eq(aviso.id, id))
  revalidatePath('/avisos')
  revalidatePath('/')
}
