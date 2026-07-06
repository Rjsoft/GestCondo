'use server'

import { db } from '@/lib/db'
import { movimento } from '@/lib/db/schema'
import { requireAdmin, requireMembroAprovado } from '@/lib/session'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getMovimentos() {
  // Dados partilhados do condomínio: todos os membros aprovados podem
  // consultar, mas apenas os do seu próprio condomínio.
  const m = await requireMembroAprovado()
  return db
    .select()
    .from(movimento)
    .where(eq(movimento.condominioId, m.condominioId))
    .orderBy(desc(movimento.data))
}

export async function criarMovimento(formData: FormData) {
  const admin = await requireAdmin()

  const tipo = String(formData.get('tipo') || 'despesa')
  const categoria = String(formData.get('categoria') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const valor = String(formData.get('valor') || '0')
  const dataStr = String(formData.get('data') || '')
  const pago = formData.get('pago') === 'on' || formData.get('pago') === 'true'

  if (!categoria || !descricao || !valor) {
    throw new Error('Preencha todos os campos obrigatórios')
  }

  await db.insert(movimento).values({
    condominioId: admin.condominioId,
    userId: admin.userId,
    tipo,
    categoria,
    descricao,
    valor,
    pago,
    ...(dataStr ? { data: new Date(dataStr) } : {}),
  })

  revalidatePath('/financas')
  revalidatePath('/')
}

export async function eliminarMovimento(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(movimento)
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))
  revalidatePath('/financas')
  revalidatePath('/')
}

export async function alternarPago(id: number, pago: boolean) {
  const admin = await requireAdmin()
  await db
    .update(movimento)
    .set({ pago })
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))
  revalidatePath('/financas')
}
