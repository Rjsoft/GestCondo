'use server'

import { db } from '@/lib/db'
import { auditLog } from '@/lib/db/schema'
import { requireConsultaGestao } from '@/lib/session'
import { and, count, desc, eq, ilike, or } from 'drizzle-orm'

const PAGE_SIZE = 30

export async function getAuditLog({ page = 1, search = '' }: { page?: number; search?: string } = {}) {
  // Consulta de gestão: admin, gestor ou auditor — nunca é possível
  // escrever/alterar o registo de auditoria a partir da aplicação.
  const m = await requireConsultaGestao()
  const condicao = search
    ? and(
        eq(auditLog.condominioId, m.condominioId),
        or(ilike(auditLog.actorNome, `%${search}%`), ilike(auditLog.detalhes, `%${search}%`)),
      )
    : eq(auditLog.condominioId, m.condominioId)

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
