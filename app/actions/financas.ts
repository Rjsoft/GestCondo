'use server'

import { db } from '@/lib/db'
import { movimento } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getMovimentos() {
  // Dados financeiros: admin, gestor, condómino ou auditor — não
  // inquilino nem fornecedor (ver lib/session.ts).
  const m = await requireAcessoFinanceiro()
  return db
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        isNull(movimento.deletedAt),
      ),
    )
    .orderBy(desc(movimento.data))
}

export async function criarMovimento(formData: FormData) {
  const admin = await requireAdmin()

  const tipo = String(formData.get('tipo') || 'despesa')
  const categoria = String(formData.get('categoria') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const valor = String(formData.get('valor') || '0')
  const dataStr = String(formData.get('data') || '')
  const pago = formData.get('pago') === 'on' || formData.get('pago') === 'true'

  if (!categoria || !descricao || !valor) {
    throw new Error('Preencha todos os campos obrigatórios')
  }

  const [novo] = await db
    .insert(movimento)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      tipo,
      categoria,
      descricao,
      valor,
      pago,
      ...(dataStr ? { data: new Date(dataStr) } : {}),
    })
    .returning({ id: movimento.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'movimento',
    entidadeId: novo.id,
    detalhes: `${tipo}: ${categoria} — ${descricao} (${valor} €)`,
  })

  revalidatePath('/financas')
  revalidatePath('/')
}

export async function eliminarMovimento(id: number) {
  const admin = await requireAdmin()
  // Soft-delete: registos financeiros têm obrigação legal de retenção —
  // nunca eliminar fisicamente (ver comentário em lib/db/schema.ts).
  await db
    .update(movimento)
    .set({ deletedAt: new Date() })
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'movimento',
    entidadeId: id,
  })

  revalidatePath('/financas')
  revalidatePath('/')
}

export async function alternarPago(id: number, pago: boolean) {
  const admin = await requireAdmin()
  await db
    .update(movimento)
    .set({ pago })
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'movimento',
    entidadeId: id,
    detalhes: pago ? 'Marcado como pago' : 'Marcado como pendente',
  })

  revalidatePath('/financas')
}
