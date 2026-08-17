'use server'

import { createHash } from 'node:crypto'
import { db } from '@/lib/db'
import { documentoCobrancaEmitido, fracao, prestacao, processoCobranca, processoCobrancaTransicao } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import {
  calcularDivergenciaPlano,
  ehEstadoTerminal,
  transicaoEstruturalmenteValida,
  type EstadoCobranca,
} from '@/lib/cobranca'
import { getAntiguidadeDivida, getDeclaracaoDivida } from '@/app/actions/financas'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import type { MembroSessao } from '@/lib/perfis'
import { and, asc, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function dividaRealDaFracao(fracaoId: number): Promise<number> {
  const antiguidade = await getAntiguidadeDivida()
  return antiguidade.find((a) => a.fracaoId === fracaoId)?.total ?? 0
}

async function getProcessoOuFalha(id: number, condominioId: number) {
  const [processo] = await db
    .select()
    .from(processoCobranca)
    .where(and(eq(processoCobranca.id, id), eq(processoCobranca.condominioId, condominioId)))
    .limit(1)
  if (!processo) throw new Error('Processo de cobrança não encontrado')
  return processo
}

/**
 * Regista uma transição de estado: valida (lib/cobranca.ts), atualiza
 * `processoCobranca.estado`, grava a linha imutável em
 * `processo_cobranca_transicao` e audita — usada tanto pela transição
 * explícita como por `criarPlanoPrestacional` (evita duplicar o registo).
 * "regularizado" exige a dívida real da fração a zero — só aqui, porque
 * depende de dados reais, ao contrário de `transicaoEstruturalmenteValida`,
 * que é pura.
 */
async function aplicarTransicao(
  admin: MembroSessao,
  processo: typeof processoCobranca.$inferSelect,
  novoEstado: string,
  nota: string | undefined,
) {
  const notaLimpa = nota?.trim() || undefined
  const validacao = transicaoEstruturalmenteValida(processo.estado as EstadoCobranca, novoEstado, {
    temNota: !!notaLimpa,
  })
  if (!validacao.valida) throw new Error(validacao.motivo)

  if (novoEstado === 'regularizado') {
    const divida = await dividaRealDaFracao(processo.fracaoId)
    if (divida > 0) {
      throw new Error(
        `Esta fração ainda tem ${divida.toFixed(2)} € em dívida real — não é possível marcar como regularizado. Se precisar de fechar o processo mesmo assim, use "encerrado" com motivo.`,
      )
    }
  }

  await db
    .update(processoCobranca)
    .set({ estado: novoEstado, updatedAt: new Date() })
    .where(eq(processoCobranca.id, processo.id))

  await db.insert(processoCobrancaTransicao).values({
    processoCobrancaId: processo.id,
    estadoAnterior: processo.estado,
    estadoNovo: novoEstado,
    userId: admin.userId,
    autorNome: admin.nome,
    nota: notaLimpa ?? null,
  })

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'processoCobranca',
    entidadeId: processo.id,
    detalhes: `Processo de cobrança: ${processo.estado} → ${novoEstado}${notaLimpa ? ` (${notaLimpa})` : ''}`,
  })
}

/**
 * Processos de cobrança não terminais do condomínio, com a dívida
 * financeira real de cada fração (getAntiguidadeDivida) para comparação.
 */
export async function getProcessosCobranca() {
  const m = await requireAcessoFinanceiro()
  const [processos, antiguidade] = await Promise.all([
    db
      .select({
        id: processoCobranca.id,
        fracaoId: processoCobranca.fracaoId,
        estado: processoCobranca.estado,
        createdAt: processoCobranca.createdAt,
        identificacao: fracao.identificacao,
        proprietario: fracao.proprietario,
      })
      .from(processoCobranca)
      .innerJoin(fracao, eq(fracao.id, processoCobranca.fracaoId))
      .where(eq(processoCobranca.condominioId, m.condominioId))
      .orderBy(desc(processoCobranca.createdAt)),
    getAntiguidadeDivida(),
  ])

  const dividaPorFracao = new Map(antiguidade.map((a) => [a.fracaoId, a.total]))

  return processos
    .filter((p) => !ehEstadoTerminal(p.estado as EstadoCobranca))
    .map((p) => ({ ...p, dividaReal: dividaPorFracao.get(p.fracaoId) ?? 0 }))
}

/**
 * Todos os processos (incl. terminais) de uma fração — usado para impedir
 * abrir um segundo processo enquanto houver um não terminal, e para a
 * listagem de histórico da fração, se vier a ser necessária.
 */
async function getProcessosDaFracao(fracaoId: number, condominioId: number) {
  return db
    .select()
    .from(processoCobranca)
    .where(and(eq(processoCobranca.fracaoId, fracaoId), eq(processoCobranca.condominioId, condominioId)))
    .orderBy(desc(processoCobranca.createdAt))
}

/**
 * Detalhe completo de um processo: prestações, histórico de transições
 * (imutável), documentos emitidos e a dívida financeira real da fração
 * lado a lado com o total do plano, para o administrador confrontar.
 */
export async function getProcessoCobranca(id: number) {
  const m = await requireAcessoFinanceiro()
  const processo = await getProcessoOuFalha(id, m.condominioId)

  const [f] = await db.select().from(fracao).where(eq(fracao.id, processo.fracaoId)).limit(1)

  const [prestacoes, transicoes, documentos, dividaReal] = await Promise.all([
    db.select().from(prestacao).where(eq(prestacao.processoCobrancaId, id)).orderBy(asc(prestacao.numero)),
    db
      .select()
      .from(processoCobrancaTransicao)
      .where(eq(processoCobrancaTransicao.processoCobrancaId, id))
      .orderBy(asc(processoCobrancaTransicao.data)),
    db
      .select()
      .from(documentoCobrancaEmitido)
      .where(eq(documentoCobrancaEmitido.processoCobrancaId, id))
      .orderBy(desc(documentoCobrancaEmitido.emitidoEm)),
    dividaRealDaFracao(processo.fracaoId),
  ])

  const totalPlano = prestacoes.reduce((s, p) => s + Number(p.valor), 0)

  return {
    processo,
    fracao: f ? { id: f.id, identificacao: f.identificacao, proprietario: f.proprietario } : null,
    prestacoes,
    transicoes,
    documentos,
    dividaReal,
    divergenciaPlano: prestacoes.length > 0 ? calcularDivergenciaPlano(totalPlano, dividaReal) : null,
  }
}

/**
 * Abre um processo de cobrança para uma fração — no máximo um não terminal
 * de cada vez (índice único parcial em `processo_cobranca`, esta validação
 * dá a mensagem amigável antes de bater no erro de BD).
 */
export async function abrirProcessoCobranca(fracaoId: number, notaInicial?: string) {
  const admin = await requireAdmin()

  const [f] = await db
    .select({ id: fracao.id, identificacao: fracao.identificacao })
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, admin.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração não encontrada')

  const existentes = await getProcessosDaFracao(fracaoId, admin.condominioId)
  if (existentes.some((p) => !ehEstadoTerminal(p.estado as EstadoCobranca))) {
    throw new Error('Já existe um processo de cobrança em curso para esta fração.')
  }

  const notaLimpa = notaInicial?.trim() || null

  const [novo] = await db
    .insert(processoCobranca)
    .values({
      condominioId: admin.condominioId,
      fracaoId,
      estado: 'em_atraso',
      notas: notaLimpa,
      abertoPorUserId: admin.userId,
    })
    .returning()

  await db.insert(processoCobrancaTransicao).values({
    processoCobrancaId: novo.id,
    estadoAnterior: null,
    estadoNovo: 'em_atraso',
    userId: admin.userId,
    autorNome: admin.nome,
    nota: notaLimpa,
  })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'processoCobranca',
    entidadeId: novo.id,
    detalhes: `Processo de cobrança aberto para a fração ${f.identificacao}`,
  })

  revalidatePath('/financas')
  return novo
}

/** Transição de estado explícita, acionada pelo administrador. */
export async function transitarEstadoProcessoCobranca(id: number, novoEstado: string, nota?: string) {
  const admin = await requireAdmin()
  const processo = await getProcessoOuFalha(id, admin.condominioId)
  await aplicarTransicao(admin, processo, novoEstado, nota)
  revalidatePath('/financas')
  revalidatePath(`/financas/processos-cobranca/${id}`)
}

/**
 * Grava as prestações do plano — acompanhamento administrativo, nunca
 * escreve em `movimento`/saldos/exercícios/fundo de reserva. Se o processo
 * ainda não estiver em "acordo_prestacional", transita para lá; se já
 * estiver (a acrescentar mais prestações a um plano existente), só
 * acrescenta as linhas, sem registar uma transição sem sentido (o estado
 * já é o mesmo).
 */
export async function criarPlanoPrestacional(
  processoCobrancaId: number,
  prestacoesInput: { dataPrevista: Date; valor: number }[],
) {
  const admin = await requireAdmin()
  const processo = await getProcessoOuFalha(processoCobrancaId, admin.condominioId)
  if (prestacoesInput.length === 0) throw new Error('Indique pelo menos uma prestação')
  if (prestacoesInput.some((p) => !(p.valor > 0))) throw new Error('Todas as prestações têm de ter um valor positivo')

  const jaExistentes = await db
    .select({ numero: prestacao.numero })
    .from(prestacao)
    .where(eq(prestacao.processoCobrancaId, processoCobrancaId))
  const proximoNumero = jaExistentes.length > 0 ? Math.max(...jaExistentes.map((p) => p.numero)) + 1 : 1

  await db.insert(prestacao).values(
    prestacoesInput.map((p, i) => ({
      processoCobrancaId,
      numero: proximoNumero + i,
      dataPrevista: p.dataPrevista,
      valor: p.valor.toFixed(2),
    })),
  )

  if (processo.estado !== 'acordo_prestacional') {
    await aplicarTransicao(admin, processo, 'acordo_prestacional', undefined)
  }

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'processoCobranca',
    entidadeId: processoCobrancaId,
    detalhes: `${prestacoesInput.length} prestação(ões) adicionada(s) ao plano prestacional`,
  })

  const dividaReal = await dividaRealDaFracao(processo.fracaoId)
  const todasPrestacoes = await db
    .select({ valor: prestacao.valor })
    .from(prestacao)
    .where(eq(prestacao.processoCobrancaId, processoCobrancaId))
  const totalPlano = todasPrestacoes.reduce((s, p) => s + Number(p.valor), 0)

  revalidatePath('/financas')
  revalidatePath(`/financas/processos-cobranca/${processoCobrancaId}`)

  const divergencia = calcularDivergenciaPlano(totalPlano, dividaReal)
  return { avisoDivergencia: divergencia.temDivergencia, diferenca: divergencia.diferenca }
}

/**
 * Marca uma prestação do plano como cumprida — acompanhamento
 * administrativo. NÃO escreve em `movimento`, `contaFinanceira`,
 * `exercicioFinanceiro` nem em nenhuma tabela financeira: a verdade
 * financeira continua a ser sempre Finanças/Movimentos, não este plano.
 */
export async function marcarPrestacaoCumprida(prestacaoId: number) {
  const admin = await requireAdmin()

  const [p] = await db
    .select({
      id: prestacao.id,
      numero: prestacao.numero,
      processoCobrancaId: prestacao.processoCobrancaId,
      condominioId: processoCobranca.condominioId,
    })
    .from(prestacao)
    .innerJoin(processoCobranca, eq(processoCobranca.id, prestacao.processoCobrancaId))
    .where(eq(prestacao.id, prestacaoId))
    .limit(1)
  if (!p || p.condominioId !== admin.condominioId) throw new Error('Prestação não encontrada')

  await db
    .update(prestacao)
    .set({ estado: 'cumprida', cumpridaEm: new Date() })
    .where(eq(prestacao.id, prestacaoId))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'processoCobranca',
    entidadeId: p.processoCobrancaId,
    detalhes: `Prestação nº ${p.numero} marcada como cumprida (acompanhamento administrativo — não altera movimentos)`,
  })

  revalidatePath(`/financas/processos-cobranca/${p.processoCobrancaId}`)
}

const TEMPLATE_VERSAO: Record<'interpelacao' | 'declaracao_divida', string> = {
  interpelacao: 'interpelacao-v1',
  declaracao_divida: 'declaracao-divida-v1',
}

/**
 * Regista prova histórica de emissão de uma interpelação/declaração de
 * dívida — snapshot dos dados usados no documento, com hash, para que uma
 * alteração posterior ao proprietário ou à dívida da fração nunca altere
 * retroativamente o que foi emitido. Chamada pelo botão de emissão antes de
 * imprimir (nunca imprime sem deixar prova).
 */
export async function registarEmissaoDocumentoCobranca(
  fracaoId: number,
  tipo: 'interpelacao' | 'declaracao_divida',
  opcoes: { processoCobrancaId?: number; prazoDias?: number } = {},
) {
  const admin = await requireAdmin()
  const declaracao = await getDeclaracaoDivida(fracaoId)

  const snapshot = {
    tipo,
    emitidoPor: admin.nome,
    emitidoEm: new Date().toISOString(),
    prazoDias: opcoes.prazoDias ?? null,
    fracao: declaracao.fracao,
    anoOrcamento: declaracao.anoOrcamento,
    quotaMensalAtual: declaracao.quotaMensalAtual,
    dividas: declaracao.dividas,
    totalDivida: declaracao.totalDivida,
  }
  const snapshotJson = JSON.stringify(snapshot)
  const snapshotHash = createHash('sha256').update(snapshotJson).digest('hex')

  const [novo] = await db
    .insert(documentoCobrancaEmitido)
    .values({
      condominioId: admin.condominioId,
      fracaoId,
      processoCobrancaId: opcoes.processoCobrancaId ?? null,
      tipo,
      userId: admin.userId,
      autorNome: admin.nome,
      destinatario: declaracao.fracao.proprietario,
      valorDivida: declaracao.totalDivida.toFixed(2),
      prazoDias: opcoes.prazoDias ?? null,
      templateVersao: TEMPLATE_VERSAO[tipo],
      snapshotJson,
      snapshotHash,
    })
    .returning()

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: opcoes.processoCobrancaId ? 'processoCobranca' : 'fracao',
    entidadeId: opcoes.processoCobrancaId ?? fracaoId,
    detalhes: `${tipo === 'interpelacao' ? 'Interpelação' : 'Declaração de dívida'} emitida para ${declaracao.fracao.identificacao}`,
  })

  return { id: novo.id, snapshotHash }
}
