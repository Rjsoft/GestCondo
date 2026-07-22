import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { condominio, membro, user } from '@/lib/db/schema'
import { asc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  type EstadoMembro,
  type MembroSessao,
  type Perfil,
  podeEscrever,
  temAcessoFinanceiro,
  temConsultaGestao,
  temPermissaoGestao,
} from '@/lib/perfis'

// Reexportado para não obrigar a mudar todos os imports existentes de
// `@/lib/session` — mas CÓDIGO CLIENTE (componentes 'use client') deve
// importar estes tipos/valores diretamente de `@/lib/perfis`, nunca daqui:
// este ficheiro importa `@/lib/db` (Node/`pg`), que não pode ir para o
// bundle do browser.
export {
  PERFIL_LABEL,
  PERFIS,
  PERFIS_ACESSO_FINANCEIRO,
  PERFIS_CONSULTA_GESTAO,
  PERFIS_GESTAO,
  podeEscrever,
  temAcessoFinanceiro,
  temConsultaGestao,
  temPermissaoGestao,
  type EstadoMembro,
  type MembroSessao,
  type Perfil,
} from '@/lib/perfis'

/**
 * Obtém a sessão atual do Better Auth. Retorna null se não autenticado.
 */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

/**
 * Devolve o `membro` do utilizador autenticado, se já tiver feito
 * onboarding. Cada `membro` pertence a exatamente um `condominio`
 * (`membro.condominioId`) — ver lib/db/schema.ts para o modelo multi-tenant.
 *
 * Devolve `null` em dois casos distintos que os chamadores tratam de forma
 * diferente: (a) sem sessão válida, ou (b) sessão válida mas ainda sem
 * `membro` — este segundo caso significa que o utilizador tem de passar
 * por `/onboarding` (entrar com código de convite ou criar um condomínio
 * novo, ver app/actions/condominio.ts) antes de aceder à aplicação. Esta
 * função nunca cria um `membro` sozinha — ao contrário do comportamento
 * antigo, que juntava automaticamente qualquer conta nova ao primeiro
 * condomínio existente.
 */
export async function getMembroAtual(): Promise<MembroSessao | null> {
  const session = await getSession()
  if (!session?.user) return null

  const { id: userId } = session.user

  const [[existente], [userRow]] = await Promise.all([
    db.select().from(membro).where(eq(membro.userId, userId)).orderBy(asc(membro.id)).limit(1),
    db.select({ superAdmin: user.superAdmin }).from(user).where(eq(user.id, userId)).limit(1),
  ])
  const isSuperAdmin = userRow?.superAdmin ?? false

  if (!existente) return null

  return {
    id: existente.id,
    condominioId: existente.condominioId,
    userId: existente.userId,
    nome: existente.nome,
    email: existente.email,
    perfil: (existente.perfil as Perfil) ?? 'condomino',
    estado: (existente.estado as EstadoMembro) ?? 'aprovado',
    fracaoId: existente.fracaoId,
    isSuperAdmin,
  }
}

/**
 * Helper para páginas (Server Components): garante uma sessão válida,
 * redirecionando para /sign-in em vez de rebentar. Usar sempre no topo de
 * uma página em vez de `(await getMembroAtual())!` — essa asserção não-nula
 * está errada: `getMembroAtual()` pode legitimamente devolver `null` por
 * dois motivos (sessão inválida, ou sessão válida sem `membro` ainda), e
 * sem este guard a página rebenta com "Cannot read properties of null" em
 * vez de simplesmente reenviar para o sítio certo.
 */
export async function requireMembroPagina(): Promise<MembroSessao> {
  const m = await getMembroAtual()
  if (m) return m
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')
  redirect('/onboarding')
}

/**
 * Helper para server actions: exige sessão E que a conta já tenha sido
 * aprovada por um administrador. Usar em vez de `getMembroAtual` sempre
 * que a action expõe dados partilhados do condomínio. Super admins nunca
 * ficam bloqueados por aprovação pendente.
 */
export async function requireMembroAprovado(): Promise<MembroSessao> {
  const m = await getMembroAtual()
  if (!m) throw new Error('Não autorizado')
  if (m.estado !== 'aprovado' && !m.isSuperAdmin) {
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
 * Helper para server actions: exige poderes de administração do
 * condomínio (perfil "admin" ou "gestor", ou super admin). Usar para
 * qualquer escrita em dados partilhados do condomínio.
 */
export async function requireAdmin(): Promise<MembroSessao> {
  const m = await getMembroAtual()
  if (!m) throw new Error('Não autorizado')
  if (!temPermissaoGestao(m)) throw new Error('Apenas administradores')
  return m
}

/**
 * Helper para server actions: exige acesso de consulta de gestão (admin,
 * gestor ou auditor). Usar para leituras administrativas (ex. lista de
 * condóminos) que não devem ficar visíveis a condóminos/inquilinos comuns,
 * mas que um auditor tem de poder consultar.
 */
export async function requireConsultaGestao(): Promise<MembroSessao> {
  const m = await requireMembroAprovado()
  if (!temConsultaGestao(m)) throw new Error('Sem permissão para consultar')
  return m
}

/**
 * Helper para server actions: exige acesso a dados financeiros/patrimoniais
 * (admin, gestor, condómino ou auditor — não inquilino nem fornecedor).
 */
export async function requireAcessoFinanceiro(): Promise<MembroSessao> {
  const m = await requireMembroAprovado()
  if (!temAcessoFinanceiro(m)) throw new Error('Sem permissão para consultar')
  return m
}

/**
 * Helper para server actions: exige uma conta aprovada com poder de
 * escrita (todos os perfis exceto "auditor", que é só consulta).
 */
export async function requireMembroComEscrita(): Promise<MembroSessao> {
  const m = await requireMembroAprovado()
  if (!podeEscrever(m)) {
    throw new Error('Auditores têm acesso apenas de consulta')
  }
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
