'use server'

import { db } from '@/lib/db'
import { fornecedor, fracao, movimento, orcamento } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { calcularJurosMora } from '@/lib/juros'
import { calcularQuotasMensais } from '@/lib/rateio'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, asc, count, desc, eq, getTableColumns, gte, ilike, isNotNull, isNull, lt, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 20

export async function getMovimentos() {
  // Dados financeiros: admin, gestor, condómino ou auditor — não
  // inquilino nem fornecedor (ver lib/session.ts).
  const m = await requireAcessoFinanceiro()
  return db
    .select({ ...getTableColumns(movimento), fornecedorNome: fornecedor.nome })
    .from(movimento)
    .leftJoin(fornecedor, eq(movimento.fornecedorId, fornecedor.id))
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        isNull(movimento.deletedAt),
      ),
    )
    .orderBy(desc(movimento.data))
}

export async function getMovimentosPaginado({
  page = 1,
  search = '',
}: { page?: number; search?: string } = {}) {
  const m = await requireAcessoFinanceiro()
  const condicao = search
    ? and(
        eq(movimento.condominioId, m.condominioId),
        isNull(movimento.deletedAt),
        or(ilike(movimento.categoria, `%${search}%`), ilike(movimento.descricao, `%${search}%`)),
      )
    : and(eq(movimento.condominioId, m.condominioId), isNull(movimento.deletedAt))

  const [movimentos, [{ total }]] = await Promise.all([
    db
      .select({ ...getTableColumns(movimento), fornecedorNome: fornecedor.nome })
      .from(movimento)
      .leftJoin(fornecedor, eq(movimento.fornecedorId, fornecedor.id))
      .where(condicao)
      .orderBy(desc(movimento.data))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(movimento).where(condicao),
  ])

  return { movimentos, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

/**
 * Saldo do fundo de reserva (movimentos com destino "reserva"). O fundo de
 * reserva é obrigatório por lei (art.º 4.º do DL n.º 268/94) e segue-se à
 * parte das contas correntes do condomínio — nunca somado às quotas normais.
 */
export async function getSaldoFundoReserva() {
  const m = await requireAcessoFinanceiro()
  const movimentosReserva = await db
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        eq(movimento.destino, 'reserva'),
        isNull(movimento.deletedAt),
      ),
    )

  const receitas = movimentosReserva
    .filter((mv) => mv.tipo === 'receita')
    .reduce((s, mv) => s + Number(mv.valor), 0)
  const despesas = movimentosReserva
    .filter((mv) => mv.tipo === 'despesa')
    .reduce((s, mv) => s + Number(mv.valor), 0)

  return { receitas, despesas, saldo: receitas - despesas }
}

/**
 * Um único movimento (para o recibo). Devolve `null` em vez de lançar se
 * não existir ou não pertencer ao condomínio do membro atual — a página do
 * recibo trata isso como "não encontrado", não como erro.
 */
export async function getMovimentoPorId(id: number) {
  const m = await requireAcessoFinanceiro()
  const [mov] = await db
    .select()
    .from(movimento)
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, m.condominioId)))
    .limit(1)
  return mov ?? null
}

/**
 * Mapa de saldos: para cada fração, quanto foi lançado em quotas (receitas
 * ligadas a essa fração), quanto já foi pago, e quanto está em dívida.
 * Responde diretamente a "quanto deve o 2ºEsq?" — a peça financeira mais
 * pedida na auditoria (FUNCTIONAL_GAPS.md secção 3).
 */
export async function getMapaSaldos() {
  const m = await requireAcessoFinanceiro()

  const [fracoes, quotas] = await Promise.all([
    db
      .select()
      .from(fracao)
      .where(eq(fracao.condominioId, m.condominioId))
      .orderBy(asc(fracao.identificacao)),
    db
      .select()
      .from(movimento)
      .where(
        and(
          eq(movimento.condominioId, m.condominioId),
          eq(movimento.tipo, 'receita'),
          isNull(movimento.deletedAt),
        ),
      ),
  ])

  return fracoes.map((f) => {
    const quotasDaFracao = quotas.filter((q) => q.fracaoId === f.id)
    const totalLancado = quotasDaFracao.reduce((s, q) => s + Number(q.valor), 0)
    const totalPago = quotasDaFracao
      .filter((q) => q.pago)
      .reduce((s, q) => s + Number(q.valor), 0)
    return {
      fracaoId: f.id,
      identificacao: f.identificacao,
      proprietario: f.proprietario,
      totalLancado,
      totalPago,
      emDivida: totalLancado - totalPago,
    }
  })
}

/**
 * Mapa mensal de quotas: para cada fração, o que foi lançado em cada um dos
 * 12 meses do `ano` pedido (quotas, juros de mora, etc. — qualquer receita
 * ligada a essa fração cuja data caia nesse mês), com o estado de
 * pagamento agregado da célula. Layout inspirado no mapa "Quotas" usado
 * por administrações de condomínio externas (fração × mês, com total),
 * ver `Exemplo MBD.pdf` — mas aqui o valor é o realmente lançado em
 * `movimento`, não uma simulação de orçamento.
 */
export async function getMapaMensalQuotas(ano: number) {
  const m = await requireAcessoFinanceiro()

  const inicio = new Date(Date.UTC(ano, 0, 1))
  const fim = new Date(Date.UTC(ano + 1, 0, 1))

  const [fracoes, quotas] = await Promise.all([
    db
      .select()
      .from(fracao)
      .where(eq(fracao.condominioId, m.condominioId))
      .orderBy(asc(fracao.identificacao)),
    db
      .select({ ...getTableColumns(movimento), fornecedorNome: fornecedor.nome })
      .from(movimento)
      .leftJoin(fornecedor, eq(movimento.fornecedorId, fornecedor.id))
      .where(
        and(
          eq(movimento.condominioId, m.condominioId),
          eq(movimento.tipo, 'receita'),
          isNull(movimento.deletedAt),
          gte(movimento.data, inicio),
          lt(movimento.data, fim),
        ),
      ),
  ])

  return fracoes.map((f) => {
    const quotasDaFracao = quotas.filter((q) => q.fracaoId === f.id)
    const meses = Array.from({ length: 12 }, (_, mes) => {
      const movimentosDoMes = quotasDaFracao.filter((q) => q.data.getUTCMonth() === mes)
      const valor = movimentosDoMes.reduce((s, q) => s + Number(q.valor), 0)
      const todosPagos = movimentosDoMes.length > 0 && movimentosDoMes.every((q) => q.pago)
      const algunsPagos = movimentosDoMes.some((q) => q.pago)
      const estado: 'vazio' | 'pago' | 'parcial' | 'pendente' =
        movimentosDoMes.length === 0
          ? 'vazio'
          : todosPagos
            ? 'pago'
            : algunsPagos
              ? 'parcial'
              : 'pendente'
      return { mes, valor, estado, movimentos: movimentosDoMes }
    })
    const totalAno = meses.reduce((s, c) => s + c.valor, 0)
    const totalPagoAno = quotasDaFracao.filter((q) => q.pago).reduce((s, q) => s + Number(q.valor), 0)
    return {
      fracaoId: f.id,
      letra: f.letra,
      identificacao: f.identificacao,
      proprietario: f.proprietario,
      meses,
      totalAno,
      totalPagoAno,
    }
  })
}

/**
 * Declaração de encargos e dívidas de uma fração (Código Civil art. 1424º-A,
 * aditado pela Lei n.º 8/2022) — documento instrutório obrigatório da venda
 * de uma fração, a emitir pelo administrador a pedido do condómino no prazo
 * máximo de 10 dias. Devolve o encargo corrente (quota mensal atual,
 * calculada a partir do orçamento mais recente) e a lista de dívidas
 * existentes (natureza, valor, data de constituição/vencimento — usa-se a
 * própria data do lançamento como vencimento, mesma convenção de
 * getQuotasEmAtraso/lancarJurosMora).
 */
export async function getDeclaracaoDivida(fracaoId: number) {
  const m = await requireAcessoFinanceiro()

  const [f] = await db
    .select()
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, m.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração não encontrada')

  const [fracoes, [orcamentoRecente], dividas] = await Promise.all([
    db
      .select({ id: fracao.id, permilagem: fracao.permilagem, isentaElevador: fracao.isentaElevador })
      .from(fracao)
      .where(eq(fracao.condominioId, m.condominioId)),
    db
      .select()
      .from(orcamento)
      .where(eq(orcamento.condominioId, m.condominioId))
      .orderBy(desc(orcamento.ano))
      .limit(1),
    db
      .select({
        id: movimento.id,
        categoria: movimento.categoria,
        descricao: movimento.descricao,
        valor: movimento.valor,
        data: movimento.data,
      })
      .from(movimento)
      .where(
        and(
          eq(movimento.condominioId, m.condominioId),
          eq(movimento.fracaoId, fracaoId),
          eq(movimento.tipo, 'receita'),
          eq(movimento.pago, false),
          isNull(movimento.deletedAt),
        ),
      )
      .orderBy(asc(movimento.data)),
  ])

  let quotaMensalAtual: number | null = null
  if (orcamentoRecente) {
    const quotas = calcularQuotasMensais(
      fracoes.map((fr) => ({
        id: fr.id,
        permilagem: Number(fr.permilagem),
        isentaElevador: fr.isentaElevador,
      })),
      Number(orcamentoRecente.valorAnual),
      orcamentoRecente.valorAnualElevador ? Number(orcamentoRecente.valorAnualElevador) : 0,
    )
    quotaMensalAtual = quotas.find((q) => q.fracaoId === fracaoId)?.valorMensal ?? null
  }

  const totalDivida = dividas.reduce((s, d) => s + Number(d.valor), 0)

  return {
    fracao: { id: f.id, identificacao: f.identificacao, proprietario: f.proprietario, nif: f.nif },
    anoOrcamento: orcamentoRecente?.ano ?? null,
    quotaMensalAtual,
    dividas,
    totalDivida,
  }
}

/**
 * Quotas (receitas ligadas a uma fração) por pagar cuja data já passou —
 * "em atraso" usa a própria data da quota como data de vencimento, sem
 * campo de vencimento próprio nem período de tolerância. Base de
 * app/actions/financas.ts:lancarJurosMora e do diálogo de pré-visualização.
 */
export async function getQuotasEmAtraso() {
  const m = await requireAcessoFinanceiro()
  return db
    .select({
      id: movimento.id,
      fracaoId: movimento.fracaoId,
      valor: movimento.valor,
      data: movimento.data,
    })
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        eq(movimento.tipo, 'receita'),
        eq(movimento.pago, false),
        isNotNull(movimento.fracaoId),
        lt(movimento.data, new Date()),
        isNull(movimento.deletedAt),
      ),
    )
}

/**
 * Lança juros de mora sobre todas as quotas em atraso, agrupados por
 * fração (um movimento novo por fração, não um por quota). A taxa é
 * indicada pelo administrador no momento — a app não a sugere nem a
 * guarda, por depender do regulamento do condomínio ou da taxa legal em
 * vigor, que esta ferramenta não assume conhecer com autoridade.
 */
export async function lancarJurosMora(taxaAnualPercent: number) {
  const admin = await requireAdmin()

  if (!Number.isFinite(taxaAnualPercent) || taxaAnualPercent <= 0) {
    throw new Error('Indique uma taxa de juro anual válida')
  }

  const quotasEmAtraso = await getQuotasEmAtraso()
  if (quotasEmAtraso.length === 0) {
    throw new Error('Não há quotas em atraso')
  }

  const jurosPorFracao = calcularJurosMora(
    quotasEmAtraso.map((q) => ({
      fracaoId: q.fracaoId!,
      valor: Number(q.valor),
      data: q.data,
    })),
    taxaAnualPercent,
  )

  const aLancar = jurosPorFracao.filter((f) => f.valorJuros > 0)
  if (aLancar.length === 0) {
    throw new Error('Os juros calculados são todos zero — nada a lançar')
  }

  for (const f of aLancar) {
    const [novo] = await db
      .insert(movimento)
      .values({
        condominioId: admin.condominioId,
        userId: admin.userId,
        tipo: 'receita',
        categoria: 'Juros de mora',
        descricao: `Juros de mora — taxa ${taxaAnualPercent}% ao ano, ${f.quotas.length} quota(s) em atraso`,
        valor: f.valorJuros.toFixed(2),
        fracaoId: f.fracaoId,
        pago: false,
        destino: 'geral',
      })
      .returning({ id: movimento.id })

    await registarAuditoria({
      actor: admin,
      acao: 'criar',
      entidade: 'movimento',
      entidadeId: novo.id,
      detalhes: `Juros de mora lançados: ${f.valorJuros.toFixed(2)} € (taxa ${taxaAnualPercent}%/ano, ${f.quotas.length} quota(s))`,
    })
  }

  revalidatePath('/financas')

  return {
    quantidade: aLancar.length,
    total: aLancar.reduce((s, f) => s + f.valorJuros, 0),
  }
}

export async function criarMovimento(formData: FormData) {
  const admin = await requireAdmin()

  const tipo = String(formData.get('tipo') || 'despesa')
  const categoria = String(formData.get('categoria') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const valor = String(formData.get('valor') || '0')
  const dataStr = String(formData.get('data') || '')
  const pago = formData.get('pago') === 'on' || formData.get('pago') === 'true'
  const fracaoIdRaw = String(formData.get('fracaoId') || '').trim()
  const fracaoId = fracaoIdRaw ? Number(fracaoIdRaw) : null
  const fornecedorIdRaw = String(formData.get('fornecedorId') || '').trim()
  const fornecedorId = fornecedorIdRaw ? Number(fornecedorIdRaw) : null
  const destino = String(formData.get('destino') || 'geral')
  const meioPagamentoRaw = String(formData.get('meioPagamento') || '').trim()
  const referenciaMbRaw = String(formData.get('referenciaMb') || '').trim()
  const dataLiquidacaoRaw = String(formData.get('dataLiquidacao') || '').trim()

  if (!categoria || !descricao || !valor) {
    throw new Error('Preencha todos os campos obrigatórios')
  }
  // Uma quota (receita) tem de estar ligada a uma fração para se poder
  // calcular a dívida por fração (ver getMapaSaldos); despesas são gerais
  // do condomínio e não precisam de fração.
  if (tipo === 'receita' && !fracaoId) {
    throw new Error('Selecione a fração a que esta quota diz respeito')
  }
  if (destino !== 'geral' && destino !== 'reserva') {
    throw new Error('Destino inválido')
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
      fracaoId: tipo === 'receita' ? fracaoId : null,
      fornecedorId: tipo === 'despesa' ? fornecedorId : null,
      destino,
      // Detalhe do pagamento só faz sentido quando o movimento já nasce pago.
      meioPagamento: pago && meioPagamentoRaw ? meioPagamentoRaw : null,
      referenciaMb: pago && referenciaMbRaw ? referenciaMbRaw : null,
      dataLiquidacao: pago && dataLiquidacaoRaw ? new Date(dataLiquidacaoRaw) : null,
      ...(dataStr ? { data: new Date(dataStr) } : {}),
    })
    .returning({ id: movimento.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'movimento',
    entidadeId: novo.id,
    detalhes: `${tipo}: ${categoria} — ${descricao} (${valor} €)${destino === 'reserva' ? ' [fundo de reserva]' : ''}`,
  })

  revalidatePath('/financas')
  revalidatePath('/')
}

/**
 * Corrige os dados de um movimento já lançado (valor, categoria, descrição,
 * data, destino, fração/fornecedor). O tipo (receita/despesa) não é
 * editável aqui — mudar de tipo tem implicações demasiado grandes (fração
 * vs. fornecedor, cálculo de dívida) para ser um simples campo de edição;
 * quem se enganar no tipo deve eliminar e lançar de novo. O estado
 * pago/pendente e o detalhe do pagamento continuam a ser geridos por
 * `alternarPago`/`marcarComoPago`, não por aqui.
 */
export async function atualizarMovimento(formData: FormData) {
  const admin = await requireAdmin()

  const id = Number(formData.get('id'))
  const categoria = String(formData.get('categoria') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const valor = String(formData.get('valor') || '0')
  const dataStr = String(formData.get('data') || '')
  const fracaoIdRaw = String(formData.get('fracaoId') || '').trim()
  const fracaoId = fracaoIdRaw ? Number(fracaoIdRaw) : null
  const fornecedorIdRaw = String(formData.get('fornecedorId') || '').trim()
  const fornecedorId = fornecedorIdRaw ? Number(fornecedorIdRaw) : null
  const destino = String(formData.get('destino') || 'geral')

  if (!categoria || !descricao || !valor || !dataStr) {
    throw new Error('Preencha todos os campos obrigatórios')
  }
  if (destino !== 'geral' && destino !== 'reserva') {
    throw new Error('Destino inválido')
  }

  const [atual] = await db
    .select()
    .from(movimento)
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))
    .limit(1)
  if (!atual) throw new Error('Movimento não encontrado')

  if (atual.tipo === 'receita' && !fracaoId) {
    throw new Error('Selecione a fração a que esta quota diz respeito')
  }

  await db
    .update(movimento)
    .set({
      categoria,
      descricao,
      valor,
      data: new Date(dataStr),
      destino,
      fracaoId: atual.tipo === 'receita' ? fracaoId : null,
      fornecedorId: atual.tipo === 'despesa' ? fornecedorId : null,
    })
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'movimento',
    entidadeId: id,
    detalhes: `De "${atual.categoria} — ${atual.descricao} (${atual.valor} €)" para "${categoria} — ${descricao} (${valor} €)"`,
  })

  revalidatePath('/financas')
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

/**
 * Marca um movimento como pendente novamente — limpa o detalhe do
 * pagamento (meio, referência, data de liquidação), que deixa de fazer
 * sentido enquanto o movimento não voltar a ser pago.
 */
export async function alternarPago(id: number, pago: boolean) {
  const admin = await requireAdmin()
  await db
    .update(movimento)
    .set({
      pago,
      ...(pago ? {} : { meioPagamento: null, referenciaMb: null, dataLiquidacao: null }),
    })
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

/**
 * Marca um movimento como pago já com o detalhe do pagamento (meio,
 * referência multibanco, data de liquidação) — usado no diálogo de
 * "Marcar como pago" em vez do toggle simples de `alternarPago`.
 */
export async function marcarComoPago(
  id: number,
  detalhe: { meioPagamento?: string; referenciaMb?: string; dataLiquidacao?: string },
) {
  const admin = await requireAdmin()
  await db
    .update(movimento)
    .set({
      pago: true,
      meioPagamento: detalhe.meioPagamento || null,
      referenciaMb: detalhe.referenciaMb || null,
      dataLiquidacao: detalhe.dataLiquidacao ? new Date(detalhe.dataLiquidacao) : null,
    })
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'movimento',
    entidadeId: id,
    detalhes: `Marcado como pago${detalhe.meioPagamento ? ` (${detalhe.meioPagamento})` : ''}`,
  })

  revalidatePath('/financas')
}
