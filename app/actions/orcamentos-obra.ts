'use server'

import { db } from '@/lib/db'
import { fornecedor, ocorrencia, orcamentoObra } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { apagarFicheiro, guardarFicheiro } from '@/lib/storage'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, desc, eq, getTableColumns, isNull, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 20

/**
 * Lista de orçamentos de obra do condomínio, com o nome do fornecedor —
 * mesmo acesso que documentos de fornecedor (dados financeiros: admin,
 * gestor, condómino ou auditor, nunca inquilino/fornecedor).
 */
export async function getOrcamentosObra({ page = 1, search = '' }: { page?: number; search?: string } = {}) {
  const m = await requireAcessoFinanceiro()

  const base = and(eq(orcamentoObra.condominioId, m.condominioId), isNull(orcamentoObra.deletedAt))
  // leftJoin, não innerJoin: um orçamento sobrevive à eliminação do
  // fornecedor (fornecedorId fica null, ver comentário no schema) — não
  // pode desaparecer da lista por causa disso.
  const condicao = search
    ? and(
        base,
        sql`unaccent(${orcamentoObra.assunto} || ' ' || coalesce(${fornecedor.nome}, '')) ilike unaccent(${`%${search}%`})`,
      )
    : base

  const [linhas, [{ total }]] = await Promise.all([
    db
      .select({ ...getTableColumns(orcamentoObra), fornecedorNome: fornecedor.nome })
      .from(orcamentoObra)
      .leftJoin(fornecedor, eq(orcamentoObra.fornecedorId, fornecedor.id))
      .where(condicao)
      .orderBy(desc(orcamentoObra.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(orcamentoObra)
      .leftJoin(fornecedor, eq(orcamentoObra.fornecedorId, fornecedor.id))
      .where(condicao),
  ])

  return { orcamentos: linhas, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export async function criarOrcamentoObra(formData: FormData) {
  const admin = await requireAdmin()

  const assunto = String(formData.get('assunto') || '').trim()
  const fornecedorId = Number(formData.get('fornecedorId'))
  const valor = String(formData.get('valor') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const ocorrenciaIdRaw = String(formData.get('ocorrenciaId') || '').trim()

  if (!assunto) throw new Error('Indique o assunto da obra/intervenção')
  if (!fornecedorId) throw new Error('Selecione o fornecedor')
  if (!valor || Number(valor) <= 0) throw new Error('Indique um valor válido')

  const [forn] = await db
    .select({ id: fornecedor.id })
    .from(fornecedor)
    .where(and(eq(fornecedor.id, fornecedorId), eq(fornecedor.condominioId, admin.condominioId)))
    .limit(1)
  if (!forn) throw new Error('Fornecedor não encontrado')

  let ocorrenciaId: number | null = null
  if (ocorrenciaIdRaw) {
    const [oc] = await db
      .select({ id: ocorrencia.id })
      .from(ocorrencia)
      .where(and(eq(ocorrencia.id, Number(ocorrenciaIdRaw)), eq(ocorrencia.condominioId, admin.condominioId)))
      .limit(1)
    if (!oc) throw new Error('Ocorrência não encontrada')
    ocorrenciaId = oc.id
  }

  let anexoUrl: string | null = null
  let anexoNomeFicheiro: string | null = null
  const anexo = formData.get('anexo')
  if (anexo instanceof File && anexo.size > 0) {
    const guardado = await guardarFicheiro(anexo, 'orcamentos-obra')
    anexoUrl = guardado.url
    anexoNomeFicheiro = guardado.nomeFicheiro
  }

  const [novo] = await db
    .insert(orcamentoObra)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      assunto,
      ocorrenciaId,
      fornecedorId,
      valor,
      descricao: descricao || null,
      anexoUrl,
      anexoNomeFicheiro,
    })
    .returning({ id: orcamentoObra.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'orcamentoObra',
    entidadeId: novo.id,
    detalhes: `${assunto} — ${valor} €`,
  })

  revalidatePath('/fornecedores')
}

/** Toggle simples e independente por linha — não desmarca outras propostas
 * do mesmo assunto/ocorrência (ver comentário no schema). */
export async function marcarVencedorOrcamentoObra(id: number, vencedor: boolean) {
  const admin = await requireAdmin()
  const condicao = and(eq(orcamentoObra.id, id), eq(orcamentoObra.condominioId, admin.condominioId))

  const [atual] = await db.select({ assunto: orcamentoObra.assunto }).from(orcamentoObra).where(condicao).limit(1)
  if (!atual) throw new Error('Orçamento não encontrado')

  await db.update(orcamentoObra).set({ vencedor }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'orcamentoObra',
    entidadeId: id,
    detalhes: `${atual.assunto}: ${vencedor ? 'marcado como vencedor' : 'desmarcado como vencedor'}`,
  })

  revalidatePath('/fornecedores')
}

export async function eliminarOrcamentoObra(id: number) {
  const admin = await requireAdmin()
  const condicao = and(eq(orcamentoObra.id, id), eq(orcamentoObra.condominioId, admin.condominioId))

  const [existente] = await db.select({ anexoUrl: orcamentoObra.anexoUrl }).from(orcamentoObra).where(condicao).limit(1)
  if (!existente) throw new Error('Orçamento não encontrado')

  await db.update(orcamentoObra).set({ deletedAt: new Date() }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'orcamentoObra',
    entidadeId: id,
  })

  await apagarFicheiro(existente.anexoUrl)

  revalidatePath('/fornecedores')
}
