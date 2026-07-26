'use server'

import { db } from '@/lib/db'
import { condominio, membro } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireOperadorPlataforma } from '@/lib/session'
import type { MembroSessao } from '@/lib/perfis'
import { count, eq } from 'drizzle-orm'
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
