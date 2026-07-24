'use server'

import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { contaFinanceira, exercicioFinanceiro, extratoBancario, movimento, saldoInicialConta } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { calcularSaldoConta, formatarLogOperacaoMassa, mensagemErroSobreposicaoExercicio } from '@/lib/contas-financeiras'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, asc, count, desc, eq, gte, isNull, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getExercicios() {
  const m = await requireAcessoFinanceiro()
  return db
    .select()
    .from(exercicioFinanceiro)
    .where(eq(exercicioFinanceiro.condominioId, m.condominioId))
    .orderBy(desc(exercicioFinanceiro.dataInicio))
}

export async function criarExercicio(formData: FormData) {
  const admin = await requireAdmin()

  const designacao = String(formData.get('designacao') || '').trim()
  const anoPrincipal = Number(formData.get('anoPrincipal'))
  const dataInicioStr = String(formData.get('dataInicio') || '')
  const dataFimStr = String(formData.get('dataFim') || '')

  if (!designacao || !anoPrincipal || !dataInicioStr || !dataFimStr) {
    throw new Error('Preencha todos os campos obrigatórios')
  }
  const dataInicio = new Date(dataInicioStr)
  const dataFim = new Date(dataFimStr)
  if (dataFim <= dataInicio) {
    throw new Error('A data de fim tem de ser posterior à data de início')
  }

  let novoId: number
  try {
    const [novo] = await db
      .insert(exercicioFinanceiro)
      .values({ condominioId: admin.condominioId, designacao, anoPrincipal, dataInicio, dataFim })
      .returning({ id: exercicioFinanceiro.id })
    novoId = novo.id
  } catch (e) {
    throw new Error(mensagemErroSobreposicaoExercicio(e) ?? 'Não foi possível criar o exercício')
  }

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'exercicioFinanceiro',
    entidadeId: novoId,
    detalhes: `Exercício "${designacao}" (${dataInicioStr} a ${dataFimStr})`,
  })

  revalidatePath('/financas')
  return novoId
}

/**
 * Exercício imediatamente anterior a `exercicioId`, sem intervalo entre os
 * dois (dataFim do anterior = dataInicio deste − 1 dia) e já fechado — só
 * nesse caso é que faz sentido propor transporte automático de saldo. Um
 * exercício mais antigo mas com um "buraco" no meio, ou ainda aberto, não
 * é proposto — o administrador define o saldo inicial manualmente.
 */
async function getExercicioAnteriorContiguo(condominioId: number, exercicioId: number) {
  const [atual] = await db
    .select()
    .from(exercicioFinanceiro)
    .where(and(eq(exercicioFinanceiro.id, exercicioId), eq(exercicioFinanceiro.condominioId, condominioId)))
    .limit(1)
  if (!atual) return null

  const diaAnterior = new Date(atual.dataInicio)
  diaAnterior.setUTCDate(diaAnterior.getUTCDate() - 1)

  const [anterior] = await db
    .select()
    .from(exercicioFinanceiro)
    .where(
      and(
        eq(exercicioFinanceiro.condominioId, condominioId),
        eq(exercicioFinanceiro.dataFim, diaAnterior),
        eq(exercicioFinanceiro.estado, 'fechado'),
      ),
    )
    .limit(1)
  return anterior ?? null
}

/**
 * Passo de revisão do transporte de saldos — nunca executado
 * silenciosamente. Devolve, por conta ativa, o saldo final apurado no
 * exercício anterior contíguo (se existir e estiver fechado) e se essa
 * conta já tem saldo inicial definido neste exercício (nesse caso não é
 * proposta — nunca se substitui um saldo já definido em silêncio).
 */
export async function revisaoTransporteSaldos(exercicioId: number) {
  const m = await requireAcessoFinanceiro()
  const anterior = await getExercicioAnteriorContiguo(m.condominioId, exercicioId)
  if (!anterior) {
    return { exercicioAnterior: null, contas: [] as never[] }
  }

  const contas = await db
    .select()
    .from(contaFinanceira)
    .where(and(eq(contaFinanceira.condominioId, m.condominioId), eq(contaFinanceira.estado, 'ativa')))
    .orderBy(asc(contaFinanceira.nome))

  const linhas = await Promise.all(
    contas.map(async (c) => {
      const [jaTemSaldo] = await db
        .select()
        .from(saldoInicialConta)
        .where(and(eq(saldoInicialConta.contaFinanceiraId, c.id), eq(saldoInicialConta.exercicioId, exercicioId)))
        .limit(1)
      const { saldo, movimentosSemDataLiquidacao } = await calcularSaldoConta(c.id, anterior.id)
      return {
        contaFinanceiraId: c.id,
        nome: c.nome,
        saldoFinalAnterior: saldo,
        avisoDadosIncompletos: movimentosSemDataLiquidacao.length > 0,
        jaTemSaldoDefinido: Boolean(jaTemSaldo),
      }
    }),
  )

  return {
    exercicioAnterior: { id: anterior.id, designacao: anterior.designacao },
    contas: linhas,
  }
}

/**
 * Confirma o transporte para as contas indicadas em `contaFinanceiraIds`
 * (tipicamente o resultado de `revisaoTransporteSaldos` menos as contas
 * que o utilizador excluiu). Nunca substitui um saldo inicial já
 * existente — ignora silenciosamente essas contas (já reportadas como
 * "jaTemSaldoDefinido" no passo de revisão, para o utilizador decidir
 * antes de chegar aqui).
 */
export async function confirmarTransporteSaldos(exercicioId: number, contaFinanceiraIds: number[]) {
  const admin = await requireAdmin()
  const anterior = await getExercicioAnteriorContiguo(admin.condominioId, exercicioId)
  if (!anterior) throw new Error('Não há exercício anterior contíguo para transportar saldo')

  const operacaoId = randomUUID()
  const idsContasTransportadas: number[] = []
  for (const contaFinanceiraId of contaFinanceiraIds) {
    const [conta] = await db
      .select()
      .from(contaFinanceira)
      .where(and(eq(contaFinanceira.id, contaFinanceiraId), eq(contaFinanceira.condominioId, admin.condominioId)))
      .limit(1)
    if (!conta) continue

    const [existente] = await db
      .select()
      .from(saldoInicialConta)
      .where(and(eq(saldoInicialConta.contaFinanceiraId, contaFinanceiraId), eq(saldoInicialConta.exercicioId, exercicioId)))
      .limit(1)
    if (existente) continue // nunca substituir silenciosamente

    const { saldo } = await calcularSaldoConta(contaFinanceiraId, anterior.id)
    await db.insert(saldoInicialConta).values({
      condominioId: admin.condominioId,
      contaFinanceiraId,
      exercicioId,
      valor: saldo.toFixed(2),
      origem: 'transportado',
      definidoPorUserId: admin.userId,
    })
    idsContasTransportadas.push(contaFinanceiraId)
  }

  if (idsContasTransportadas.length > 0) {
    await registarAuditoria({
      actor: admin,
      acao: 'atualizar',
      entidade: 'exercicioFinanceiro',
      entidadeId: exercicioId,
      detalhes: formatarLogOperacaoMassa({
        operacaoId,
        tipo: 'transporte-saldos',
        descricao: `Saldo transportado de "${anterior.designacao}" para ${idsContasTransportadas.length} conta(s)`,
        nomeEntidades: 'IDs de contas',
        ids: idsContasTransportadas,
      }),
    })
  }

  revalidatePath('/financas')
  return idsContasTransportadas.length
}

type SituacaoFecho = {
  bloqueios: string[]
  avisos: string[]
  resumo: {
    numMovimentos: number
    totalReceitas: number
    totalDespesas: number
    saldosPorConta: { nome: string; saldo: number }[]
  }
}

/**
 * Passo de revisão antes de fechar um exercício — nunca fechado num só
 * clique. `bloqueios` impedem o fecho (erro de integridade); `avisos` só
 * exigem confirmação explícita do administrador (situações operacionais
 * normais, ex. reconciliação bancária incompleta, que não podem tornar a
 * aplicação inutilizável).
 */
export async function prepararFechoExercicio(exercicioId: number): Promise<SituacaoFecho> {
  const m = await requireAcessoFinanceiro()
  const [ex] = await db
    .select()
    .from(exercicioFinanceiro)
    .where(and(eq(exercicioFinanceiro.id, exercicioId), eq(exercicioFinanceiro.condominioId, m.condominioId)))
    .limit(1)
  if (!ex) throw new Error('Exercício não encontrado')

  const bloqueios: string[] = []
  const avisos: string[] = []

  const movimentosPeriodo = await db
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        isNull(movimento.deletedAt),
        gte(movimento.data, ex.dataInicio),
        lte(movimento.data, ex.dataFim),
      ),
    )

  const pagosSemConta = movimentosPeriodo.filter((mv) => mv.pago && !mv.contaFinanceiraId)
  const pagosSemDataLiquidacao = movimentosPeriodo.filter((mv) => mv.pago && !mv.dataLiquidacao)
  const semExercicio = movimentosPeriodo.filter((mv) => !mv.exercicioId)
  const pendentes = movimentosPeriodo.filter((mv) => !mv.pago)

  if (pagosSemConta.length > 0) {
    avisos.push(`${pagosSemConta.length} movimento(s) pago(s) sem conta financeira associada.`)
  }
  if (pagosSemDataLiquidacao.length > 0) {
    avisos.push(`${pagosSemDataLiquidacao.length} movimento(s) pago(s) sem data de liquidação registada.`)
  }
  if (semExercicio.length > 0) {
    avisos.push(`${semExercicio.length} movimento(s) deste período ainda não associado(s) a este exercício.`)
  }
  if (pendentes.length > 0) {
    avisos.push(`${pendentes.length} movimento(s) ainda pendente(s) de pagamento neste período.`)
  }

  const linhasPorConciliar = await db
    .select()
    .from(extratoBancario)
    .where(
      and(
        eq(extratoBancario.condominioId, m.condominioId),
        isNull(extratoBancario.conciliadoMovimentoId),
        eq(extratoBancario.ignorado, false),
        gte(extratoBancario.data, ex.dataInicio),
        lte(extratoBancario.data, ex.dataFim),
      ),
    )
  if (linhasPorConciliar.length > 0) {
    avisos.push(`${linhasPorConciliar.length} linha(s) de extrato bancário deste período ainda por reconciliar.`)
  }

  const contasAtivas = await db
    .select()
    .from(contaFinanceira)
    .where(and(eq(contaFinanceira.condominioId, m.condominioId), eq(contaFinanceira.estado, 'ativa')))

  const saldosPorConta: { nome: string; saldo: number }[] = []
  let semSaldoInicial = 0
  for (const conta of contasAtivas) {
    try {
      const { saldo, saldoInicialOrigem } = await calcularSaldoConta(conta.id, exercicioId)
      if (!saldoInicialOrigem) semSaldoInicial++
      saldosPorConta.push({ nome: conta.nome, saldo })
    } catch {
      bloqueios.push(`Não foi possível calcular o saldo da conta "${conta.nome}" — verifique os seus movimentos.`)
    }
  }
  if (semSaldoInicial > 0) {
    avisos.push(`${semSaldoInicial} conta(s) ativa(s) sem saldo inicial definido neste exercício (considerado 0).`)
  }

  const totalReceitas = movimentosPeriodo
    .filter((mv) => mv.tipo === 'receita')
    .reduce((s, mv) => s + Number(mv.valor), 0)
  const totalDespesas = movimentosPeriodo
    .filter((mv) => mv.tipo === 'despesa')
    .reduce((s, mv) => s + Number(mv.valor), 0)

  return {
    bloqueios,
    avisos,
    resumo: { numMovimentos: movimentosPeriodo.length, totalReceitas, totalDespesas, saldosPorConta },
  }
}

export async function fecharExercicio(exercicioId: number, avisosConfirmados: boolean) {
  const admin = await requireAdmin()
  const [ex] = await db
    .select()
    .from(exercicioFinanceiro)
    .where(and(eq(exercicioFinanceiro.id, exercicioId), eq(exercicioFinanceiro.condominioId, admin.condominioId)))
    .limit(1)
  if (!ex) throw new Error('Exercício não encontrado')
  if (ex.estado === 'fechado') throw new Error('Este exercício já está fechado')

  const situacao = await prepararFechoExercicio(exercicioId)
  if (situacao.bloqueios.length > 0) {
    throw new Error(situacao.bloqueios[0])
  }
  if (situacao.avisos.length > 0 && !avisosConfirmados) {
    throw new Error('Confirme que tomou conhecimento das situações pendentes antes de fechar.')
  }

  await db
    .update(exercicioFinanceiro)
    .set({ estado: 'fechado', fechadoEm: new Date(), fechadoPorUserId: admin.userId, updatedAt: new Date() })
    .where(eq(exercicioFinanceiro.id, exercicioId))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'exercicioFinanceiro',
    entidadeId: exercicioId,
    detalhes:
      `Exercício "${ex.designacao}" fechado — ${situacao.resumo.numMovimentos} movimento(s), ` +
      `receitas ${situacao.resumo.totalReceitas.toFixed(2)} €, despesas ${situacao.resumo.totalDespesas.toFixed(2)} €` +
      (situacao.avisos.length > 0
        ? `. Avisos confirmados pelo administrador: ${situacao.avisos.join(' | ')}`
        : ''),
  })

  revalidatePath('/financas')
}

export async function reabrirExercicio(exercicioId: number, motivo: string) {
  const admin = await requireAdmin()
  if (!motivo.trim()) throw new Error('Indique o motivo da reabertura')

  const [ex] = await db
    .select()
    .from(exercicioFinanceiro)
    .where(and(eq(exercicioFinanceiro.id, exercicioId), eq(exercicioFinanceiro.condominioId, admin.condominioId)))
    .limit(1)
  if (!ex) throw new Error('Exercício não encontrado')
  if (ex.estado === 'aberto') throw new Error('Este exercício já está aberto')

  await db
    .update(exercicioFinanceiro)
    .set({ estado: 'aberto', fechadoEm: null, fechadoPorUserId: null, updatedAt: new Date() })
    .where(eq(exercicioFinanceiro.id, exercicioId))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'exercicioFinanceiro',
    entidadeId: exercicioId,
    detalhes: `Exercício "${ex.designacao}" reaberto — motivo: ${motivo.trim()}`,
  })

  revalidatePath('/financas')
}

/**
 * Pré-visualização (sem alterar dados) dos movimentos do condomínio ainda
 * sem `exercicioId` cuja data caia dentro do período de `exercicioId` —
 * nunca associar em massa sem o utilizador ver antes o que vai ser
 * afetado.
 */
export async function previsualizarAssociacaoExercicio(exercicioId: number) {
  const m = await requireAcessoFinanceiro()
  const [ex] = await db
    .select()
    .from(exercicioFinanceiro)
    .where(and(eq(exercicioFinanceiro.id, exercicioId), eq(exercicioFinanceiro.condominioId, m.condominioId)))
    .limit(1)
  if (!ex) throw new Error('Exercício não encontrado')
  if (ex.estado === 'fechado') {
    throw new Error(
      'Este exercício está fechado. Para associar movimentos, reabra primeiro o exercício e indique o motivo.',
    )
  }

  const candidatos = await db
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        isNull(movimento.exercicioId),
        isNull(movimento.deletedAt),
        gte(movimento.data, ex.dataInicio),
        lte(movimento.data, ex.dataFim),
      ),
    )
    .orderBy(asc(movimento.data))

  const totalReceitas = candidatos.filter((mv) => mv.tipo === 'receita').reduce((s, mv) => s + Number(mv.valor), 0)
  const totalDespesas = candidatos.filter((mv) => mv.tipo === 'despesa').reduce((s, mv) => s + Number(mv.valor), 0)

  return {
    total: candidatos.length,
    totalReceitas,
    totalDespesas,
    amostra: candidatos.slice(0, 5).map((mv) => ({
      id: mv.id,
      data: mv.data,
      categoria: mv.categoria,
      descricao: mv.descricao,
      valor: mv.valor,
      tipo: mv.tipo,
    })),
  }
}

export async function confirmarAssociacaoExercicio(exercicioId: number) {
  const admin = await requireAdmin()
  const [ex] = await db
    .select()
    .from(exercicioFinanceiro)
    .where(and(eq(exercicioFinanceiro.id, exercicioId), eq(exercicioFinanceiro.condominioId, admin.condominioId)))
    .limit(1)
  if (!ex) throw new Error('Exercício não encontrado')
  if (ex.estado === 'fechado') {
    throw new Error(
      'Este exercício está fechado. Para associar movimentos, reabra primeiro o exercício e indique o motivo.',
    )
  }

  const operacaoId = randomUUID()
  const afetados = await db
    .update(movimento)
    .set({ exercicioId })
    .where(
      and(
        eq(movimento.condominioId, admin.condominioId),
        isNull(movimento.exercicioId),
        isNull(movimento.deletedAt),
        gte(movimento.data, ex.dataInicio),
        lte(movimento.data, ex.dataFim),
      ),
    )
    .returning({ id: movimento.id })

  const [{ porClassificar }] = await db
    .select({ porClassificar: count() })
    .from(movimento)
    .where(
      and(eq(movimento.condominioId, admin.condominioId), isNull(movimento.exercicioId), isNull(movimento.deletedAt)),
    )

  if (afetados.length > 0) {
    await registarAuditoria({
      actor: admin,
      acao: 'atualizar',
      entidade: 'exercicioFinanceiro',
      entidadeId: exercicioId,
      detalhes: formatarLogOperacaoMassa({
        operacaoId,
        tipo: 'associacao-exercicio',
        descricao: `${afetados.length} movimento(s) associado(s) automaticamente ao exercício "${ex.designacao}"`,
        nomeEntidades: 'IDs de movimentos',
        ids: afetados.map((m) => m.id),
      }),
    })
  }

  revalidatePath('/financas')
  return { associados: afetados.length, porClassificar }
}
