'use server'

import { db } from '@/lib/db'
import { orcamento } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getOrcamentos() {
  const m = await requireAcessoFinanceiro()
  return db
    .select()
    .from(orcamento)
    .where(eq(orcamento.condominioId, m.condominioId))
    .orderBy(desc(orcamento.ano))
}

export async function criarOrcamento(formData: FormData) {
  const admin = await requireAdmin()

  const ano = Number(formData.get('ano'))
  const valorAnual = String(formData.get('valorAnual') || '0')
  const notas = String(formData.get('notas') || '').trim()

  if (!ano || !Number.isInteger(ano) || ano < 2000 || ano > 2200) {
    throw new Error('Indique um ano válido')
  }
  if (!valorAnual || Number.isNaN(Number(valorAnual)) || Number(valorAnual) <= 0) {
    throw new Error('Indique um valor anual válido')
  }

  const [novo] = await db
    .insert(orcamento)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      ano,
      valorAnual,
      notas: notas || null,
    })
    .returning({ id: orcamento.id })
    .onConflictDoUpdate({
      target: [orcamento.condominioId, orcamento.ano],
      set: { valorAnual, notas: notas || null },
    })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'orcamento',
    entidadeId: novo.id,
    detalhes: `Ano ${ano}: ${valorAnual} €`,
  })

  revalidatePath('/financas')
}

export async function eliminarOrcamento(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(orcamento)
    .where(and(eq(orcamento.id, id), eq(orcamento.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'orcamento',
    entidadeId: id,
  })

  revalidatePath('/financas')
}
