// Regras de cálculo do saldo bancário e validação de IBAN — módulo de
// domínio único, para nunca duplicar esta lógica entre a página, o
// relatório e o transporte de saldo (ver docs/product/
// MBD_GEST_GAP_ANALYSIS.md, correção 2 e 4 da Fase A.1).

import { db } from '@/lib/db'
import { exercicioFinanceiro, movimento, saldoInicialConta } from '@/lib/db/schema'
import { and, eq, gte, isNull, lte } from 'drizzle-orm'

export type MovimentoIncompleto = {
  id: number
  categoria: string
  descricao: string
  valor: string
}

/**
 * Saldo bancário (físico) de uma conta financeira num exercício.
 *
 * Critério contabilístico: só entram movimentos EFETIVAMENTE LIQUIDADOS
 * (`pago = true`), não eliminados (`deletedAt IS NULL`), ligados a esta
 * conta e a este exercício. A data que importa para o saldo é a data em
 * que o dinheiro entrou/saiu — não a data do lançamento nem o exercício
 * de origem contabilística do movimento (que podem ser diferentes: uma
 * despesa lançada em dezembro de 2026 mas só paga em janeiro de 2027
 * conta para o saldo bancário de 2027, mesmo que o exercício de origem
 * do lançamento seja 2026).
 *
 * Um movimento pago sem `dataLiquidacao` preenchida (possível em dados
 * anteriores a esta funcionalidade) continua a contar para o saldo — a
 * data do lançamento é usada como aproximação provisória — mas fica
 * identificado em `movimentosSemDataLiquidacao`, para a UI poder avisar
 * a administração sem impedir o uso normal da aplicação.
 */
export async function calcularSaldoConta(contaFinanceiraId: number, exercicioId: number) {
  const [inicial] = await db
    .select()
    .from(saldoInicialConta)
    .where(
      and(
        eq(saldoInicialConta.contaFinanceiraId, contaFinanceiraId),
        eq(saldoInicialConta.exercicioId, exercicioId),
      ),
    )
    .limit(1)

  const movimentosLiquidados = await db
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.contaFinanceiraId, contaFinanceiraId),
        eq(movimento.exercicioId, exercicioId),
        eq(movimento.pago, true),
        isNull(movimento.deletedAt),
      ),
    )

  const soma = movimentosLiquidados.reduce(
    (s, mv) => s + (mv.tipo === 'receita' ? Number(mv.valor) : -Number(mv.valor)),
    0,
  )
  const saldoInicial = inicial ? Number(inicial.valor) : 0
  const movimentosSemDataLiquidacao: MovimentoIncompleto[] = movimentosLiquidados
    .filter((mv) => !mv.dataLiquidacao)
    .map((mv) => ({ id: mv.id, categoria: mv.categoria, descricao: mv.descricao, valor: mv.valor }))

  return {
    saldoInicial,
    saldoInicialOrigem: (inicial?.origem ?? null) as 'manual' | 'transportado' | null,
    saldo: saldoInicial + soma,
    movimentosContabilizados: movimentosLiquidados.length,
    movimentosSemDataLiquidacao,
  }
}

/**
 * Lança um erro (mensagem já em português simples) se `data` cair dentro
 * de um exercício fechado do condomínio. Chamado por todas as ações que
 * alteram o resultado financeiro de um período — ver a lista completa em
 * docs/product/MBD_GEST_GAP_ANALYSIS.md (correção 4). Um movimento fora
 * de qualquer exercício registado nunca é bloqueado por esta verificação.
 */
export async function garantirExercicioAberto(condominioId: number, data: Date) {
  const [ex] = await db
    .select()
    .from(exercicioFinanceiro)
    .where(
      and(
        eq(exercicioFinanceiro.condominioId, condominioId),
        lte(exercicioFinanceiro.dataInicio, data),
        gte(exercicioFinanceiro.dataFim, data),
      ),
    )
    .limit(1)
  if (ex && ex.estado === 'fechado') {
    throw new Error(
      'Este exercício está fechado. Para alterar movimentos deste período, reabra primeiro o exercício e indique o motivo.',
    )
  }
}

/** Remove espaços e converte para maiúsculas — nunca gravar um IBAN sem passar por aqui. */
export function normalizarIban(valor: string) {
  return valor.replace(/\s+/g, '').toUpperCase()
}

/** Validação de checksum IBAN (ISO 13616, mod-97) — aceita qualquer país. */
export function ibanValido(iban: string): boolean {
  const limpo = normalizarIban(iban)
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(limpo) || limpo.length < 15 || limpo.length > 34) {
    return false
  }
  const rearranjado = limpo.slice(4) + limpo.slice(0, 4)
  const numerico = rearranjado.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55))
  let resto = 0
  for (const digito of numerico) {
    resto = (resto * 10 + Number(digito)) % 97
  }
  return resto === 1
}

/** "•••• 1234" — nunca mostrar o IBAN completo fora do ecrã de gestão. */
export function mascararIban(iban: string | null) {
  if (!iban) return null
  const limpo = normalizarIban(iban)
  return `•••• ${limpo.slice(-4)}`
}

/**
 * Dos candidatos indicados, devolve o conjunto de ids cuja `data` cai
 * dentro de um exercício já fechado do condomínio — para filtrar
 * operações em massa (ex. associar movimentos a uma conta) que não têm
 * um único exercício-alvo para verificar com `garantirExercicioAberto`.
 * Como exercícios nunca se sobrepõem (constraint da base de dados), cada
 * `data` cai no máximo num exercício.
 */
export async function idsForaDeExercicioFechado(
  condominioId: number,
  candidatos: { id: number; data: Date }[],
): Promise<Set<number>> {
  if (candidatos.length === 0) return new Set()
  const fechados = await db
    .select()
    .from(exercicioFinanceiro)
    .where(and(eq(exercicioFinanceiro.condominioId, condominioId), eq(exercicioFinanceiro.estado, 'fechado')))
  if (fechados.length === 0) return new Set()

  const bloqueados = new Set<number>()
  for (const c of candidatos) {
    if (fechados.some((ex) => c.data >= ex.dataInicio && c.data <= ex.dataFim)) {
      bloqueados.add(c.id)
    }
  }
  return bloqueados
}

/**
 * Traduz o erro de sobreposição de exercícios (constraint `EXCLUDE` da
 * base de dados, código Postgres `23P01`) para uma mensagem simples, sem
 * nenhuma referência técnica (GiST, constraint, intervalo). `null` se o
 * erro não for este caso — quem chama decide o que fazer com o erro
 * original nesse caso.
 */
export function mensagemErroSobreposicaoExercicio(e: unknown): string | null {
  const codigo = e && typeof e === 'object' && 'code' in e ? (e as { code?: string }).code : null
  if (codigo === '23P01') {
    return 'Já existe um exercício que inclui parte deste período. Altere as datas para que os exercícios não se sobreponham.'
  }
  return null
}
