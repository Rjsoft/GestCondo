import { db } from '@/lib/db'
import { confirmacaoLeitura, membro } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export type EntidadeConfirmavel = 'aviso' | 'assembleia'

/**
 * Regista a confirmação de leitura de um membro para um aviso/convocatória.
 * Idempotente — confirmar duas vezes não gera erro nem duplica a linha
 * (unique(membroId, entidade, entidadeId), ver lib/db/schema.ts).
 */
export async function confirmarLeitura(params: {
  condominioId: number
  membroId: number
  entidade: EntidadeConfirmavel
  entidadeId: number
}) {
  await db
    .insert(confirmacaoLeitura)
    .values(params)
    .onConflictDoNothing({
      target: [confirmacaoLeitura.membroId, confirmacaoLeitura.entidade, confirmacaoLeitura.entidadeId],
    })
}

export async function jaConfirmouLeitura(
  membroId: number,
  entidade: EntidadeConfirmavel,
  entidadeId: number,
) {
  const [row] = await db
    .select({ id: confirmacaoLeitura.id })
    .from(confirmacaoLeitura)
    .where(
      and(
        eq(confirmacaoLeitura.membroId, membroId),
        eq(confirmacaoLeitura.entidade, entidade),
        eq(confirmacaoLeitura.entidadeId, entidadeId),
      ),
    )
    .limit(1)
  return Boolean(row)
}

/** Lista de quem já confirmou — para a vista de administrador. */
export async function getConfirmacoesLeitura(
  condominioId: number,
  entidade: EntidadeConfirmavel,
  entidadeId: number,
) {
  return db
    .select({
      membroId: confirmacaoLeitura.membroId,
      nome: membro.nome,
      confirmadoEm: confirmacaoLeitura.confirmadoEm,
    })
    .from(confirmacaoLeitura)
    .innerJoin(membro, eq(membro.id, confirmacaoLeitura.membroId))
    .where(
      and(
        eq(confirmacaoLeitura.condominioId, condominioId),
        eq(confirmacaoLeitura.entidade, entidade),
        eq(confirmacaoLeitura.entidadeId, entidadeId),
      ),
    )
    .orderBy(confirmacaoLeitura.confirmadoEm)
}
