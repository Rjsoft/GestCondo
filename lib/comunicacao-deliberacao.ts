/**
 * Situação da comunicação de uma deliberação (que exigiu unanimidade e foi
 * aprovada provisoriamente por 2/3 do capital investido presente) a uma
 * fração ausente. Função pura (sem I/O) — ver
 * app/actions/assembleias.ts:getComunicacoesDeliberacao para o uso real.
 *
 * Base legal (art. 1432.º, n.os 8 a 11 do Código Civil, texto verificado em
 * 2026-07-27, ver também a nota em app/(app)/assembleias/[id]/convocatoria/page.tsx):
 * a administração tem 30 dias após a assembleia para comunicar a
 * deliberação aos ausentes; estes têm 90 dias após a receção para se
 * pronunciarem por escrito — o silêncio vale como aprovação.
 */
const DIA_EM_MS = 1000 * 60 * 60 * 24
export const PRAZO_ENVIO_DIAS = 30
export const PRAZO_RESPOSTA_DIAS = 90

export type SituacaoComunicacaoDeliberacao =
  | 'por_comunicar'
  | 'aguarda_resposta'
  | 'concordancia'
  | 'discordancia'
  | 'silencio_aprovacao'

function somarDias(data: Date, dias: number): Date {
  return new Date(data.getTime() + dias * DIA_EM_MS)
}

export function calcularSituacaoComunicacao(
  params: {
    dataAssembleia: Date
    dataEnvio: Date | null
    resposta: 'concordancia' | 'discordancia' | null
  },
  hoje: Date = new Date(),
): {
  situacao: SituacaoComunicacaoDeliberacao
  prazoEnvio: Date
  prazoResposta: Date | null
  envioEmAtraso: boolean
  respostaEmAtraso: boolean
} {
  const { dataAssembleia, dataEnvio, resposta } = params
  const prazoEnvio = somarDias(dataAssembleia, PRAZO_ENVIO_DIAS)

  if (!dataEnvio) {
    return {
      situacao: 'por_comunicar',
      prazoEnvio,
      prazoResposta: null,
      envioEmAtraso: hoje.getTime() > prazoEnvio.getTime(),
      respostaEmAtraso: false,
    }
  }

  const prazoResposta = somarDias(dataEnvio, PRAZO_RESPOSTA_DIAS)

  if (resposta === 'concordancia' || resposta === 'discordancia') {
    return {
      situacao: resposta,
      prazoEnvio,
      prazoResposta,
      envioEmAtraso: false,
      respostaEmAtraso: false,
    }
  }

  const respostaEmAtraso = hoje.getTime() > prazoResposta.getTime()
  return {
    situacao: respostaEmAtraso ? 'silencio_aprovacao' : 'aguarda_resposta',
    prazoEnvio,
    prazoResposta,
    envioEmAtraso: false,
    respostaEmAtraso,
  }
}
