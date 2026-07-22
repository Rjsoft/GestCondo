'use server'

import { db } from '@/lib/db'
import { fornecedor } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAdmin, requireMembroPagina } from '@/lib/session'
import { and, asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getFornecedores() {
  const m = await requireMembroPagina()
  return db
    .select()
    .from(fornecedor)
    .where(eq(fornecedor.condominioId, m.condominioId))
    .orderBy(asc(fornecedor.nome))
}

export async function criarFornecedor(formData: FormData) {
  const admin = await requireAdmin()

  const nome = String(formData.get('nome') || '').trim()
  const nif = String(formData.get('nif') || '').trim()
  const categoria = String(formData.get('categoria') || '').trim()
  const contactoEmail = String(formData.get('contactoEmail') || '').trim()
  const contactoTelefone = String(formData.get('contactoTelefone') || '').trim()
  const notas = String(formData.get('notas') || '').trim()

  if (!nome) throw new Error('Indique o nome do fornecedor')

  const [novo] = await db
    .insert(fornecedor)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      nome,
      nif: nif || null,
      categoria: categoria || null,
      contactoEmail: contactoEmail || null,
      contactoTelefone: contactoTelefone || null,
      notas: notas || null,
    })
    .returning({ id: fornecedor.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'fornecedor',
    entidadeId: novo.id,
    detalhes: nome,
  })

  revalidatePath('/fornecedores')
}

export async function atualizarFornecedor(formData: FormData) {
  const admin = await requireAdmin()

  const id = Number(formData.get('id'))
  const nome = String(formData.get('nome') || '').trim()
  const nif = String(formData.get('nif') || '').trim()
  const categoria = String(formData.get('categoria') || '').trim()
  const contactoEmail = String(formData.get('contactoEmail') || '').trim()
  const contactoTelefone = String(formData.get('contactoTelefone') || '').trim()
  const notas = String(formData.get('notas') || '').trim()

  if (!nome) throw new Error('Indique o nome do fornecedor')

  await db
    .update(fornecedor)
    .set({
      nome,
      nif: nif || null,
      categoria: categoria || null,
      contactoEmail: contactoEmail || null,
      contactoTelefone: contactoTelefone || null,
      notas: notas || null,
    })
    .where(and(eq(fornecedor.id, id), eq(fornecedor.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'fornecedor',
    entidadeId: id,
    detalhes: nome,
  })

  revalidatePath('/fornecedores')
}

export async function eliminarFornecedor(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(fornecedor)
    .where(and(eq(fornecedor.id, id), eq(fornecedor.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'fornecedor',
    entidadeId: id,
  })

  revalidatePath('/fornecedores')
}
