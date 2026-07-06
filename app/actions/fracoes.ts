'use server'

import { db } from '@/lib/db'
import { fracao, membro } from '@/lib/db/schema'
import { requireAdmin, requireMembroAprovado } from '@/lib/session'
import { and, asc, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getFracoes() {
  const m = await requireMembroAprovado()
  return db
    .select()
    .from(fracao)
    .where(eq(fracao.condominioId, m.condominioId))
    .orderBy(asc(fracao.identificacao))
}

export async function criarFracao(formData: FormData) {
  const admin = await requireAdmin()

  const identificacao = String(formData.get('identificacao') || '').trim()
  const proprietario = String(formData.get('proprietario') || '').trim()
  const permilagem = String(formData.get('permilagem') || '0')
  const contactoEmail = String(formData.get('contactoEmail') || '').trim()
  const contactoTelefone = String(formData.get('contactoTelefone') || '').trim()
  const notas = String(formData.get('notas') || '').trim()

  if (!identificacao || !proprietario) {
    throw new Error('Preencha a identificação e o proprietário')
  }

  await db.insert(fracao).values({
    condominioId: admin.condominioId,
    userId: admin.userId,
    identificacao,
    proprietario,
    permilagem,
    contactoEmail: contactoEmail || null,
    contactoTelefone: contactoTelefone || null,
    notas: notas || null,
  })

  revalidatePath('/fracoes')
  revalidatePath('/')
}

export async function eliminarFracao(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(fracao)
    .where(and(eq(fracao.id, id), eq(fracao.condominioId, admin.condominioId)))
  revalidatePath('/fracoes')
  revalidatePath('/')
}

// --- Membros / condóminos --------------------------------------------------

export async function getMembros() {
  const admin = await requireAdmin()
  return db
    .select()
    .from(membro)
    .where(eq(membro.condominioId, admin.condominioId))
    .orderBy(desc(membro.createdAt))
}

const PERFIS = ['admin', 'condomino']

export async function atualizarPerfilMembro(id: number, perfil: string) {
  const admin = await requireAdmin()
  if (!PERFIS.includes(perfil)) throw new Error('Perfil inválido')
  await db
    .update(membro)
    .set({ perfil })
    .where(and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId)))
  revalidatePath('/condominos')
}

export async function aprovarMembro(id: number) {
  const admin = await requireAdmin()
  await db
    .update(membro)
    .set({ estado: 'aprovado' })
    .where(and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId)))
  revalidatePath('/condominos')
}

export async function rejeitarMembro(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(membro)
    .where(and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId)))
  revalidatePath('/condominos')
}

export async function atualizarMembro(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get('id'))
  const nome = String(formData.get('nome') || '').trim()
  const fracaoTxt = String(formData.get('fracao') || '').trim()
  const telefone = String(formData.get('telefone') || '').trim()

  if (!id || !nome) throw new Error('Dados inválidos')

  await db
    .update(membro)
    .set({ nome, fracao: fracaoTxt || null, telefone: telefone || null })
    .where(and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId)))
  revalidatePath('/condominos')
}
