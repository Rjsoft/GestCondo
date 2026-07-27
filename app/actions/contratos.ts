'use server'

import { db } from '@/lib/db'
import { contrato, fornecedor } from '@/lib/db/schema'
import { compararCampos, gerarResumoAlteracoes, registarAuditoria } from '@/lib/audit'
import { apagarFicheiro, guardarFicheiro } from '@/lib/storage'
import { PERIODICIDADES } from '@/lib/fornecedores'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, asc, eq, getTableColumns } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Lista de contratos do condomínio, com o nome do fornecedor — mesmo
 * acesso que orçamentos de obra (dados financeiros: admin, gestor,
 * condómino ou auditor, nunca inquilino/fornecedor).
 */
export async function getContratos() {
  const m = await requireAcessoFinanceiro()

  // leftJoin, não innerJoin: um contrato sobrevive à eliminação do
  // fornecedor (fornecedorId fica null, ver comentário no schema).
  return db
    .select({ ...getTableColumns(contrato), fornecedorNome: fornecedor.nome })
    .from(contrato)
    .leftJoin(fornecedor, eq(contrato.fornecedorId, fornecedor.id))
    .where(eq(contrato.condominioId, m.condominioId))
    .orderBy(asc(contrato.dataFim))
}

function lerCamposComuns(formData: FormData) {
  const objeto = String(formData.get('objeto') || '').trim()
  const categoria = String(formData.get('categoria') || '').trim()
  const valor = String(formData.get('valor') || '').trim()
  const periodicidade = String(formData.get('periodicidade') || 'anual')
  const dataInicioStr = String(formData.get('dataInicio') || '')
  const dataFimStr = String(formData.get('dataFim') || '')
  const renovacaoAutomatica = formData.get('renovacaoAutomatica') === 'true'
  const prazoDenunciaDiasStr = String(formData.get('prazoDenunciaDias') || '').trim()
  const notas = String(formData.get('notas') || '').trim()

  if (!objeto) throw new Error('Indique o objeto do contrato')
  if (!dataInicioStr) throw new Error('Indique a data de início')
  if (!PERIODICIDADES.includes(periodicidade as (typeof PERIODICIDADES)[number])) {
    throw new Error('Periodicidade inválida')
  }

  const dataInicio = new Date(dataInicioStr)
  if (Number.isNaN(dataInicio.getTime())) throw new Error('Data de início inválida')

  let dataFim: Date | null = null
  if (dataFimStr) {
    dataFim = new Date(dataFimStr)
    if (Number.isNaN(dataFim.getTime())) throw new Error('Data de fim inválida')
    if (dataFim <= dataInicio) throw new Error('A data de fim tem de ser posterior à data de início')
  }

  const prazoDenunciaDias = prazoDenunciaDiasStr ? Number(prazoDenunciaDiasStr) : null
  if (prazoDenunciaDias !== null && (!Number.isInteger(prazoDenunciaDias) || prazoDenunciaDias < 0)) {
    throw new Error('Prazo de denúncia inválido')
  }

  return {
    objeto,
    categoria: categoria || null,
    valor: valor || null,
    periodicidade,
    dataInicio,
    dataFim,
    renovacaoAutomatica,
    prazoDenunciaDias,
    notas: notas || null,
  }
}

export async function criarContrato(formData: FormData) {
  const admin = await requireAdmin()
  const campos = lerCamposComuns(formData)

  const fornecedorIdRaw = Number(formData.get('fornecedorId'))
  let fornecedorId: number | null = null
  if (fornecedorIdRaw) {
    const [forn] = await db
      .select({ id: fornecedor.id })
      .from(fornecedor)
      .where(and(eq(fornecedor.id, fornecedorIdRaw), eq(fornecedor.condominioId, admin.condominioId)))
      .limit(1)
    if (!forn) throw new Error('Fornecedor não encontrado')
    fornecedorId = forn.id
  }

  let anexoUrl: string | null = null
  let anexoNomeFicheiro: string | null = null
  const anexo = formData.get('anexo')
  if (anexo instanceof File && anexo.size > 0) {
    const guardado = await guardarFicheiro(anexo, 'contratos')
    anexoUrl = guardado.url
    anexoNomeFicheiro = guardado.nomeFicheiro
  }

  const [novo] = await db
    .insert(contrato)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      fornecedorId,
      ...campos,
      anexoUrl,
      anexoNomeFicheiro,
    })
    .returning({ id: contrato.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'contrato',
    entidadeId: novo.id,
    detalhes: campos.objeto,
  })

  revalidatePath('/fornecedores')
}

export async function atualizarContrato(formData: FormData) {
  const admin = await requireAdmin()

  const id = Number(formData.get('id'))
  const campos = lerCamposComuns(formData)

  const fornecedorIdRaw = Number(formData.get('fornecedorId'))
  let fornecedorId: number | null = null
  if (fornecedorIdRaw) {
    const [forn] = await db
      .select({ id: fornecedor.id })
      .from(fornecedor)
      .where(and(eq(fornecedor.id, fornecedorIdRaw), eq(fornecedor.condominioId, admin.condominioId)))
      .limit(1)
    if (!forn) throw new Error('Fornecedor não encontrado')
    fornecedorId = forn.id
  }

  const condicao = and(eq(contrato.id, id), eq(contrato.condominioId, admin.condominioId))
  const [antes] = await db.select().from(contrato).where(condicao).limit(1)
  if (!antes) throw new Error('Contrato não encontrado')

  const novosValores = { fornecedorId, ...campos }

  await db.update(contrato).set(novosValores).where(condicao)

  const alteracoes = compararCampos(antes, novosValores, {
    fornecedorId: 'Fornecedor',
    objeto: 'Objeto',
    categoria: 'Categoria',
    valor: 'Valor',
    periodicidade: 'Periodicidade',
    dataInicio: 'Data de início',
    dataFim: 'Data de fim',
    renovacaoAutomatica: 'Renovação automática',
    prazoDenunciaDias: 'Prazo de denúncia (dias)',
    notas: 'Notas',
  })
  if (alteracoes.length > 0) {
    await registarAuditoria({
      actor: admin,
      acao: 'atualizar',
      entidade: 'contrato',
      entidadeId: id,
      detalhes: `${campos.objeto}: ${gerarResumoAlteracoes(alteracoes)}`,
      alteracoes,
    })
  }

  revalidatePath('/fornecedores')
}

export async function eliminarContrato(id: number) {
  const admin = await requireAdmin()
  const condicao = and(eq(contrato.id, id), eq(contrato.condominioId, admin.condominioId))

  const [existente] = await db.select({ anexoUrl: contrato.anexoUrl }).from(contrato).where(condicao).limit(1)
  if (!existente) throw new Error('Contrato não encontrado')

  await db.delete(contrato).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'contrato',
    entidadeId: id,
  })

  await apagarFicheiro(existente.anexoUrl)

  revalidatePath('/fornecedores')
}
