import { db } from '@/lib/db'
import { auditLog, membro, user } from '@/lib/db/schema'
import type { MembroSessao } from '@/lib/perfis'
import { eq } from 'drizzle-orm'

export type AcaoAuditoria =
  | 'criar'
  | 'atualizar'
  | 'eliminar'
  | 'aprovar'
  | 'rejeitar'
  | 'login'
  | 'login_falhado'
  | 'pedido_reset_password'

export type EntidadeAuditoria =
  | 'movimento'
  | 'aviso'
  | 'documento'
  | 'fracao'
  | 'membro'
  | 'ocorrencia'
  | 'orcamento'
  | 'seguro'
  | 'assembleia'
  | 'extratoBancario'
  | 'condominio'
  | 'fornecedor'
  | 'exercicioFinanceiro'
  | 'contaFinanceira'

/**
 * Escreve uma linha no registo de auditoria. Chamar depois de a operação na
 * BD ter sido concluída com sucesso, nunca antes. Nunca lança — uma falha a
 * registar auditoria não deve impedir a operação principal de ter sucesso,
 * mas é reportada na consola do servidor para não passar despercebida.
 */
export async function registarAuditoria(params: {
  actor: MembroSessao
  acao: AcaoAuditoria
  entidade: EntidadeAuditoria
  entidadeId: number
  detalhes?: string
}) {
  const { actor, acao, entidade, entidadeId, detalhes } = params
  try {
    await db.insert(auditLog).values({
      condominioId: actor.condominioId,
      actorUserId: actor.userId,
      actorNome: actor.nome,
      acao,
      entidade,
      entidadeId,
      detalhes,
    })
  } catch (e) {
    console.error('[audit] Falha ao registar auditoria:', e)
  }
}

const DETALHES_AUTENTICACAO: Record<'login' | 'login_falhado' | 'pedido_reset_password', string> = {
  login: 'Sessão iniciada',
  login_falhado: 'Tentativa de login com credenciais inválidas',
  pedido_reset_password: 'Pedido de reposição de palavra-passe',
}

/**
 * Regista login, falha de login ou pedido de reposição de password
 * (achado AUDIT-01 da auditoria jurídica — hoje só nos logs efémeros da
 * Vercel, sem retenção pesquisável). Chamado a partir do hook `after` do
 * better-auth (lib/auth.ts), fora do fluxo de uma sessão autenticada — por
 * isso recebe `userId` (login com sucesso, já sabemos quem é) OU `email`
 * (login falhado/pedido de reset, só temos o que foi escrito no
 * formulário), nunca um `MembroSessao` já resolvido.
 *
 * `audit_log.condominioId` é obrigatório (é um registo por condomínio,
 * não por conta) — por isso só é possível registar quando a conta já tem
 * pelo menos um `membro` associado a um condomínio. Tentativas contra um
 * email que não corresponde a nenhuma conta real não ficam registadas:
 * não há condomínio a que atribuir o evento, e não há nenhum acesso real
 * em risco (decisão deliberada, não uma omissão).
 */
export async function registarEventoAutenticacao(
  acao: 'login' | 'login_falhado' | 'pedido_reset_password',
  identificacao: { userId: string } | { email: string },
) {
  try {
    const linhas =
      'userId' in identificacao
        ? await db.select().from(membro).where(eq(membro.userId, identificacao.userId))
        : (
            await db
              .select({ membro })
              .from(membro)
              .innerJoin(user, eq(membro.userId, user.id))
              .where(eq(user.email, identificacao.email))
          ).map((linha) => linha.membro)

    for (const m of linhas) {
      await registarAuditoria({
        actor: {
          id: m.id,
          condominioId: m.condominioId,
          userId: m.userId,
          nome: m.nome,
          email: m.email,
          perfil: m.perfil as MembroSessao['perfil'],
          estado: m.estado as MembroSessao['estado'],
          fracaoId: m.fracaoId,
          isSuperAdmin: false,
        },
        acao,
        entidade: 'membro',
        entidadeId: m.id,
        detalhes: DETALHES_AUTENTICACAO[acao],
      })
    }
  } catch (e) {
    console.error('[audit] Falha ao registar evento de autenticação:', e)
  }
}
