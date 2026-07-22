'use server'

import { db } from '@/lib/db'
import { condominio } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAdmin } from '@/lib/session'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function atualizarCondominio(formData: FormData) {
  const admin = await requireAdmin()

  const nome = String(formData.get('nome') || '').trim()
  const morada = String(formData.get('morada') || '').trim()
  const nif = String(formData.get('nif') || '').trim()

  if (!nome) {
    throw new Error('Preencha o nome do condomínio')
  }

  await db
    .update(condominio)
    .set({ nome, morada: morada || null, nif: nif || null })
    .where(eq(condominio.id, admin.condominioId))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'condominio',
    entidadeId: admin.condominioId,
    detalhes: 'Dados do condomínio atualizados (nome/morada/NIF)',
  })

  revalidatePath('/condominio')
  revalidatePath('/')
  revalidatePath('/os-meus-dados')
}
