import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { condominio, membro } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'

export type Perfil = 'admin' | 'condomino'
export type EstadoMembro = 'pendente' | 'aprovado'

export type MembroSessao = {
  id: number
  condominioId: number
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
 * Garante que o utilizador autenticado tem um registo de `membro` num
 * condomínio. Cada `membro` pertence a exactamente um `condominio`
 * (`membro.condominioId`) — ver lib/db/schema.ts para o modelo multi-tenant.
 *
 * IMPORTANTE: ainda não existe nenhum fluxo de convite/criação de um segundo
 * condomínio. Esta função só sabe: (a) criar o primeiro condomínio e tornar
 * o primeiro utilizador admin+aprovado, ou (b) juntar qualquer utilizador
 * novo seguinte ao único condomínio já existente, como condómino pendente.
 * Antes de suportar mais do que um condomínio por instância, é necessário
 * construir esse fluxo (ver FUNCTIONAL_GAPS.md) — o modelo de dados e o
 * isolamento por `condominioId` já estão prontos para isso.
 */
export async function getMembroAtual(): Promise<MembroSessao | null> {
  const session = await getSession()
  if (!session?.user) return null

  const { id: userId, name, email } = session.user

  const existente = await db
    .select()
    .from(membro)
    .where(eq(membro.userId, userId))
    .orderBy(asc(membro.id))
    .limit(1)

  if (existente.length > 0) {
    const m = existente[0]
    return {
      id: m.id,
      condominioId: m.condominioId,
      userId: m.userId,
      nome: m.nome,
      email: m.email,
      perfil: (m.perfil as Perfil) ?? 'condomino',
      estado: (m.estado as EstadoMembro) ?? 'aprovado',
      fracao: m.fracao,
    }
  }

  const [condominioExistente] = await db
    .select({ id: condominio.id })
    .from(condominio)
    .orderBy(asc(condominio.id))
    .limit(1)

  let condominioId: number
  let perfil: Perfil
  let estado: EstadoMembro

  if (!condominioExistente) {
    // Primeiro utilizador do sistema: cria o condomínio e fica admin,
    // aprovado automaticamente.
    const [novoCondominio] = await db
      .insert(condominio)
      .values({ nome: 'Condomínio' })
      .returning({ id: condominio.id })
    condominioId = novoCondominio.id
    perfil = 'admin'
    estado = 'aprovado'
  } else {
    // Utilizadores seguintes juntam-se ao (único) condomínio existente,
    // como condómino pendente até um admin aprovar.
    condominioId = condominioExistente.id
    perfil = 'condomino'
    estado = 'pendente'
  }

  const [novo] = await db
    .insert(membro)
    .values({
      condominioId,
      userId,
      nome: name ?? email,
      email,
      perfil,
      estado,
    })
    .returning({ id: membro.id })

  return {
    id: novo.id,
    condominioId,
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

/**
 * Dados do condomínio do membro atual (nome, morada, NIF). Útil para exibir
 * a identidade do condomínio na UI (ex. cabeçalho da app).
 */
export async function getCondominioAtual(condominioId: number) {
  const [c] = await db
    .select()
    .from(condominio)
    .where(eq(condominio.id, condominioId))
    .limit(1)
  return c ?? null
}
