'use server'

import { db } from '@/lib/db'
import { assembleiaPresenca, assembleiaVoto, membro, movimento, ocorrencia } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { temAcessoFinanceiro } from '@/lib/perfis'
import { requireMembroAprovado } from '@/lib/session'
import { and, eq, isNull } from 'drizzle-orm'
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
 *
 * Atualizado 2026-07-22 (achado RGPD-02 da auditoria jurídica): antes só
 * devolvia o registo `membro` — agora inclui também as ocorrências que o
 * próprio titular reportou, a sua participação em assembleias (presenças/
 * votos da sua fração — visível a qualquer membro aprovado, não é dado
 * financeiro) e, só quando o perfil tem acesso financeiro
 * (`temAcessoFinanceiro`), os movimentos associados à sua fração. Regista
 * em `audit_log` que o pedido de exportação foi feito (achado AUDIT-02).
 */
export async function exportarMeusDados() {
  const m = await requireMembroAprovado()
  const [linha] = await db.select().from(membro).where(eq(membro.id, m.id)).limit(1)
  if (!linha) throw new Error('Dados não encontrados')

  const ocorrenciasReportadas = await db
    .select()
    .from(ocorrencia)
    .where(and(eq(ocorrencia.condominioId, m.condominioId), eq(ocorrencia.userId, m.userId)))

  let movimentosDaFracao: (typeof movimento.$inferSelect)[] = []
  let presencasDaFracao: (typeof assembleiaPresenca.$inferSelect)[] = []
  let votosDaFracao: (typeof assembleiaVoto.$inferSelect)[] = []

  if (linha.fracaoId) {
    presencasDaFracao = await db
      .select()
      .from(assembleiaPresenca)
      .where(eq(assembleiaPresenca.fracaoId, linha.fracaoId))
    votosDaFracao = await db
      .select()
      .from(assembleiaVoto)
      .where(eq(assembleiaVoto.fracaoId, linha.fracaoId))

    if (temAcessoFinanceiro(m)) {
      movimentosDaFracao = await db
        .select()
        .from(movimento)
        .where(
          and(
            eq(movimento.condominioId, m.condominioId),
            eq(movimento.fracaoId, linha.fracaoId),
            isNull(movimento.deletedAt),
          ),
        )
    }
  }

  await registarAuditoria({
    actor: m,
    acao: 'atualizar',
    entidade: 'membro',
    entidadeId: m.id,
    detalhes: 'Exportação de dados pessoais (portabilidade, art. 20º RGPD)',
  })

  return {
    membro: {
      id: linha.id,
      nome: linha.nome,
      email: linha.email,
      telefone: linha.telefone,
      perfil: linha.perfil,
      estado: linha.estado,
      fracaoId: linha.fracaoId,
      condominioId: linha.condominioId,
      criadoEm: linha.createdAt,
    },
    ocorrenciasReportadas,
    presencasEmAssembleias: presencasDaFracao,
    votosEmAssembleias: votosDaFracao,
    movimentosFinanceirosDaFracao: movimentosDaFracao,
  }
}
