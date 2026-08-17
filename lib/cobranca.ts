/**
 * Processo de cobrança por fração — estado que liga as peças soltas já
 * existentes (lembretes informais, interpelação, plano prestacional).
 * Função pura (sem I/O), testável sem base de dados — ver
 * app/actions/cobranca.ts para o uso real. O plano prestacional é
 * acompanhamento administrativo, nunca a verdade financeira (essa continua
 * a ser sempre `movimento`/saldos) — ver calcularDivergenciaPlano.
 */

export const ESTADOS_COBRANCA = [
  'em_atraso',
  'lembrete_informal',
  'interpelacao_formal',
  'negociacao',
  'acordo_prestacional',
  'enviado_advogado',
  'processo_judicial',
  'regularizado',
  'encerrado',
  'cancelado',
] as const

export type EstadoCobranca = (typeof ESTADOS_COBRANCA)[number]

export const ESTADO_LABELS: Record<EstadoCobranca, string> = {
  em_atraso: 'Em atraso',
  lembrete_informal: 'Lembrete informal',
  interpelacao_formal: 'Interpelação formal',
  negociacao: 'Em negociação',
  acordo_prestacional: 'Acordo prestacional',
  enviado_advogado: 'Enviado para advogado',
  processo_judicial: 'Processo judicial',
  regularizado: 'Regularizado',
  encerrado: 'Encerrado',
  cancelado: 'Cancelado',
}

export const ESTADOS_TERMINAIS: readonly EstadoCobranca[] = ['regularizado', 'encerrado', 'cancelado']

export const ESTADOS_COM_NOTA_OBRIGATORIA: readonly EstadoCobranca[] = ['encerrado', 'cancelado']

export function ehEstadoTerminal(estado: EstadoCobranca): boolean {
  return (ESTADOS_TERMINAIS as string[]).includes(estado)
}

export type ResultadoValidacaoTransicao = { valida: boolean; motivo?: string }

/**
 * Valida uma transição de estado sem consultar nenhum dado financeiro real
 * (isso fica em app/actions/cobranca.ts, só para o alvo "regularizado", que
 * exige confirmar a dívida real == 0). Não impõe nenhuma sequência entre os
 * estados não-terminais — qualquer um pode seguir para qualquer outro
 * não-terminal, ou para um terminal, desde que as regras abaixo sejam
 * cumpridas.
 */
export function transicaoEstruturalmenteValida(
  estadoAtual: EstadoCobranca,
  estadoNovo: string,
  opcoes: { temNota: boolean },
): ResultadoValidacaoTransicao {
  if (ehEstadoTerminal(estadoAtual)) {
    return { valida: false, motivo: 'Este processo já está terminado — abra um processo novo em vez de o reabrir.' }
  }
  if (!(ESTADOS_COBRANCA as readonly string[]).includes(estadoNovo)) {
    return { valida: false, motivo: 'Estado desconhecido.' }
  }
  const novo = estadoNovo as EstadoCobranca
  if (novo === estadoAtual) {
    return { valida: false, motivo: 'O processo já está neste estado.' }
  }
  if ((ESTADOS_COM_NOTA_OBRIGATORIA as string[]).includes(novo) && !opcoes.temNota) {
    return { valida: false, motivo: 'Indique uma nota a justificar o motivo.' }
  }
  return { valida: true }
}

/**
 * Prestações pendentes cuja data prevista já passou — só para mostrar um
 * aviso na UI, nunca dispara nenhuma transição de estado automática (as
 * transições continuam sempre uma decisão manual do administrador).
 */
export function prestacoesEmAtraso<T extends { estado: string; dataPrevista: Date }>(
  prestacoes: T[],
  hoje: Date = new Date(),
): T[] {
  return prestacoes.filter((p) => p.estado === 'pendente' && p.dataPrevista.getTime() < hoje.getTime())
}

export type DivergenciaPlano = { diferenca: number; temDivergencia: boolean }

/**
 * Diferença entre o total do plano prestacional e a dívida financeira real
 * da fração (movimento/saldos) — nunca bloqueia a criação do plano, só
 * assinala a divergência para o administrador decidir e, se for o caso,
 * justificar em notas.
 */
export function calcularDivergenciaPlano(totalPrestacoes: number, dividaReal: number): DivergenciaPlano {
  const diferenca = Math.round((totalPrestacoes - dividaReal) * 100) / 100
  return { diferenca, temDivergencia: Math.abs(diferenca) >= 0.01 }
}
