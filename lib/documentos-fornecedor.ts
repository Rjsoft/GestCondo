// Cálculo de valorPago/saldo/estado de documentos de fornecedor — módulo de
// domínio único, para nunca guardar estes valores como campos persistidos
// (ver docs/product/MBD_GEST_GAP_ANALYSIS.md secção 7.3): derivam sempre da
// soma real dos pagamentos, nunca podem divergir dela.

import { db } from '@/lib/db'
import { documentoFornecedor, pagamentoDocumentoFornecedor } from '@/lib/db/schema'
import { and, eq, inArray, isNull } from 'drizzle-orm'

export type EstadoDocumentoFornecedor = 'por_liquidar' | 'parcial' | 'liquidado'

export type SaldoDocumentoFornecedor = {
  documentoFornecedorId: number
  valor: number
  valorPago: number
  saldo: number
  estado: EstadoDocumentoFornecedor
  // Um pagamento a mais do que o valor do documento não é bloqueado (pode
  // ser uma correção legítima, ex. juro de mora do próprio fornecedor) —
  // fica só sinalizado, para a UI poder mostrar um aviso em vez de um erro.
  pagoEmExcesso: boolean
}

/** Nunca negativo: um documento sem pagamentos está sempre "por_liquidar", mesmo que `valor` seja 0. */
export function calcularEstadoDocumentoFornecedor(
  valor: number,
  valorPago: number,
): EstadoDocumentoFornecedor {
  if (valorPago <= 0) return 'por_liquidar'
  if (valorPago >= valor) return 'liquidado'
  return 'parcial'
}

/**
 * Saldo de UM documento de fornecedor, a partir da soma real dos seus
 * pagamentos. `null` se o documento não existir ou estiver eliminado
 * (soft-delete) — comportamento igual ao de um "não encontrado".
 */
export async function calcularSaldoDocumentoFornecedor(
  documentoFornecedorId: number,
): Promise<SaldoDocumentoFornecedor | null> {
  const [documento] = await db
    .select()
    .from(documentoFornecedor)
    .where(
      and(eq(documentoFornecedor.id, documentoFornecedorId), isNull(documentoFornecedor.deletedAt)),
    )
    .limit(1)
  if (!documento) return null

  const pagamentos = await db
    .select()
    .from(pagamentoDocumentoFornecedor)
    .where(eq(pagamentoDocumentoFornecedor.documentoFornecedorId, documentoFornecedorId))

  const valor = Number(documento.valor)
  const valorPago = pagamentos.reduce((soma, p) => soma + Number(p.valor), 0)

  return {
    documentoFornecedorId,
    valor,
    valorPago,
    saldo: valor - valorPago,
    estado: calcularEstadoDocumentoFornecedor(valor, valorPago),
    pagoEmExcesso: valorPago > valor,
  }
}

/**
 * Mesma lógica de `calcularSaldoDocumentoFornecedor`, para VÁRIOS
 * documentos de uma vez (ex. a listagem em `/financas`) — uma única query
 * de pagamentos em vez de N, para não repetir aqui um problema de N+1.
 */
export async function calcularSaldosDocumentosFornecedor(
  documentos: { id: number; valor: string | number }[],
): Promise<Map<number, SaldoDocumentoFornecedor>> {
  const resultado = new Map<number, SaldoDocumentoFornecedor>()
  if (documentos.length === 0) return resultado

  const ids = documentos.map((d) => d.id)
  const pagamentos = await db
    .select()
    .from(pagamentoDocumentoFornecedor)
    .where(inArray(pagamentoDocumentoFornecedor.documentoFornecedorId, ids))

  const pagoPorDocumento = new Map<number, number>()
  for (const p of pagamentos) {
    const atual = pagoPorDocumento.get(p.documentoFornecedorId) ?? 0
    pagoPorDocumento.set(p.documentoFornecedorId, atual + Number(p.valor))
  }

  for (const doc of documentos) {
    const valor = Number(doc.valor)
    const valorPago = pagoPorDocumento.get(doc.id) ?? 0
    resultado.set(doc.id, {
      documentoFornecedorId: doc.id,
      valor,
      valorPago,
      saldo: valor - valorPago,
      estado: calcularEstadoDocumentoFornecedor(valor, valorPago),
      pagoEmExcesso: valorPago > valor,
    })
  }

  return resultado
}
