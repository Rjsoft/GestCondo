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

/**
 * Rateio de um valor único (não mensal) pelas frações, por permilagem — para
 * dividir uma despesa comum extraordinária (ex: pintura da fachada) pelos
 * condóminos, gerando uma dívida (receita) por fração em vez de um único
 * lançamento avulso. Ver app/actions/financas.ts:ratearDespesaComum.
 *
 * `isentarElevador`: quando a despesa diz respeito ao elevador, exclui do
 * rateio as frações marcadas como isentas (`fracao.isentaElevador`), mesma
 * regra já usada em `calcularQuotasMensais`. Sem isenção, todas as frações
 * entram no rateio, isentas ou não.
 */
export function calcularRateioValor(
  fracoes: { id: number; permilagem: number; isentaElevador?: boolean }[],
  valorTotal: number,
  isentarElevador = false,
): { fracaoId: number; valor: number }[] {
  const base = isentarElevador ? fracoes.filter((f) => !f.isentaElevador) : fracoes
  const totalPermilagem = base.reduce((s, f) => s + f.permilagem, 0)
  if (totalPermilagem <= 0) {
    throw new Error(
      isentarElevador && fracoes.length > 0
        ? 'Todas as frações estão isentas do elevador — não é possível ratear esta despesa'
        : 'Nenhuma fração tem permilagem definida — não é possível ratear esta despesa',
    )
  }

  return base.map((f) => ({
    fracaoId: f.id,
    valor: Math.round(valorTotal * (f.permilagem / totalPermilagem) * 100) / 100,
  }))
}

/**
 * Divide cada quota mensal em parcela corrente e parcela do fundo de reserva,
 * segundo uma percentagem (0–100). `percentagem` nula ou 0 devolve tudo como
 * `valorGeral`, sem `valorReserva` — mesmo comportamento de antes desta
 * funcionalidade (segregação só manual). Ver `orcamento.percentagemFundoReserva`.
 */
export function aplicarPercentagemReserva(
  quotas: { fracaoId: number; valorMensal: number }[],
  percentagem: number | null | undefined,
): { fracaoId: number; valorGeral: number; valorReserva: number }[] {
  if (!percentagem || percentagem <= 0) {
    return quotas.map((q) => ({ fracaoId: q.fracaoId, valorGeral: q.valorMensal, valorReserva: 0 }))
  }
  return quotas.map((q) => {
    const valorReserva = Math.round(q.valorMensal * (percentagem / 100) * 100) / 100
    const valorGeral = Math.round((q.valorMensal - valorReserva) * 100) / 100
    return { fracaoId: q.fracaoId, valorGeral, valorReserva }
  })
}
