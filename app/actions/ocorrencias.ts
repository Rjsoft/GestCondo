'use server'

import { db } from '@/lib/db'
import { ocorrencia } from '@/lib/db/schema'
import { requireAdmin, requireMembroAprovado } from '@/lib/session'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getOcorrencias() {
  const m = await requireMembroAprovado()
  // Admin vê todas; condómino vê as suas.
  if (m.perfil === 'admin') {
    return db.select().from(ocorrencia).orderBy(desc(ocorrencia.createdAt))
  }
  return db
    .select()
    .from(ocorrencia)
    .where(eq(ocorrencia.userId, m.userId))
    .orderBy(desc(ocorrencia.createdAt))
}

export async function criarOcorrencia(formData: FormData) {
  const m = await requireMembroAprovado()

  const titulo = String(formData.get('titulo') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const local = String(formData.get('local') || '').trim()
  const categoria = String(formData.get('categoria') || 'manutencao')
  const prioridade = String(formData.get('prioridade') || 'normal')

  if (!titulo || !descricao) {
    throw new Error('Preencha o título e a descrição')
  }

  await db.insert(ocorrencia).values({
    userId: m.userId,
    reporterNome: m.nome,
    titulo,
    descricao,
    local: local || null,
    categoria,
    prioridade,
    estado: 'aberta',
  })

  revalidatePath('/ocorrencias')
  revalidatePath('/')
}

const ESTADOS = ['aberta', 'em_curso', 'resolvida']

export async function atualizarEstadoOcorrencia(id: number, estado: string) {
  // Apenas admin gere o estado das ocorrências.
  await requireAdmin()
  if (!ESTADOS.includes(estado)) throw new Error('Estado inválido')
  await db
    .update(ocorrencia)
    .set({ estado, updatedAt: new Date() })
    .where(eq(ocorrencia.id, id))
  revalidatePath('/ocorrencias')
  revalidatePath('/')
}

export async function eliminarOcorrencia(id: number) {
  const m = await requireMembroAprovado()
  // Admin pode eliminar qualquer; condómino só as suas.
  if (m.perfil === 'admin') {
    await db.delete(ocorrencia).where(eq(ocorrencia.id, id))
  } else {
    await db
      .delete(ocorrencia)
      .where(and(eq(ocorrencia.id, id), eq(ocorrencia.userId, m.userId)))
  }
  revalidatePath('/ocorrencias')
}
