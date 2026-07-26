'use server'

import { db } from '@/lib/db'
import { condominio, membro, user } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireOperadorPlataforma } from '@/lib/session'
import type { MembroSessao } from '@/lib/perfis'
import { count, eq, ilike } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Lista todos os condomínios da plataforma com o respetivo estado de
 * subscrição — só o operador da plataforma (RJCSI) pode ver isto; não
 * exige ser `membro` de nenhum dos condomínios listados.
 */
export async function listarCondominiosPlataforma() {
  await requireOperadorPlataforma()

  const [condominios, contagens] = await Promise.all([
    db.select().from(condominio).orderBy(condominio.nome),
    db
      .select({ condominioId: membro.condominioId, total: count() })
      .from(membro)
      .where(eq(membro.estado, 'aprovado'))
      .groupBy(membro.condominioId),
  ])

  const totalPorCondominio = new Map(contagens.map((c) => [c.condominioId, c.total]))

  return condominios.map((c) => ({
    ...c,
    totalMembros: totalPorCondominio.get(c.id) ?? 0,
  }))
}

/**
 * Suspende ou reativa o acesso de um condomínio — bloqueia (ou desbloqueia)
 * todas as leituras/escritas desse condomínio via requireMembroAprovado/
 * requireAdmin (ver lib/session.ts). A cobrança em si continua manual;
 * isto só corta ou repõe o acesso.
 */
export async function alterarEstadoSubscricao(
  condominioId: number,
  novoEstado: 'ativo' | 'suspenso',
  nota?: string,
) {
  const operador = await requireOperadorPlataforma()

  await db
    .update(condominio)
    .set({
      estadoSubscricao: novoEstado,
      notaSubscricao: nota?.trim() || null,
      subscricaoAtualizadaEm: new Date(),
    })
    .where(eq(condominio.id, condominioId))

  // Ator sintético: o operador da plataforma não é necessariamente membro
  // deste condomínio (mesmo padrão já usado em criarCondominio/entrarComCodigo
  // para escrever no audit_log sem um `membro` real).
  const actor: MembroSessao = {
    id: 0,
    condominioId,
    userId: operador.userId,
    nome: operador.nome,
    email: operador.email,
    perfil: 'admin',
    estado: 'aprovado',
    fracaoId: null,
    isSuperAdmin: false,
    isOperadorPlataforma: true,
    condominioSuspenso: false,
  }

  await registarAuditoria({
    actor,
    acao: 'atualizar',
    entidade: 'condominio',
    entidadeId: condominioId,
    detalhes:
      novoEstado === 'suspenso'
        ? `Subscrição suspensa pelo operador da plataforma${nota ? `: ${nota.trim()}` : ''}`
        : 'Subscrição reativada pelo operador da plataforma',
  })

  revalidatePath('/plataforma')
}

/**
 * Lista todas as contas com acesso à plataforma (`user.operadorPlataforma`)
 * — só leitura/visibilidade, para não ser preciso ir à BD só para saber
 * quem tem acesso.
 */
export async function listarOperadoresPlataforma() {
  await requireOperadorPlataforma()

  return db
    .select({ id: user.id, email: user.email, twoFactorEnabled: user.twoFactorEnabled })
    .from(user)
    .where(eq(user.operadorPlataforma, true))
    .orderBy(user.email)
}

/**
 * Promove uma conta já existente (por email) a operador da plataforma.
 * Nunca cria contas novas nem remove/despromove — remoção continua manual
 * (decisão registada em FUNCTIONAL_GAPS.md: evita o risco de um operador se
 * auto-remover ou remover o último operador restante).
 *
 * Sem entrada em audit_log: essa tabela exige um condominioId (NOT NULL,
 * FK) e esta ação não pertence a nenhum condomínio — forçar um id sem
 * sentido seria mais enganador do que não registar nada. Fica só o log do
 * servidor (visível nos runtime logs da Vercel).
 */
export async function promoverOperadorPlataforma(email: string) {
  const operador = await requireOperadorPlataforma()

  const emailLimpo = email.trim()
  const [alvo] = await db
    .select({ id: user.id, email: user.email, operadorPlataforma: user.operadorPlataforma })
    .from(user)
    .where(ilike(user.email, emailLimpo))
    .limit(1)

  if (!alvo) throw new Error('Não existe nenhuma conta com este email. A pessoa tem de criar conta primeiro.')
  if (alvo.operadorPlataforma) throw new Error('Esta conta já tem acesso à plataforma.')

  await db.update(user).set({ operadorPlataforma: true }).where(eq(user.id, alvo.id))

  console.log(
    `[plataforma] ${operador.email} promoveu ${alvo.email} a operador da plataforma em ${new Date().toISOString()}`,
  )

  revalidatePath('/plataforma')
}
