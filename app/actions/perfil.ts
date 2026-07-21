'use server'

import { db } from '@/lib/db'
import { membro } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireMembroAprovado } from '@/lib/session'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Dados do próprio membro autenticado — nunca aceita um `id` vindo do
 * cliente, ao contrário de `getMembros`/`atualizarMembro` em
 * `app/actions/fracoes.ts`, que são para uso do admin sobre terceiros.
 */
export async function getMeuPerfil() {
  const m = await requireMembroAprovado()
  const [linha] = await db.select().from(membro).where(eq(membro.id, m.id)).limit(1)
  return linha ?? null
}

/**
 * Autoedição de dados pessoais (RGPD, direito de retificação). Só permite
 * corrigir nome/telefone — perfil e fração continuam só editáveis por um
 * admin (`atualizarMembro`), e o email só muda pelo próprio fluxo do
 * better-auth, não por aqui.
 */
export async function atualizarMeuPerfil(formData: FormData) {
  const m = await requireMembroAprovado()

  const nome = String(formData.get('nome') || '').trim()
  const telefone = String(formData.get('telefone') || '').trim()

  if (!nome) throw new Error('Preencha o nome')

  await db
    .update(membro)
    .set({ nome, telefone: telefone || null })
    .where(eq(membro.id, m.id))

  await registarAuditoria({
    actor: m,
    acao: 'atualizar',
    entidade: 'membro',
    entidadeId: m.id,
    detalhes: 'Autoedição de dados pessoais',
  })

  revalidatePath('/os-meus-dados')
}

/**
 * Dados próprios em formato simples para exportação (portabilidade,
 * art. 20º RGPD). O cliente transforma isto num ficheiro para download —
 * sem rota de API nova.
 */
export async function exportarMeusDados() {
  const m = await requireMembroAprovado()
  const [linha] = await db.select().from(membro).where(eq(membro.id, m.id)).limit(1)
  if (!linha) throw new Error('Dados não encontrados')

  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    telefone: linha.telefone,
    perfil: linha.perfil,
    estado: linha.estado,
    fracaoId: linha.fracaoId,
    condominioId: linha.condominioId,
    criadoEm: linha.createdAt,
  }
}
