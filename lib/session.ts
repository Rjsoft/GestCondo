import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { condominio, membro, user } from '@/lib/db/schema'
import { asc, eq, sql } from 'drizzle-orm'
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

  const [existente, [userRow]] = await Promise.all([
    db
      .select()
      .from(membro)
      .where(eq(membro.userId, userId))
      .orderBy(asc(membro.id))
      .limit(1),
    db.select({ superAdmin: user.superAdmin }).from(user).where(eq(user.id, userId)).limit(1),
  ])
  const isSuperAdmin = userRow?.superAdmin ?? false

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
      fracaoId: m.fracaoId,
      isSuperAdmin,
    }
  }

  // Bootstrap: ainda não existe nenhuma linha `membro` para este userId.
  // "Ver se já existe um condomínio, senão criar o primeiro" é um
  // check-then-act — sem serialização, dois pedidos em paralelo (ex. duas
  // abas a completar o primeiro login em simultâneo) podiam cada um deixar
  // de ver o condomínio do outro e criar dois condomínios "primeiros"
  // distintos. Um lock consultivo do Postgres (válido só dentro desta
  // transação) serializa esta secção crítica entre pedidos concorrentes.
  const novoMembro = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(72110)`)

    const [existenteDentroDoLock] = await tx
      .select()
      .from(membro)
      .where(eq(membro.userId, userId))
      .orderBy(asc(membro.id))
      .limit(1)
    if (existenteDentroDoLock) return existenteDentroDoLock

    const [condominioExistente] = await tx
      .select({ id: condominio.id })
      .from(condominio)
      .orderBy(asc(condominio.id))
      .limit(1)

    const condominioId = condominioExistente
      ? condominioExistente.id
      : (
          await tx
            .insert(condominio)
            .values({ nome: 'Condomínio' })
            .returning({ id: condominio.id })
        )[0].id
    // Primeiro condomínio do sistema = o seu criador fica admin, aprovado
    // automaticamente; utilizadores seguintes juntam-se a um condomínio já
    // existente como condómino pendente até um admin aprovar.
    const perfil: Perfil = condominioExistente ? 'condomino' : 'admin'
    const estado: EstadoMembro = condominioExistente ? 'pendente' : 'aprovado'

    const [inserido] = await tx
      .insert(membro)
      .values({ condominioId, userId, nome: name ?? email, email, perfil, estado })
      .returning()

    return inserido
  })

  return {
    id: novoMembro.id,
    condominioId: novoMembro.condominioId,
    userId: novoMembro.userId,
    nome: novoMembro.nome,
    email: novoMembro.email,
    perfil: (novoMembro.perfil as Perfil) ?? 'condomino',
    estado: (novoMembro.estado as EstadoMembro) ?? 'aprovado',
    fracaoId: novoMembro.fracaoId,
    isSuperAdmin,
  }
}

/**
 * Helper para páginas (Server Components): garante uma sessão válida,
 * redirecionando para /sign-in em vez de rebentar. Usar sempre no topo de
 * uma página em vez de `(await getMembroAtual())!` — essa asserção não-nula
 * está errada: `getMembroAtual()` pode legitimamente devolver `null` (ex.
 * sessão expirou entre o pedido do layout e o da própria página), e sem
 * este guard a página rebenta com "Cannot read properties of null" em vez
 * de simplesmente reenviar para o login.
 */
export async function requireMembroPagina(): Promise<MembroSessao> {
  const m = await getMembroAtual()
  if (!m) redirect('/sign-in')
  return m
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
