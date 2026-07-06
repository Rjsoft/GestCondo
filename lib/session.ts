import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { membro } from '@/lib/db/schema'
import { count, eq } from 'drizzle-orm'
import { headers } from 'next/headers'

export type Perfil = 'admin' | 'condomino'
export type EstadoMembro = 'pendente' | 'aprovado'

export type MembroSessao = {
  id: number
  userId: string
  nome: string
  email: string
  perfil: Perfil
  estado: EstadoMembro
  fracao: string | null
}

/**
 * Obtém a sessão atual do Better Auth. Retorna null se não autenticado.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

/**
 * Garante que o utilizador autenticado tem um registo de `membro`.
 * O primeiro membro do condomínio é automaticamente administrador; os
 * seguintes são condóminos. Retorna o membro (com o perfil).
 */
export async function getMembroAtual(): Promise<MembroSessao | null> {
  const session = await getSession()
  if (!session?.user) return null

  const { id: userId, name, email } = session.user

  const existente = await db
    .select()
    .from(membro)
    .where(eq(membro.userId, userId))
    .limit(1)

  if (existente.length > 0) {
    const m = existente[0]
    return {
      id: m.id,
      userId: m.userId,
      nome: m.nome,
      email: m.email,
      perfil: (m.perfil as Perfil) ?? 'condomino',
      estado: (m.estado as EstadoMembro) ?? 'aprovado',
      fracao: m.fracao,
    }
  }

  // Primeiro utilizador do sistema = admin, aprovado automaticamente.
  // Os seguintes ficam "pendente" até um administrador os aprovar.
  const [{ total }] = await db.select({ total: count() }).from(membro)
  const perfil: Perfil = total === 0 ? 'admin' : 'condomino'
  const estado: EstadoMembro = total === 0 ? 'aprovado' : 'pendente'

  const [novo] = await db
    .insert(membro)
    .values({
      userId,
      nome: name ?? email,
      email,
      perfil,
      estado,
    })
    .returning({ id: membro.id })

  return {
    id: novo.id,
    userId,
    nome: name ?? email,
    email,
    perfil,
    estado,
    fracao: null,
  }
}

/**
 * Helper para server actions: exige sessão E que a conta já tenha sido
 * aprovada por um administrador. Usar em vez de `getMembroAtual` sempre
 * que a action expõe dados partilhados do condomínio.
 */
export async function requireMembroAprovado(): Promise<MembroSessao> {
  const m = await getMembroAtual()
  if (!m) throw new Error('Não autorizado')
  if (m.estado !== 'aprovado') {
    throw new Error('A sua conta aguarda aprovação de um administrador')
  }
  return m
}

/**
 * Helper para server actions: exige sessão e retorna o userId.
 */
export async function requireUserId(): Promise<string> {
  const session = await getSession()
  if (!session?.user) throw new Error('Não autorizado')
  return session.user.id
}

/**
 * Helper para server actions: exige que o utilizador seja admin.
 */
export async function requireAdmin(): Promise<MembroSessao> {
  const m = await getMembroAtual()
  if (!m) throw new Error('Não autorizado')
  if (m.perfil !== 'admin') throw new Error('Apenas administradores')
  return m
}
