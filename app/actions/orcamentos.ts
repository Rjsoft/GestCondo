'use server'

import { db } from '@/lib/db'
import { fracao, movimento, orcamento, orcamentoRubrica } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { aplicarPercentagemReserva, calcularQuotasMensais } from '@/lib/rateio'
import { garantirExercicioAberto } from '@/lib/contas-financeiras'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, desc, eq, gte, isNull, lt } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getOrcamentos() {
  const m = await requireAcessoFinanceiro()
  return db
    .select()
    .from(orcamento)
    .where(eq(orcamento.condominioId, m.condominioId))
    .orderBy(desc(orcamento.ano))
}

export async function criarOrcamento(formData: FormData) {
  const admin = await requireAdmin()

  const ano = Number(formData.get('ano'))
  const valorAnual = String(formData.get('valorAnual') || '0')
  const valorAnualElevadorRaw = String(formData.get('valorAnualElevador') || '').trim()
  const percentagemFundoReservaRaw = String(formData.get('percentagemFundoReserva') || '').trim()
  const notas = String(formData.get('notas') || '').trim()

  if (!ano || !Number.isInteger(ano) || ano < 2000 || ano > 2200) {
    throw new Error('Indique um ano válido')
  }
  if (!valorAnual || Number.isNaN(Number(valorAnual)) || Number(valorAnual) <= 0) {
    throw new Error('Indique um valor anual válido')
  }
  if (valorAnualElevadorRaw && Number(valorAnualElevadorRaw) < 0) {
    throw new Error('O valor do elevador não pode ser negativo')
  }
  if (
    percentagemFundoReservaRaw &&
    (Number.isNaN(Number(percentagemFundoReservaRaw)) ||
      Number(percentagemFundoReservaRaw) < 0 ||
      Number(percentagemFundoReservaRaw) > 100)
  ) {
    throw new Error('A percentagem do fundo de reserva tem de estar entre 0 e 100')
  }
  const valorAnualElevador = valorAnualElevadorRaw || null
  const percentagemFundoReserva = percentagemFundoReservaRaw || null

  const [novo] = await db
    .insert(orcamento)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      ano,
      valorAnual,
      valorAnualElevador,
      percentagemFundoReserva,
      notas: notas || null,
    })
    .returning({ id: orcamento.id })
    .onConflictDoUpdate({
      target: [orcamento.condominioId, orcamento.ano],
      set: { valorAnual, valorAnualElevador, percentagemFundoReserva, notas: notas || null },
    })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'orcamento',
    entidadeId: novo.id,
    detalhes: `Ano ${ano}: ${valorAnual} €`,
  })

  revalidatePath('/financas')
}

/**
 * Gera as 12 quotas mensais de cada fração para o ano do orçamento, por
 * rateio de permilagem (ver lib/rateio.ts). Bloqueia se já existirem quotas
 * geradas a partir deste orçamento (verificado por `movimento.orcamentoId`,
 * não por inferência de texto) — para gerar de novo, o admin tem de
 * eliminar essas quotas manualmente primeiro.
 */
export async function gerarQuotasOrcamento(orcamentoId: number) {
  const admin = await requireAdmin()

  const [orc] = await db
    .select()
    .from(orcamento)
    .where(and(eq(orcamento.id, orcamentoId), eq(orcamento.condominioId, admin.condominioId)))
    .limit(1)
  if (!orc) throw new Error('Orçamento não encontrado')

  const [jaGerada] = await db
    .select({ id: movimento.id })
    .from(movimento)
    .where(eq(movimento.orcamentoId, orcamentoId))
    .limit(1)
  if (jaGerada) {
    throw new Error(
      'Já foram geradas quotas para este orçamento. Elimine-as manualmente antes de gerar de novo.',
    )
  }

  const fracoes = await db
    .select({ id: fracao.id, permilagem: fracao.permilagem, isentaElevador: fracao.isentaElevador })
    .from(fracao)
    .where(eq(fracao.condominioId, admin.condominioId))

  const quotasMensais = calcularQuotasMensais(
    fracoes.map((f) => ({
      id: f.id,
      permilagem: Number(f.permilagem),
      isentaElevador: f.isentaElevador,
    })),
    Number(orc.valorAnual),
    orc.valorAnualElevador ? Number(orc.valorAnualElevador) : 0,
  )
  const totalPermilagem = fracoes.reduce((s, f) => s + Number(f.permilagem), 0)
  const percentagemReserva = orc.percentagemFundoReserva ? Number(orc.percentagemFundoReserva) : 0
  const quotasComReserva = aplicarPercentagemReserva(quotasMensais, percentagemReserva)

  // As 12 quotas cobrem o ano inteiro do orçamento — verifica os 12 meses
  // antes de inserir qualquer coisa, para nunca gerar quotas parcialmente
  // se um dos meses cair num exercício fechado.
  for (let mes = 0; mes < 12; mes++) {
    await garantirExercicioAberto(admin.condominioId, new Date(orc.ano, mes, 1))
  }

  // Sem percentagem de fundo de reserva: um único movimento por fração/mês,
  // exatamente como antes desta funcionalidade. Com percentagem: dois
  // movimentos por fração/mês (quota corrente + fundo de reserva), ambos
  // ligados ao mesmo orcamentoId — a proteção contra gerar em duplicado
  // (jaGerada, acima) continua a funcionar sem alteração.
  const linhas = quotasComReserva.flatMap(({ fracaoId, valorGeral, valorReserva }) =>
    Array.from({ length: 12 }, (_, mes) => mes).flatMap((mes) => {
      const data = new Date(orc.ano, mes, 1)
      const base = {
        condominioId: admin.condominioId,
        userId: admin.userId,
        tipo: 'receita' as const,
        categoria: 'Quota mensal',
        fracaoId,
        data,
        pago: false,
        orcamentoId,
      }
      const linhaGeral = {
        ...base,
        descricao: `Quota ${mes + 1}/${orc.ano}`,
        valor: valorGeral.toFixed(2),
        destino: 'geral' as const,
      }
      if (valorReserva <= 0) return [linhaGeral]
      return [
        linhaGeral,
        {
          ...base,
          descricao: `Quota ${mes + 1}/${orc.ano} — fundo de reserva`,
          valor: valorReserva.toFixed(2),
          destino: 'reserva' as const,
        },
      ]
    }),
  )

  await db.insert(movimento).values(linhas)

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'orcamento',
    entidadeId: orcamentoId,
    detalhes: `Quotas mensais geradas para ${orc.ano}: ${fracoes.length} frações × 12 meses = ${linhas.length} quotas (permilagem total apurada: ${totalPermilagem.toFixed(2)}‰)${percentagemReserva > 0 ? `, ${percentagemReserva}% destinados ao fundo de reserva` : ''}`,
  })

  revalidatePath('/financas')

  return { quantidade: linhas.length }
}

/**
 * Balanço orçamento aprovado vs. real (art. 1436º CC): compara o valor anual
 * do orçamento com as receitas/despesas reais lançadas nesse ano civil,
 * excluindo o fundo de reserva (destino "geral" apenas — o fundo de reserva
 * é seguido à parte, ver getSaldoFundoReserva). Desvio = despesas reais -
 * valor anual previsto (positivo = gastou-se mais do que o orçamentado).
 */
export async function getBalancoOrcamento(orcamentoId: number) {
  const m = await requireAcessoFinanceiro()

  const [orc] = await db
    .select()
    .from(orcamento)
    .where(and(eq(orcamento.id, orcamentoId), eq(orcamento.condominioId, m.condominioId)))
    .limit(1)
  if (!orc) throw new Error('Orçamento não encontrado')

  const inicioAno = new Date(orc.ano, 0, 1)
  const fimAno = new Date(orc.ano + 1, 0, 1)

  const movimentosAno = await db
    .select({
      tipo: movimento.tipo,
      categoria: movimento.categoria,
      valor: movimento.valor,
    })
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        eq(movimento.destino, 'geral'),
        isNull(movimento.deletedAt),
        gte(movimento.data, inicioAno),
        lt(movimento.data, fimAno),
      ),
    )

  const receitasReais = movimentosAno
    .filter((mv) => mv.tipo === 'receita')
    .reduce((s, mv) => s + Number(mv.valor), 0)
  const despesasReais = movimentosAno
    .filter((mv) => mv.tipo === 'despesa')
    .reduce((s, mv) => s + Number(mv.valor), 0)

  const despesasPorCategoriaMap = new Map<string, number>()
  for (const mv of movimentosAno) {
    if (mv.tipo !== 'despesa') continue
    despesasPorCategoriaMap.set(
      mv.categoria,
      (despesasPorCategoriaMap.get(mv.categoria) ?? 0) + Number(mv.valor),
    )
  }
  const despesasPorCategoria = Array.from(despesasPorCategoriaMap, ([categoria, valor]) => ({
    categoria,
    valor,
  })).sort((a, b) => b.valor - a.valor)

  const previsto = Number(orc.valorAnual)
  const desvio = despesasReais - previsto
  const desvioPercent = previsto > 0 ? (desvio / previsto) * 100 : null

  // Cruza o executado por categoria (já calculado acima) com o orçamentado
  // por rubrica (Fase A.2, G08) — inclui também categorias com despesa real
  // mas sem rubrica correspondente, para não esconder nenhum valor lançado.
  const rubricasRegistadas = await db
    .select()
    .from(orcamentoRubrica)
    .where(eq(orcamentoRubrica.orcamentoId, orcamentoId))
    .orderBy(desc(orcamentoRubrica.valorOrcamentado))

  const categoriasComRubrica = new Set(rubricasRegistadas.map((r) => r.categoria))
  const rubricas = [
    ...rubricasRegistadas.map((r) => {
      const valorOrcamentadoRubrica = Number(r.valorOrcamentado)
      const valorReal = despesasPorCategoriaMap.get(r.categoria) ?? 0
      const desvioRubrica = valorReal - valorOrcamentadoRubrica
      return {
        id: r.id,
        categoria: r.categoria,
        valorOrcamentado: valorOrcamentadoRubrica,
        valorReal,
        desvio: desvioRubrica,
        desvioPercent: valorOrcamentadoRubrica > 0 ? (desvioRubrica / valorOrcamentadoRubrica) * 100 : null,
      }
    }),
    ...despesasPorCategoria
      .filter((d) => !categoriasComRubrica.has(d.categoria))
      .map((d) => ({
        id: null,
        categoria: d.categoria,
        valorOrcamentado: null,
        valorReal: d.valor,
        desvio: null,
        desvioPercent: null,
      })),
  ]
  const somaRubricas = rubricasRegistadas.reduce((s, r) => s + Number(r.valorOrcamentado), 0)

  return {
    orcamento: { id: orc.id, ano: orc.ano, valorAnual: previsto, notas: orc.notas },
    receitasReais,
    despesasReais,
    saldoReal: receitasReais - despesasReais,
    despesasPorCategoria,
    desvio,
    desvioPercent,
    rubricas,
    somaRubricas,
  }
}

export async function eliminarOrcamento(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(orcamento)
    .where(and(eq(orcamento.id, id), eq(orcamento.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'orcamento',
    entidadeId: id,
  })

  revalidatePath('/financas')
}

export async function getOrcamentoRubricas(orcamentoId: number) {
  const m = await requireAcessoFinanceiro()

  const [orc] = await db
    .select({ id: orcamento.id })
    .from(orcamento)
    .where(and(eq(orcamento.id, orcamentoId), eq(orcamento.condominioId, m.condominioId)))
    .limit(1)
  if (!orc) throw new Error('Orçamento não encontrado')

  return db
    .select()
    .from(orcamentoRubrica)
    .where(eq(orcamentoRubrica.orcamentoId, orcamentoId))
    .orderBy(desc(orcamentoRubrica.valorOrcamentado))
}

/**
 * A soma das rubricas ultrapassar o valor anual do orçamento não é
 * bloqueado — pode haver margem deliberada (docs/product/
 * MBD_GEST_GAP_ANALYSIS.md secção 7.4). `avisoExcedeOrcamento` informa a
 * UI para mostrar um aviso, não um erro.
 */
export async function criarOrcamentoRubrica(formData: FormData) {
  const admin = await requireAdmin()

  const orcamentoId = Number(formData.get('orcamentoId'))
  const categoria = String(formData.get('categoria') || '').trim()
  const valorOrcamentado = String(formData.get('valorOrcamentado') || '').trim()

  if (!categoria) throw new Error('Indique a categoria da rubrica')
  if (!valorOrcamentado || Number(valorOrcamentado) <= 0) {
    throw new Error('Indique um valor orçamentado válido')
  }

  const [orc] = await db
    .select({ id: orcamento.id, valorAnual: orcamento.valorAnual })
    .from(orcamento)
    .where(and(eq(orcamento.id, orcamentoId), eq(orcamento.condominioId, admin.condominioId)))
    .limit(1)
  if (!orc) throw new Error('Orçamento não encontrado')

  const existentes = await db
    .select({ valorOrcamentado: orcamentoRubrica.valorOrcamentado })
    .from(orcamentoRubrica)
    .where(eq(orcamentoRubrica.orcamentoId, orcamentoId))
  const somaAtual = existentes.reduce((s, r) => s + Number(r.valorOrcamentado), 0)
  const avisoExcedeOrcamento = somaAtual + Number(valorOrcamentado) > Number(orc.valorAnual)

  const [nova] = await db
    .insert(orcamentoRubrica)
    .values({ orcamentoId, categoria, valorOrcamentado })
    .returning({ id: orcamentoRubrica.id })

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'orcamento',
    entidadeId: orcamentoId,
    detalhes: `Rubrica criada: ${categoria} — ${valorOrcamentado} €`,
  })

  revalidatePath('/financas')
  return { id: nova.id, avisoExcedeOrcamento }
}

export async function eliminarOrcamentoRubrica(id: number) {
  const admin = await requireAdmin()

  const [rubrica] = await db
    .select({ id: orcamentoRubrica.id, categoria: orcamentoRubrica.categoria, orcamentoId: orcamentoRubrica.orcamentoId })
    .from(orcamentoRubrica)
    .innerJoin(orcamento, eq(orcamentoRubrica.orcamentoId, orcamento.id))
    .where(and(eq(orcamentoRubrica.id, id), eq(orcamento.condominioId, admin.condominioId)))
    .limit(1)
  if (!rubrica) throw new Error('Rubrica não encontrada')

  await db.delete(orcamentoRubrica).where(eq(orcamentoRubrica.id, id))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'orcamento',
    entidadeId: rubrica.orcamentoId,
    detalhes: `Rubrica eliminada: ${rubrica.categoria}`,
  })

  revalidatePath('/financas')
}
