'use server'

import { db } from '@/lib/db'
import { seguro } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const TIPOS = ['multirriscos', 'incendio', 'outro']

export async function getSeguros() {
  const m = await requireAcessoFinanceiro()
  return db
    .select()
    .from(seguro)
    .where(eq(seguro.condominioId, m.condominioId))
    .orderBy(desc(seguro.dataFim))
}

export async function criarSeguro(formData: FormData) {
  const admin = await requireAdmin()

  const seguradora = String(formData.get('seguradora') || '').trim()
  const apolice = String(formData.get('apolice') || '').trim()
  const tipo = String(formData.get('tipo') || 'multirriscos')
  const dataInicioStr = String(formData.get('dataInicio') || '')
  const dataFimStr = String(formData.get('dataFim') || '')
  const valorPremioStr = String(formData.get('valorPremio') || '').trim()
  const notas = String(formData.get('notas') || '').trim()

  if (!seguradora || !apolice || !dataInicioStr || !dataFimStr) {
    throw new Error('Preencha a seguradora, a apólice e as datas de início e fim')
  }
  if (!TIPOS.includes(tipo)) throw new Error('Tipo de seguro inválido')

  const dataInicio = new Date(dataInicioStr)
  const dataFim = new Date(dataFimStr)
  if (Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataFim.getTime())) {
    throw new Error('Datas inválidas')
  }
  if (dataFim <= dataInicio) {
    throw new Error('A data de fim tem de ser posterior à data de início')
  }

  const [novo] = await db
    .insert(seguro)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      seguradora,
      apolice,
      tipo,
      dataInicio,
      dataFim,
      valorPremio: valorPremioStr || null,
      notas: notas || null,
    })
    .returning({ id: seguro.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'seguro',
    entidadeId: novo.id,
    detalhes: `${seguradora} — apólice ${apolice}`,
  })

  revalidatePath('/financas')
}

export async function eliminarSeguro(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(seguro)
    .where(and(eq(seguro.id, id), eq(seguro.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'seguro',
    entidadeId: id,
  })

  revalidatePath('/financas')
}
