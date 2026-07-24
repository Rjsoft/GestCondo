'use server'

import { db } from '@/lib/db'
import { documentoFornecedor, fornecedor, movimento, pagamentoDocumentoFornecedor } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { calcularSaldosDocumentosFornecedor } from '@/lib/documentos-fornecedor'
import { apagarFicheiro, guardarFicheiro } from '@/lib/storage'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Lista de documentos de fornecedor do condomínio, com o nome do fornecedor,
 * o saldo calculado (valorPago/saldo/estado — nunca campos persistidos, ver
 * lib/documentos-fornecedor.ts) e o histórico de pagamentos já incluído.
 * Uma lista tipicamente pequena por condomínio (mesmo princípio de
 * `seguro.fracoes`) — sem paginação nem query em separado por documento.
 */
export async function getDocumentosFornecedor() {
  const m = await requireAcessoFinanceiro()

  const documentos = await db
    .select({
      id: documentoFornecedor.id,
      fornecedorId: documentoFornecedor.fornecedorId,
      fornecedorNome: fornecedor.nome,
      numeroLancamento: documentoFornecedor.numeroLancamento,
      numeroDocumento: documentoFornecedor.numeroDocumento,
      categoria: documentoFornecedor.categoria,
      dataEmissao: documentoFornecedor.dataEmissao,
      dataVencimento: documentoFornecedor.dataVencimento,
      valor: documentoFornecedor.valor,
      anexoUrl: documentoFornecedor.anexoUrl,
      anexoNomeFicheiro: documentoFornecedor.anexoNomeFicheiro,
    })
    .from(documentoFornecedor)
    .leftJoin(fornecedor, eq(documentoFornecedor.fornecedorId, fornecedor.id))
    .where(and(eq(documentoFornecedor.condominioId, m.condominioId), isNull(documentoFornecedor.deletedAt)))
    .orderBy(desc(documentoFornecedor.dataEmissao))

  const saldos = await calcularSaldosDocumentosFornecedor(documentos)
  const todosPagamentos = await db
    .select({
      id: pagamentoDocumentoFornecedor.id,
      documentoFornecedorId: pagamentoDocumentoFornecedor.documentoFornecedorId,
      valor: pagamentoDocumentoFornecedor.valor,
      dataPagamento: pagamentoDocumentoFornecedor.dataPagamento,
      movimentoId: pagamentoDocumentoFornecedor.movimentoId,
    })
    .from(pagamentoDocumentoFornecedor)
    .where(eq(pagamentoDocumentoFornecedor.condominioId, m.condominioId))
    .orderBy(desc(pagamentoDocumentoFornecedor.dataPagamento))

  return documentos.map((doc) => {
    // Não espalhar o objeto todo de `saldos`: tem o seu próprio `valor`
    // (já convertido para number, para cálculo) que sobreporia o `valor`
    // string original do documento vindo da BD.
    const { valorPago, saldo, estado, pagoEmExcesso } = saldos.get(doc.id)!
    return {
      ...doc,
      valorPago,
      saldo,
      estado,
      pagoEmExcesso,
      pagamentos: todosPagamentos.filter((p) => p.documentoFornecedorId === doc.id),
    }
  })
}

export async function criarDocumentoFornecedor(formData: FormData) {
  const admin = await requireAdmin()

  const fornecedorIdRaw = String(formData.get('fornecedorId') || '').trim()
  const numeroDocumento = String(formData.get('numeroDocumento') || '').trim()
  const categoria = String(formData.get('categoria') || '').trim()
  const dataEmissaoStr = String(formData.get('dataEmissao') || '').trim()
  const dataVencimentoStr = String(formData.get('dataVencimento') || '').trim()
  const valor = String(formData.get('valor') || '').trim()

  if (!categoria) throw new Error('Indique a categoria do documento')
  if (!dataEmissaoStr) throw new Error('Indique a data de emissão')
  if (!valor || Number(valor) <= 0) throw new Error('Indique um valor válido')

  if (fornecedorIdRaw) {
    const [forn] = await db
      .select({ id: fornecedor.id })
      .from(fornecedor)
      .where(and(eq(fornecedor.id, Number(fornecedorIdRaw)), eq(fornecedor.condominioId, admin.condominioId)))
      .limit(1)
    if (!forn) throw new Error('Fornecedor não encontrado')
  }

  let anexoUrl: string | null = null
  let anexoNomeFicheiro: string | null = null
  const anexo = formData.get('anexo')
  if (anexo instanceof File && anexo.size > 0) {
    const guardado = await guardarFicheiro(anexo, 'documentos-fornecedor')
    anexoUrl = guardado.url
    anexoNomeFicheiro = guardado.nomeFicheiro
  }

  const [novo] = await db
    .insert(documentoFornecedor)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      fornecedorId: fornecedorIdRaw ? Number(fornecedorIdRaw) : null,
      numeroDocumento: numeroDocumento || null,
      categoria,
      dataEmissao: new Date(dataEmissaoStr),
      dataVencimento: dataVencimentoStr ? new Date(dataVencimentoStr) : null,
      valor,
      anexoUrl,
      anexoNomeFicheiro,
    })
    .returning({ id: documentoFornecedor.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'documentoFornecedor',
    entidadeId: novo.id,
    detalhes: `${categoria} — ${valor} €${numeroDocumento ? ` (doc. ${numeroDocumento})` : ''}`,
  })

  revalidatePath('/financas')
  return novo.id
}

/**
 * Só permitido sem pagamentos registados — um documento já liquidado
 * (mesmo parcialmente) tem de ser corrigido, não apagado, para não perder
 * o rasto dos pagamentos já feitos. Mesmo princípio de retenção de
 * `movimento`/`seguro`, aplicado aqui através de um bloqueio em vez de
 * soft-delete em cascata.
 */
export async function eliminarDocumentoFornecedor(id: number) {
  const admin = await requireAdmin()
  const condicao = and(eq(documentoFornecedor.id, id), eq(documentoFornecedor.condominioId, admin.condominioId))

  const [existente] = await db
    .select({ anexoUrl: documentoFornecedor.anexoUrl })
    .from(documentoFornecedor)
    .where(condicao)
    .limit(1)
  if (!existente) throw new Error('Documento não encontrado')

  const [pagamento] = await db
    .select({ id: pagamentoDocumentoFornecedor.id })
    .from(pagamentoDocumentoFornecedor)
    .where(eq(pagamentoDocumentoFornecedor.documentoFornecedorId, id))
    .limit(1)
  if (pagamento) {
    throw new Error('Este documento já tem pagamentos registados — não pode ser eliminado.')
  }

  await db.update(documentoFornecedor).set({ deletedAt: new Date() }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'documentoFornecedor',
    entidadeId: id,
  })

  await apagarFicheiro(existente.anexoUrl)

  revalidatePath('/financas')
}

/**
 * Regista um pagamento (parcial ou total) de um documento de fornecedor.
 * Um pagamento acima do saldo em dívida não é bloqueado (pode ser uma
 * correção legítima) — ver `pagoEmExcesso` em
 * lib/documentos-fornecedor.ts, resolvido na leitura, não na escrita.
 */
export async function registarPagamentoDocumentoFornecedor(formData: FormData) {
  const admin = await requireAdmin()

  const documentoFornecedorId = Number(formData.get('documentoFornecedorId'))
  const valor = String(formData.get('valor') || '').trim()
  const dataPagamentoStr = String(formData.get('dataPagamento') || '').trim()
  const movimentoIdRaw = String(formData.get('movimentoId') || '').trim()

  if (!valor || Number(valor) <= 0) throw new Error('Indique um valor válido')
  if (!dataPagamentoStr) throw new Error('Indique a data do pagamento')

  const [documento] = await db
    .select({ id: documentoFornecedor.id, categoria: documentoFornecedor.categoria })
    .from(documentoFornecedor)
    .where(
      and(
        eq(documentoFornecedor.id, documentoFornecedorId),
        eq(documentoFornecedor.condominioId, admin.condominioId),
        isNull(documentoFornecedor.deletedAt),
      ),
    )
    .limit(1)
  if (!documento) throw new Error('Documento não encontrado')

  let movimentoId: number | null = null
  if (movimentoIdRaw) {
    const [mv] = await db
      .select({ id: movimento.id })
      .from(movimento)
      .where(
        and(
          eq(movimento.id, Number(movimentoIdRaw)),
          eq(movimento.condominioId, admin.condominioId),
          isNull(movimento.deletedAt),
        ),
      )
      .limit(1)
    if (!mv) throw new Error('Movimento não encontrado')
    movimentoId = mv.id
  }

  const [novo] = await db
    .insert(pagamentoDocumentoFornecedor)
    .values({
      condominioId: admin.condominioId,
      documentoFornecedorId,
      valor,
      dataPagamento: new Date(dataPagamentoStr),
      movimentoId,
      userId: admin.userId,
    })
    .returning({ id: pagamentoDocumentoFornecedor.id })

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'documentoFornecedor',
    entidadeId: documentoFornecedorId,
    detalhes: `Pagamento registado: ${valor} €${movimentoId ? ` (ligado ao movimento #${movimentoId})` : ''}`,
  })

  revalidatePath('/financas')
  return novo.id
}
