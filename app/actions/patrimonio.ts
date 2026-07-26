'use server'

import { db } from '@/lib/db'
import { patrimonio } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAdmin, requireConsultaGestao } from '@/lib/session'
import { and, asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/** Informação de gestão — visível a admin/gestor/auditor, não a condóminos comuns. */
export async function getPatrimonio() {
  const m = await requireConsultaGestao()
  return db
    .select()
    .from(patrimonio)
    .where(eq(patrimonio.condominioId, m.condominioId))
    .orderBy(asc(patrimonio.nome))
}

export async function criarPatrimonio(formData: FormData) {
  const admin = await requireAdmin()

  const nome = String(formData.get('nome') || '').trim()
  const categoria = String(formData.get('categoria') || '').trim()
  const dataAquisicaoTexto = String(formData.get('dataAquisicao') || '').trim()
  const valorAquisicaoTexto = String(formData.get('valorAquisicao') || '').trim()
  const valorAtualTexto = String(formData.get('valorAtual') || '').trim()
  const notas = String(formData.get('notas') || '').trim()

  if (!nome) throw new Error('Indique o nome do bem')

  const [novo] = await db
    .insert(patrimonio)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      nome,
      categoria: categoria || null,
      dataAquisicao: dataAquisicaoTexto ? new Date(dataAquisicaoTexto) : null,
      valorAquisicao: valorAquisicaoTexto || null,
      valorAtual: valorAtualTexto || null,
      notas: notas || null,
    })
    .returning({ id: patrimonio.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'patrimonio',
    entidadeId: novo.id,
    detalhes: nome,
  })

  revalidatePath('/condominio')
}

export async function eliminarPatrimonio(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(patrimonio)
    .where(and(eq(patrimonio.id, id), eq(patrimonio.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'patrimonio',
    entidadeId: id,
  })

  revalidatePath('/condominio')
}
