/** Ver `condominio.criterioRateio` (lib/db/schema.ts) para a base legal. */
export type CriterioRateio = 'permilagem' | 'partes_iguais'

/**
 * Peso de rateio de uma fração consoante o critério: a própria permilagem,
 * ou 1 para todas (partes iguais) — ver art. 1424º n.º2 CC.
 */
function pesoRateio(f: { permilagem: number }, criterio: CriterioRateio): number {
  return criterio === 'partes_iguais' ? 1 : f.permilagem
}

/**
 * Rateio de um orçamento anual pelas frações, em quotas mensais. Função pura
 * (sem I/O) para poder ser testada sem base de dados — ver
 * app/actions/orcamentos.ts:gerarQuotasOrcamento para o uso real.
 *
 * Por omissão rateia por permilagem (`criterioRateio: 'permilagem'`, art.
 * 1424º n.º1 CC). Com `'partes_iguais'`, todas as frações pesam o mesmo,
 * independentemente da permilagem — só válido se previsto no regulamento de
 * condomínio nos termos do art. 1424º n.º2 CC (ver `condominio.criterioRateio`).
 *
 * Suporta uma parcela separada para o elevador (`valorAnualElevador`),
 * rateada só pelas frações que não estejam isentas (`isentaElevador`) —
 * caso comum em Portugal quando o rés-do-chão não usa o elevador (art.
 * 1424º n.º4 CC) — com o mesmo critério (permilagem ou partes iguais) entre
 * as frações com direito. `valorAnualElevador` é uma **fatia dentro** de
 * `valorAnualGeral` (descontada do "resto" rateado entre todas), não um
 * valor acrescentado — o total cobrado ao longo do ano permanece
 * `valorAnualGeral`, tal como aprovado em assembleia (achado 2026-08-17:
 * antes desta correção, o elevador era somado por cima, cobrando a mais do
 * que o orçamento aprovado).
 */
export function calcularQuotasMensais(
  fracoes: { id: number; permilagem: number; isentaElevador?: boolean }[],
  valorAnualGeral: number,
  valorAnualElevador = 0,
  criterioRateio: CriterioRateio = 'permilagem',
): { fracaoId: number; valorMensal: number }[] {
  if (valorAnualElevador > valorAnualGeral) {
    throw new Error('O valor do elevador não pode exceder o valor anual do orçamento')
  }

  const totalPeso = fracoes.reduce((s, f) => s + pesoRateio(f, criterioRateio), 0)
  if (totalPeso <= 0) {
    throw new Error(
      criterioRateio === 'partes_iguais'
        ? 'Não há frações para ratear o orçamento'
        : 'Nenhuma fração tem permilagem definida — não é possível ratear o orçamento',
    )
  }

  const fracoesElevador = fracoes.filter((f) => !f.isentaElevador)
  const totalPesoElevador = fracoesElevador.reduce((s, f) => s + pesoRateio(f, criterioRateio), 0)
  if (valorAnualElevador > 0 && totalPesoElevador <= 0) {
    throw new Error(
      'Todas as frações estão isentas do elevador — não é possível ratear essa parcela',
    )
  }

  const valorAnualResto = valorAnualGeral - valorAnualElevador

  return fracoes.map((f) => {
    const quotaGeral = (valorAnualResto * (pesoRateio(f, criterioRateio) / totalPeso)) / 12
    const quotaElevador =
      valorAnualElevador > 0 && !f.isentaElevador
        ? (valorAnualElevador * (pesoRateio(f, criterioRateio) / totalPesoElevador)) / 12
        : 0
    return {
      fracaoId: f.id,
      valorMensal: Math.round((quotaGeral + quotaElevador) * 100) / 100,
    }
  })
}

/**
 * Rateio de um valor único (não mensal) pelas frações — para dividir uma
 * despesa comum extraordinária (ex: pintura da fachada) pelos condóminos,
 * gerando uma dívida (receita) por fração em vez de um único lançamento
 * avulso. Ver app/actions/financas.ts:ratearDespesaComum.
 *
 * Por omissão rateia por permilagem; com `criterioRateio: 'partes_iguais'`
 * todas as frações pesam o mesmo — ver `calcularQuotasMensais` para a base
 * legal (art. 1424º n.º2 CC).
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
  criterioRateio: CriterioRateio = 'permilagem',
): { fracaoId: number; valor: number }[] {
  const base = isentarElevador ? fracoes.filter((f) => !f.isentaElevador) : fracoes
  const totalPeso = base.reduce((s, f) => s + pesoRateio(f, criterioRateio), 0)
  if (totalPeso <= 0) {
    throw new Error(
      isentarElevador && fracoes.length > 0
        ? 'Todas as frações estão isentas do elevador — não é possível ratear esta despesa'
        : criterioRateio === 'partes_iguais'
          ? 'Não há frações para ratear esta despesa'
          : 'Nenhuma fração tem permilagem definida — não é possível ratear esta despesa',
    )
  }

  return base.map((f) => ({
    fracaoId: f.id,
    valor: Math.round(valorTotal * (pesoRateio(f, criterioRateio) / totalPeso) * 100) / 100,
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
