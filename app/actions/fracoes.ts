'use server'

import { db } from '@/lib/db'
import { fracao, membro } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import {
  PERFIS,
  requireAcessoFinanceiro,
  requireAdmin,
  requireConsultaGestao,
} from '@/lib/session'
import { and, asc, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getFracoes() {
  // Dados patrimoniais: admin, gestor, condómino ou auditor — não
  // inquilino nem fornecedor (ver lib/session.ts).
  const m = await requireAcessoFinanceiro()
  return db
    .select()
    .from(fracao)
    .where(eq(fracao.condominioId, m.condominioId))
    .orderBy(asc(fracao.identificacao))
}

export async function getFracaoPorId(id: number) {
  const m = await requireAcessoFinanceiro()
  const [f] = await db
    .select()
    .from(fracao)
    .where(and(eq(fracao.id, id), eq(fracao.condominioId, m.condominioId)))
    .limit(1)
  return f ?? null
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

  const [nova] = await db
    .insert(fracao)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      identificacao,
      proprietario,
      permilagem,
      contactoEmail: contactoEmail || null,
      contactoTelefone: contactoTelefone || null,
      notas: notas || null,
    })
    .returning({ id: fracao.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'fracao',
    entidadeId: nova.id,
    detalhes: `${identificacao} — ${proprietario}`,
  })

  revalidatePath('/fracoes')
  revalidatePath('/')
}

export async function eliminarFracao(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(fracao)
    .where(and(eq(fracao.id, id), eq(fracao.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'fracao',
    entidadeId: id,
  })

  revalidatePath('/fracoes')
  revalidatePath('/')
}

// --- Membros / condóminos --------------------------------------------------

export async function getMembros() {
  // Consulta de gestão: admin, gestor ou auditor.
  const m = await requireConsultaGestao()
  return db
    .select()
    .from(membro)
    .where(eq(membro.condominioId, m.condominioId))
    .orderBy(desc(membro.createdAt))
}

export async function atualizarPerfilMembro(id: number, perfil: string) {
  const admin = await requireAdmin()
  if (!PERFIS.includes(perfil as (typeof PERFIS)[number])) {
    throw new Error('Perfil inválido')
  }
  await db
    .update(membro)
    .set({ perfil })
    .where(and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'membro',
    entidadeId: id,
    detalhes: `Perfil alterado para "${perfil}"`,
  })

  revalidatePath('/condominos')
}

export async function aprovarMembro(id: number) {
  const admin = await requireAdmin()
  await db
    .update(membro)
    .set({ estado: 'aprovado' })
    .where(and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'aprovar',
    entidade: 'membro',
    entidadeId: id,
  })

  revalidatePath('/condominos')
}

export async function rejeitarMembro(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(membro)
    .where(and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'rejeitar',
    entidade: 'membro',
    entidadeId: id,
  })

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

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'membro',
    entidadeId: id,
  })

  revalidatePath('/condominos')
}
