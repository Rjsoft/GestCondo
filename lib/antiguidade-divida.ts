/**
 * Antiguidade da dívida por escalão — agrupa quotas em atraso (por fração)
 * pelo número de dias de atraso, em escalões fixos (30/60/90/180/+365 dias).
 * Função pura (sem I/O), testável sem base de dados — ver
 * app/actions/financas.ts:getAntiguidadeDivida para o uso real. Reaproveita
 * a mesma noção de "dias de atraso" já usada em lib/juros.ts.
 */

export const ESCALOES_ANTIGUIDADE = [
  { chave: '0-30', label: '0–30 dias', min: 0, max: 30 },
  { chave: '31-60', label: '31–60 dias', min: 31, max: 60 },
  { chave: '61-90', label: '61–90 dias', min: 61, max: 90 },
  { chave: '91-180', label: '91–180 dias', min: 91, max: 180 },
  { chave: '181-365', label: '181–365 dias', min: 181, max: 365 },
  { chave: '365+', label: '+365 dias', min: 366, max: Infinity },
] as const

export type ChaveEscalao = (typeof ESCALOES_ANTIGUIDADE)[number]['chave']

const DIA_EM_MS = 1000 * 60 * 60 * 24

function diasAtraso(data: Date, hoje: Date): number {
  return Math.max(0, Math.floor((hoje.getTime() - data.getTime()) / DIA_EM_MS))
}

function escaloesVazios(): Record<ChaveEscalao, number> {
  return Object.fromEntries(ESCALOES_ANTIGUIDADE.map((e) => [e.chave, 0])) as Record<ChaveEscalao, number>
}

export function calcularAntiguidadeDivida(
  quotas: { fracaoId: number; valor: number; data: Date }[],
  hoje: Date = new Date(),
): { fracaoId: number; escaloes: Record<ChaveEscalao, number>; total: number }[] {
  const porFracao = new Map<number, Record<ChaveEscalao, number>>()

  for (const q of quotas) {
    const dias = diasAtraso(q.data, hoje)
    const escalao = ESCALOES_ANTIGUIDADE.find((e) => dias >= e.min && dias <= e.max)
    if (!escalao) continue
    const atual = porFracao.get(q.fracaoId) ?? escaloesVazios()
    atual[escalao.chave] += q.valor
    porFracao.set(q.fracaoId, atual)
  }

  return Array.from(porFracao.entries()).map(([fracaoId, escaloes]) => {
    const arredondados = Object.fromEntries(
      ESCALOES_ANTIGUIDADE.map((e) => [e.chave, Math.round(escaloes[e.chave] * 100) / 100]),
    ) as Record<ChaveEscalao, number>
    return {
      fracaoId,
      escaloes: arredondados,
      total: Math.round(Object.values(arredondados).reduce((s, v) => s + v, 0) * 100) / 100,
    }
  })
}
