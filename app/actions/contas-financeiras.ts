'use server'

import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { contaFinanceira, exercicioFinanceiro, movimento, saldoInicialConta } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import {
  calcularSaldoConta,
  formatarLogOperacaoMassa,
  ibanValido,
  idsForaDeExercicioFechado,
  normalizarIban,
} from '@/lib/contas-financeiras'
import { requireAcessoFinanceiro, requireAdmin, temConsultaGestao } from '@/lib/session'
import { and, asc, count, eq, inArray, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const TIPOS_CONTA = ['ordem', 'prazo', 'caixa', 'transitoria'] as const

type CamposEditaveisConta = {
  nome: string
  banco: string | null
  iban: string | null
  tipo: string
  moeda: string
  notaTransitoria: string | null
}

const CAMPO_CONTA_LABEL: Record<keyof CamposEditaveisConta, string> = {
  nome: 'nome',
  banco: 'banco',
  iban: 'IBAN',
  tipo: 'tipo',
  moeda: 'moeda',
  notaTransitoria: 'nota',
}

function validarDadosConta({
  nome,
  tipo,
  iban,
  notaTransitoria,
}: {
  nome: string
  tipo: string
  iban: string
  notaTransitoria: string
}) {
  if (!nome) throw new Error('Preencha o nome da conta')
  if (!(TIPOS_CONTA as readonly string[]).includes(tipo)) throw new Error('Tipo de conta inválido')
  if (tipo === 'caixa' && iban) throw new Error('Uma conta de caixa não tem IBAN')
  if (tipo === 'transitoria' && !notaTransitoria) {
    throw new Error('Indique o motivo desta conta temporária ou de transição')
  }
  if (iban && !ibanValido(iban)) {
    throw new Error('O IBAN indicado não é válido — confirme se foi copiado corretamente')
  }
}

export async function getContasFinanceiras() {
  const m = await requireAcessoFinanceiro()
  const linhas = await db
    .select()
    .from(contaFinanceira)
    .where(eq(contaFinanceira.condominioId, m.condominioId))
    .orderBy(asc(contaFinanceira.nome))

  // IBAN e nota interna só para quem gere/audita — mesmo padrão de
  // minimização já usado para contactos pessoais (SECURITY_AUDIT.md S13).
  // O nome do banco não é sensível da mesma forma, mostra-se a todos com
  // acesso financeiro.
  if (temConsultaGestao(m)) return linhas
  return linhas.map((c) => ({ ...c, iban: null, notaTransitoria: null }))
}

export async function criarContaFinanceira(formData: FormData) {
  const admin = await requireAdmin()

  const nome = String(formData.get('nome') || '').trim()
  const banco = String(formData.get('banco') || '').trim()
  const ibanRaw = String(formData.get('iban') || '').trim()
  const iban = ibanRaw ? normalizarIban(ibanRaw) : ''
  const tipo = String(formData.get('tipo') || '')
  const moeda = String(formData.get('moeda') || 'EUR').trim() || 'EUR'
  const notaTransitoria = String(formData.get('notaTransitoria') || '').trim()
  const dataAberturaStr = String(formData.get('dataAbertura') || '').trim()
  // Saldo inicial opcional na própria criação — pedido no mesmo passo para
  // não obrigar a voltar mais tarde só para isto (ver docs/product/
  // MBD_GEST_GAP_ANALYSIS.md, princípio de simplicidade). Só se aplica se
  // já existir pelo menos um exercício aberto.
  const exercicioIdRaw = String(formData.get('exercicioId') || '').trim()
  const saldoInicialStr = String(formData.get('saldoInicial') || '').trim()

  validarDadosConta({ nome, tipo, iban, notaTransitoria })

  let exercicioAberto: { id: number; designacao: string } | null = null
  if (exercicioIdRaw) {
    const [ex] = await db
      .select({ id: exercicioFinanceiro.id, designacao: exercicioFinanceiro.designacao, estado: exercicioFinanceiro.estado })
      .from(exercicioFinanceiro)
      .where(
        and(eq(exercicioFinanceiro.id, Number(exercicioIdRaw)), eq(exercicioFinanceiro.condominioId, admin.condominioId)),
      )
      .limit(1)
    if (ex && ex.estado === 'aberto') exercicioAberto = ex
  }

  const novaId = await db.transaction(async (tx) => {
    const [nova] = await tx
      .insert(contaFinanceira)
      .values({
        condominioId: admin.condominioId,
        nome,
        banco: banco || null,
        iban: iban || null,
        tipo,
        moeda,
        notaTransitoria: notaTransitoria || null,
        dataAbertura: dataAberturaStr ? new Date(dataAberturaStr) : null,
      })
      .returning({ id: contaFinanceira.id })

    if (exercicioAberto && saldoInicialStr) {
      await tx.insert(saldoInicialConta).values({
        condominioId: admin.condominioId,
        contaFinanceiraId: nova.id,
        exercicioId: exercicioAberto.id,
        valor: saldoInicialStr,
        origem: 'manual',
        definidoPorUserId: admin.userId,
      })
    }

    return nova.id
  })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'contaFinanceira',
    entidadeId: novaId,
    detalhes:
      `${nome} (${tipo})` +
      (exercicioAberto && saldoInicialStr
        ? ` — saldo inicial (${exercicioAberto.designacao}): ${saldoInicialStr} €`
        : ''),
  })

  revalidatePath('/financas')
  return novaId
}

export async function atualizarContaFinanceira(formData: FormData) {
  const admin = await requireAdmin()

  const id = Number(formData.get('id'))
  const nome = String(formData.get('nome') || '').trim()
  const banco = String(formData.get('banco') || '').trim()
  const ibanRaw = String(formData.get('iban') || '').trim()
  const iban = ibanRaw ? normalizarIban(ibanRaw) : ''
  const tipo = String(formData.get('tipo') || '')
  const moeda = String(formData.get('moeda') || 'EUR').trim() || 'EUR'
  const notaTransitoria = String(formData.get('notaTransitoria') || '').trim()

  validarDadosConta({ nome, tipo, iban, notaTransitoria })

  const novosValores: CamposEditaveisConta = {
    nome,
    banco: banco || null,
    iban: iban || null,
    tipo,
    moeda,
    notaTransitoria: notaTransitoria || null,
  }

  // Uma transação simples confina, mas não elimina totalmente, a janela
  // entre leitura e escrita de duas edições concorrentes na mesma conta —
  // aceitável aqui; não introduz bloqueio explícito nem controlo de versão.
  const camposAlterados = await db.transaction(async (tx) => {
    const [anterior] = await tx
      .select({
        nome: contaFinanceira.nome,
        banco: contaFinanceira.banco,
        iban: contaFinanceira.iban,
        tipo: contaFinanceira.tipo,
        moeda: contaFinanceira.moeda,
        notaTransitoria: contaFinanceira.notaTransitoria,
      })
      .from(contaFinanceira)
      .where(and(eq(contaFinanceira.id, id), eq(contaFinanceira.condominioId, admin.condominioId)))
      .limit(1)
    if (!anterior) throw new Error('Conta não encontrada')

    const alterados = (Object.keys(novosValores) as (keyof CamposEditaveisConta)[]).filter(
      (campo) => anterior[campo] !== novosValores[campo],
    )
    if (alterados.length === 0) return alterados

    await tx
      .update(contaFinanceira)
      .set({ ...novosValores, updatedAt: new Date() })
      .where(and(eq(contaFinanceira.id, id), eq(contaFinanceira.condominioId, admin.condominioId)))

    return alterados
  })

  if (camposAlterados.length > 0) {
    const ibanAlterado = camposAlterados.includes('iban')
    await registarAuditoria({
      actor: admin,
      acao: 'atualizar',
      entidade: 'contaFinanceira',
      entidadeId: id,
      detalhes:
        `Campos alterados: ${camposAlterados.map((c) => CAMPO_CONTA_LABEL[c]).join(', ')}` +
        (ibanAlterado ? '. IBAN alterado; valor não registado.' : '.'),
    })
  }

  revalidatePath('/financas')
}

/**
 * Encerra uma conta financeira. Só permitido com saldo zero no exercício
 * indicado — nesta fase não há mecanismo de transferência formal entre
 * contas (proposto para o incremento seguinte), por isso não existe
 * exceção de encerramento forçado: o administrador regulariza o saldo
 * (lançando/corrigindo movimentos) antes de conseguir encerrar. A conta
 * encerrada continua visível no histórico e deixa de aceitar novos
 * movimentos (validado em app/actions/financas.ts).
 */
export async function encerrarContaFinanceira(id: number, exercicioId: number) {
  const admin = await requireAdmin()

  const [conta] = await db
    .select()
    .from(contaFinanceira)
    .where(and(eq(contaFinanceira.id, id), eq(contaFinanceira.condominioId, admin.condominioId)))
    .limit(1)
  if (!conta) throw new Error('Conta não encontrada')
  if (conta.estado === 'encerrada') throw new Error('Esta conta já está encerrada')

  const { saldo } = await calcularSaldoConta(id, exercicioId)
  if (Math.abs(saldo) > 0.005) {
    throw new Error(
      `Esta conta ainda tem ${saldo.toFixed(2)} € de saldo — regularize ou transfira o valor para outra conta antes de a encerrar.`,
    )
  }

  await db
    .update(contaFinanceira)
    .set({ estado: 'encerrada', dataEncerramento: new Date(), updatedAt: new Date() })
    .where(eq(contaFinanceira.id, id))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'contaFinanceira',
    entidadeId: id,
    detalhes: 'Conta encerrada com saldo zero',
  })

  revalidatePath('/financas')
}

/** Saldo de cada conta (ativa e encerrada) num dado exercício, para a UI. */
export async function getSaldosContas(exercicioId: number) {
  const m = await requireAcessoFinanceiro()

  const [ex] = await db
    .select()
    .from(exercicioFinanceiro)
    .where(and(eq(exercicioFinanceiro.id, exercicioId), eq(exercicioFinanceiro.condominioId, m.condominioId)))
    .limit(1)
  if (!ex) throw new Error('Exercício não encontrado')

  const contas = await db
    .select()
    .from(contaFinanceira)
    .where(eq(contaFinanceira.condominioId, m.condominioId))
    .orderBy(asc(contaFinanceira.nome))

  const veGestao = temConsultaGestao(m)

  return Promise.all(
    contas.map(async (c) => {
      const { saldo, saldoInicial, saldoInicialOrigem, movimentosSemDataLiquidacao } = await calcularSaldoConta(
        c.id,
        exercicioId,
      )
      return {
        id: c.id,
        nome: c.nome,
        tipo: c.tipo,
        moeda: c.moeda,
        estado: c.estado,
        banco: c.banco,
        iban: veGestao ? c.iban : null,
        notaTransitoria: veGestao ? c.notaTransitoria : null,
        saldoInicial,
        saldoInicialOrigem,
        saldo,
        movimentosSemDataLiquidacao: movimentosSemDataLiquidacao.length,
      }
    }),
  )
}

/**
 * Define ou corrige o saldo inicial de uma conta num exercício aberto —
 * sempre uma operação explícita e auditada (valor anterior → novo),
 * mesmo quando corrige um valor que tinha sido transportado
 * automaticamente.
 */
export async function definirSaldoInicial(formData: FormData) {
  const admin = await requireAdmin()

  const contaFinanceiraId = Number(formData.get('contaFinanceiraId'))
  const exercicioId = Number(formData.get('exercicioId'))
  const valor = String(formData.get('valor') || '0')

  const [ex] = await db
    .select()
    .from(exercicioFinanceiro)
    .where(
      and(eq(exercicioFinanceiro.id, exercicioId), eq(exercicioFinanceiro.condominioId, admin.condominioId)),
    )
    .limit(1)
  if (!ex) throw new Error('Exercício não encontrado')
  if (ex.estado === 'fechado') {
    throw new Error(
      'Este exercício está fechado. Para alterar o saldo inicial, reabra primeiro o exercício e indique o motivo.',
    )
  }

  const [conta] = await db
    .select()
    .from(contaFinanceira)
    .where(and(eq(contaFinanceira.id, contaFinanceiraId), eq(contaFinanceira.condominioId, admin.condominioId)))
    .limit(1)
  if (!conta) throw new Error('Conta não encontrada')

  const [existente] = await db
    .select()
    .from(saldoInicialConta)
    .where(
      and(
        eq(saldoInicialConta.contaFinanceiraId, contaFinanceiraId),
        eq(saldoInicialConta.exercicioId, exercicioId),
      ),
    )
    .limit(1)

  if (existente) {
    const valorAnterior = existente.valor
    await db
      .update(saldoInicialConta)
      .set({ valor, origem: 'manual', definidoPorUserId: admin.userId, updatedAt: new Date() })
      .where(eq(saldoInicialConta.id, existente.id))
    await registarAuditoria({
      actor: admin,
      acao: 'atualizar',
      entidade: 'contaFinanceira',
      entidadeId: contaFinanceiraId,
      detalhes: `Saldo inicial (${ex.designacao}) corrigido: de ${valorAnterior} € para ${valor} €`,
    })
  } else {
    await db.insert(saldoInicialConta).values({
      condominioId: admin.condominioId,
      contaFinanceiraId,
      exercicioId,
      valor,
      origem: 'manual',
      definidoPorUserId: admin.userId,
    })
    await registarAuditoria({
      actor: admin,
      acao: 'criar',
      entidade: 'contaFinanceira',
      entidadeId: contaFinanceiraId,
      detalhes: `Saldo inicial (${ex.designacao}) definido: ${valor} €`,
    })
  }

  revalidatePath('/financas')
}

/**
 * Pré-visualização (sem alterar dados) dos movimentos do condomínio com o
 * `destino` indicado, ainda sem `contaFinanceiraId`.
 */
export async function previsualizarAssociacaoConta(destino: string) {
  const m = await requireAcessoFinanceiro()
  if (destino !== 'geral' && destino !== 'reserva') throw new Error('Destino inválido')

  const todosCandidatos = await db
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        eq(movimento.destino, destino),
        isNull(movimento.contaFinanceiraId),
        isNull(movimento.deletedAt),
      ),
    )
    .orderBy(asc(movimento.data))

  // Movimentos dentro de um exercício já fechado não são associados —
  // mesma regra de "exercício fechado bloqueia alterações" aplicada a
  // operações em massa (ver docs/product/MBD_GEST_GAP_ANALYSIS.md).
  const bloqueados = await idsForaDeExercicioFechado(m.condominioId, todosCandidatos)
  const candidatos = todosCandidatos.filter((mv) => !bloqueados.has(mv.id))

  const totalReceitas = candidatos.filter((mv) => mv.tipo === 'receita').reduce((s, mv) => s + Number(mv.valor), 0)
  const totalDespesas = candidatos.filter((mv) => mv.tipo === 'despesa').reduce((s, mv) => s + Number(mv.valor), 0)

  return {
    total: candidatos.length,
    totalReceitas,
    totalDespesas,
    ignoradosPorExercicioFechado: bloqueados.size,
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

export async function confirmarAssociacaoConta(contaFinanceiraId: number, destino: string) {
  const admin = await requireAdmin()
  if (destino !== 'geral' && destino !== 'reserva') throw new Error('Destino inválido')

  const [conta] = await db
    .select()
    .from(contaFinanceira)
    .where(and(eq(contaFinanceira.id, contaFinanceiraId), eq(contaFinanceira.condominioId, admin.condominioId)))
    .limit(1)
  if (!conta) throw new Error('Conta não encontrada')
  if (conta.estado === 'encerrada') {
    throw new Error('Esta conta está encerrada — não é possível associar novos movimentos.')
  }

  const todosCandidatos = await db
    .select({ id: movimento.id, data: movimento.data })
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, admin.condominioId),
        eq(movimento.destino, destino),
        isNull(movimento.contaFinanceiraId),
        isNull(movimento.deletedAt),
      ),
    )
  const bloqueados = await idsForaDeExercicioFechado(admin.condominioId, todosCandidatos)
  const idsParaAssociar = todosCandidatos.filter((mv) => !bloqueados.has(mv.id)).map((mv) => mv.id)

  if (idsParaAssociar.length === 0) {
    return { associados: 0, porClassificar: 0 }
  }

  const operacaoId = randomUUID()
  const afetados = await db
    .update(movimento)
    .set({ contaFinanceiraId })
    .where(and(eq(movimento.condominioId, admin.condominioId), inArray(movimento.id, idsParaAssociar)))
    .returning({ id: movimento.id })

  const [{ porClassificar }] = await db
    .select({ porClassificar: count() })
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, admin.condominioId),
        isNull(movimento.contaFinanceiraId),
        isNull(movimento.deletedAt),
      ),
    )

  if (afetados.length > 0) {
    await registarAuditoria({
      actor: admin,
      acao: 'atualizar',
      entidade: 'contaFinanceira',
      entidadeId: contaFinanceiraId,
      detalhes: formatarLogOperacaoMassa({
        operacaoId,
        tipo: 'associacao-conta',
        descricao: `${afetados.length} movimento(s) associado(s) automaticamente (destino: ${destino})`,
        nomeEntidades: 'IDs de movimentos',
        ids: afetados.map((m) => m.id),
      }),
    })
  }

  revalidatePath('/financas')
  return { associados: afetados.length, porClassificar }
}
