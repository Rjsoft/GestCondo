'use server'

import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { condominio, membro } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAdmin, getSession } from '@/lib/session'
import type { MembroSessao } from '@/lib/perfis'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Sem 0/O/1/I — evita confusão ao ler/escrever o código à mão.
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function gerarCodigoConvite() {
  const bytes = randomBytes(8)
  let codigo = ''
  for (let i = 0; i < 8; i++) {
    codigo += ALFABETO_CODIGO[bytes[i] % ALFABETO_CODIGO.length]
  }
  return codigo
}

export async function atualizarCondominio(formData: FormData) {
  const admin = await requireAdmin()

  const nome = String(formData.get('nome') || '').trim()
  const morada = String(formData.get('morada') || '').trim()
  const nif = String(formData.get('nif') || '').trim()

  if (!nome) {
    throw new Error('Preencha o nome do condomínio')
  }

  await db
    .update(condominio)
    .set({ nome, morada: morada || null, nif: nif || null })
    .where(eq(condominio.id, admin.condominioId))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'condominio',
    entidadeId: admin.condominioId,
    detalhes: 'Dados do condomínio atualizados (nome/morada/NIF)',
  })

  revalidatePath('/condominio')
  revalidatePath('/')
  revalidatePath('/os-meus-dados')
}

/**
 * Gera (ou substitui) o código de convite do condomínio. Só o admin pode
 * gerar — regenerar invalida imediatamente o código anterior.
 */
export async function regenerarCodigoConvite() {
  const admin = await requireAdmin()

  const codigo = gerarCodigoConvite()
  await db.update(condominio).set({ codigoConvite: codigo }).where(eq(condominio.id, admin.condominioId))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'condominio',
    entidadeId: admin.condominioId,
    detalhes: 'Código de convite regenerado',
  })

  revalidatePath('/condominio')
  return codigo
}

/**
 * Onboarding (parte 1 de 2, ver app/onboarding): cria um condomínio novo
 * para uma conta autenticada que ainda não tem `membro` nenhum. O criador
 * fica admin, aprovado automaticamente — como acontecia com o "primeiro
 * condomínio do sistema" no comportamento antigo, mas agora disponível a
 * qualquer conta nova, não só à literal primeira alguma vez criada.
 */
export async function criarCondominio(formData: FormData) {
  const session = await getSession()
  if (!session?.user) throw new Error('Não autorizado')

  const [existente] = await db.select().from(membro).where(eq(membro.userId, session.user.id)).limit(1)
  if (existente) {
    throw new Error('A sua conta já está associada a um condomínio')
  }

  const nome = String(formData.get('nome') || '').trim()
  if (!nome) {
    throw new Error('Preencha o nome do condomínio')
  }

  const novoMembro = await db.transaction(async (tx) => {
    const [c] = await tx
      .insert(condominio)
      .values({ nome, codigoConvite: gerarCodigoConvite() })
      .returning({ id: condominio.id })

    const [m] = await tx
      .insert(membro)
      .values({
        condominioId: c.id,
        userId: session.user.id,
        nome: session.user.name || session.user.email,
        email: session.user.email,
        perfil: 'admin',
        estado: 'aprovado',
      })
      .returning()

    return m
  })

  const actor: MembroSessao = {
    id: novoMembro.id,
    condominioId: novoMembro.condominioId,
    userId: novoMembro.userId,
    nome: novoMembro.nome,
    email: novoMembro.email,
    perfil: 'admin',
    estado: 'aprovado',
    fracaoId: novoMembro.fracaoId,
    isSuperAdmin: false,
  }
  await registarAuditoria({
    actor,
    acao: 'criar',
    entidade: 'condominio',
    entidadeId: novoMembro.condominioId,
    detalhes: 'Condomínio criado via onboarding',
  })

  revalidatePath('/')
}

/**
 * Onboarding (parte 2 de 2): junta uma conta autenticada, sem `membro`
 * ainda, ao condomínio dono do código de convite indicado. Continua
 * "pendente" tal como qualquer registo novo — o código só decide a que
 * condomínio se junta, não o nível de acesso.
 */
export async function entrarComCodigo(formData: FormData) {
  const session = await getSession()
  if (!session?.user) throw new Error('Não autorizado')

  const [existente] = await db.select().from(membro).where(eq(membro.userId, session.user.id)).limit(1)
  if (existente) {
    throw new Error('A sua conta já está associada a um condomínio')
  }

  const codigo = String(formData.get('codigo') || '').trim().toUpperCase()
  if (!codigo) {
    throw new Error('Introduza o código de convite')
  }

  const [c] = await db.select().from(condominio).where(eq(condominio.codigoConvite, codigo)).limit(1)
  if (!c) {
    throw new Error('Código de convite inválido')
  }

  const [novoMembro] = await db
    .insert(membro)
    .values({
      condominioId: c.id,
      userId: session.user.id,
      nome: session.user.name || session.user.email,
      email: session.user.email,
      perfil: 'condomino',
      estado: 'pendente',
    })
    .returning()

  await registarAuditoria({
    actor: {
      id: novoMembro.id,
      condominioId: novoMembro.condominioId,
      userId: novoMembro.userId,
      nome: novoMembro.nome,
      email: novoMembro.email,
      perfil: 'condomino',
      estado: 'pendente',
      fracaoId: novoMembro.fracaoId,
      isSuperAdmin: false,
    },
    acao: 'criar',
    entidade: 'membro',
    entidadeId: novoMembro.id,
    detalhes: 'Registo via código de convite',
  })

  revalidatePath('/')
}
