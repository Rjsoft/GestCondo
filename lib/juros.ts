/**
 * Juros de mora sobre quotas em atraso. Função pura (sem I/O), testável sem
 * base de dados — ver app/actions/financas.ts:lancarJurosMora para o uso
 * real. A app não assume nem sugere nenhuma taxa: quem decide a taxa
 * aplicável (legal ou fixada no regulamento do condomínio) é o
 * administrador, no momento em que lança os juros.
 *
 * Fórmula: juros simples, proporcionais aos dias de atraso — não
 * compostos. `valorJuros = valor * (taxaAnualPercent / 100) * (diasAtraso / 365)`.
 */
const DIA_EM_MS = 1000 * 60 * 60 * 24

function diasAtraso(data: Date, hoje: Date): number {
  return Math.max(0, Math.floor((hoje.getTime() - data.getTime()) / DIA_EM_MS))
}

export function calcularJurosQuota(
  quota: { valor: number; data: Date },
  taxaAnualPercent: number,
  hoje: Date = new Date(),
): { diasAtraso: number; valorJuros: number } {
  const dias = diasAtraso(quota.data, hoje)
  const valorJuros = Math.round(quota.valor * (taxaAnualPercent / 100) * (dias / 365) * 100) / 100
  return { diasAtraso: dias, valorJuros }
}

export function calcularJurosMora(
  quotas: { fracaoId: number; valor: number; data: Date }[],
  taxaAnualPercent: number,
  hoje: Date = new Date(),
): {
  fracaoId: number
  valorJuros: number
  quotas: { data: Date; diasAtraso: number; valorJuros: number }[]
}[] {
  const porFracao = new Map<number, { data: Date; diasAtraso: number; valorJuros: number }[]>()
  for (const q of quotas) {
    const calculo = calcularJurosQuota(q, taxaAnualPercent, hoje)
    const lista = porFracao.get(q.fracaoId) ?? []
    lista.push({ data: q.data, ...calculo })
    porFracao.set(q.fracaoId, lista)
  }

  return Array.from(porFracao.entries()).map(([fracaoId, quotasDaFracao]) => ({
    fracaoId,
    valorJuros: Math.round(quotasDaFracao.reduce((s, q) => s + q.valorJuros, 0) * 100) / 100,
    quotas: quotasDaFracao,
  }))
}
