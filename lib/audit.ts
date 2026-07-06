import { db } from '@/lib/db'
import { auditLog } from '@/lib/db/schema'
import type { MembroSessao } from '@/lib/perfis'

export type AcaoAuditoria =
  | 'criar'
  | 'atualizar'
  | 'eliminar'
  | 'aprovar'
  | 'rejeitar'

export type EntidadeAuditoria =
  | 'movimento'
  | 'aviso'
  | 'documento'
  | 'fracao'
  | 'membro'
  | 'ocorrencia'

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
