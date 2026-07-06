'use server'

import { db } from '@/lib/db'
import { auditLog } from '@/lib/db/schema'
import { requireConsultaGestao } from '@/lib/session'
import { desc, eq } from 'drizzle-orm'

export async function getAuditLog() {
  // Consulta de gestão: admin, gestor ou auditor — nunca é possível
  // escrever/alterar o registo de auditoria a partir da aplicação.
  const m = await requireConsultaGestao()
  return db
    .select()
    .from(auditLog)
    .where(eq(auditLog.condominioId, m.condominioId))
    .orderBy(desc(auditLog.createdAt))
    .limit(200)
}
