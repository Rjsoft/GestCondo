'use server'

import { db } from '@/lib/db'
import { fracao, membro } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import {
  PERFIS,
  requireAcessoFinanceiro,
  requireAdmin,
  requireConsultaGestao,
  temConsultaGestao,
} from '@/lib/session'
import { and, asc, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getFracoes() {
  // Dados patrimoniais: admin, gestor, condómino ou auditor — não
  // inquilino nem fornecedor (ver lib/session.ts).
  const m = await requireAcessoFinanceiro()
  const linhas = await db
    .select()
    .from(fracao)
    .where(eq(fracao.condominioId, m.condominioId))
    .orderBy(asc(fracao.identificacao))

  // Contactos pessoais (email/telefone do proprietário) só para quem gere
  // o condomínio ou audita — um condómino comum não precisa de ver o
  // contacto pessoal de todos os outros proprietários (SECURITY_AUDIT.md
  // S13 / minimização de dados RGPD). Feito aqui e não com um `select`
  // mais restrito na query para manter o mesmo formato de linha em todos
  // os consumidores (ex. o mapa de saldos); os dados nunca chegam ao
  // cliente de qualquer forma quando o utilizador não tem permissão.
  if (temConsultaGestao(m)) return linhas
  return linhas.map((f) => ({ ...f, contactoEmail: null, contactoTelefone: null }))
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
  const nif = String(formData.get('nif') || '').trim()
  const permilagem = String(formData.get('permilagem') || '0')
  const contactoEmail = String(formData.get('contactoEmail') || '').trim()
  const contactoTelefone = String(formData.get('contactoTelefone') || '').trim()
  const notas = String(formData.get('notas') || '').trim()
  const isentaElevador = formData.get('isentaElevador') === 'on'

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
      nif: nif || null,
      permilagem,
      contactoEmail: contactoEmail || null,
      contactoTelefone: contactoTelefone || null,
      notas: notas || null,
      isentaElevador,
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

export async function alternarIsencaoElevador(id: number, isento: boolean) {
  const admin = await requireAdmin()
  await db
    .update(fracao)
    .set({ isentaElevador: isento })
    .where(and(eq(fracao.id, id), eq(fracao.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'fracao',
    entidadeId: id,
    detalhes: isento ? 'Marcada como isenta de elevador' : 'Deixou de estar isenta de elevador',
  })

  revalidatePath('/fracoes')
  revalidatePath('/financas')
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
  const fracaoIdRaw = String(formData.get('fracaoId') || '').trim()
  const telefone = String(formData.get('telefone') || '').trim()

  if (!id || !nome) throw new Error('Dados inválidos')

  let fracaoId: number | null = null
  if (fracaoIdRaw) {
    // Confirma que a fração pertence ao mesmo condomínio do admin, para
    // nunca se poder ligar um membro a uma fração de outro condomínio.
    const [f] = await db
      .select({ id: fracao.id })
      .from(fracao)
      .where(and(eq(fracao.id, Number(fracaoIdRaw)), eq(fracao.condominioId, admin.condominioId)))
      .limit(1)
    if (!f) throw new Error('Fração inválida')
    fracaoId = f.id
  }

  await db
    .update(membro)
    .set({ nome, fracaoId, telefone: telefone || null })
    .where(and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'membro',
    entidadeId: id,
  })

  revalidatePath('/condominos')
}
