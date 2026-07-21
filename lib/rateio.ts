/**
 * Rateio de um orçamento anual pelas frações, por permilagem, em quotas
 * mensais. Função pura (sem I/O) para poder ser testada sem base de dados —
 * ver app/actions/orcamentos.ts:gerarQuotasOrcamento para o uso real.
 *
 * Suporta uma parcela separada para o elevador (`valorAnualElevador`),
 * rateada só pelas frações que não estejam isentas (`isentaElevador`) —
 * caso comum em Portugal quando o rés-do-chão não usa o elevador (art.
 * 1424º CC permite repartição diferente da permilagem nestes casos). A
 * parcela geral continua a ser rateada por permilagem entre todas as
 * frações, isentas ou não.
 */
export function calcularQuotasMensais(
  fracoes: { id: number; permilagem: number; isentaElevador?: boolean }[],
  valorAnualGeral: number,
  valorAnualElevador = 0,
): { fracaoId: number; valorMensal: number }[] {
  const totalPermilagem = fracoes.reduce((s, f) => s + f.permilagem, 0)
  if (totalPermilagem <= 0) {
    throw new Error(
      'Nenhuma fração tem permilagem definida — não é possível ratear o orçamento',
    )
  }

  const fracoesElevador = fracoes.filter((f) => !f.isentaElevador)
  const totalPermilagemElevador = fracoesElevador.reduce((s, f) => s + f.permilagem, 0)
  if (valorAnualElevador > 0 && totalPermilagemElevador <= 0) {
    throw new Error(
      'Todas as frações estão isentas do elevador — não é possível ratear essa parcela',
    )
  }

  return fracoes.map((f) => {
    const quotaGeral = (valorAnualGeral * (f.permilagem / totalPermilagem)) / 12
    const quotaElevador =
      valorAnualElevador > 0 && !f.isentaElevador
        ? (valorAnualElevador * (f.permilagem / totalPermilagemElevador)) / 12
        : 0
    return {
      fracaoId: f.id,
      valorMensal: Math.round((quotaGeral + quotaElevador) * 100) / 100,
    }
  })
}
