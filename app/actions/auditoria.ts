'use server'

import { db } from '@/lib/db'
import { auditLog } from '@/lib/db/schema'
import { requireConsultaGestao } from '@/lib/session'
import { and, count, desc, eq, gte, lte, or, sql } from 'drizzle-orm'

const PAGE_SIZE = 30

export async function getAuditLog({
  page = 1,
  search = '',
  dataInicio,
  dataFim,
}: {
  page?: number
  search?: string
  /** Filtra por `createdAt >= dataInicio` (início do dia, inclusivo). */
  dataInicio?: Date
  /** Filtra por `createdAt <= dataFim` (fim do dia, inclusivo). */
  dataFim?: Date
} = {}) {
  // Consulta de gestão: admin, gestor ou auditor — nunca é possível
  // escrever/alterar o registo de auditoria a partir da aplicação.
  const m = await requireConsultaGestao()
  const condicao = and(
    eq(auditLog.condominioId, m.condominioId),
    search
      ? or(
          sql`unaccent(${auditLog.actorNome}) ilike unaccent(${`%${search}%`})`,
          sql`unaccent(${auditLog.detalhes}) ilike unaccent(${`%${search}%`})`,
        )
      : undefined,
    dataInicio ? gte(auditLog.createdAt, dataInicio) : undefined,
    dataFim ? lte(auditLog.createdAt, dataFim) : undefined,
  )

  const [registos, [{ total }]] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(condicao)
      .orderBy(desc(auditLog.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(auditLog).where(condicao),
  ])

  return { registos, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}
