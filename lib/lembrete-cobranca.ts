import type { ChaveEscalao } from '@/lib/antiguidade-divida'

/**
 * Lembretes de cobrança informais (sem valor legal, ao contrário da
 * interpelação formal em app/(app)/financas/interpelacao/[fracaoId]) — dois
 * níveis, ligados aos escalões de antiguidade da dívida já calculados por
 * lib/antiguidade-divida.ts. Função pura (sem I/O) — ver
 * app/actions/financas.ts:getLembretesCobranca para o uso real.
 */
export const NIVEIS_LEMBRETE = [
  { chave: '31-60' as ChaveEscalao, ordem: 1, label: '1º lembrete' },
  { chave: '61-90' as ChaveEscalao, ordem: 2, label: '2º lembrete' },
] as const

export type NivelLembrete = (typeof NIVEIS_LEMBRETE)[number]['chave']

export type EstadoNivelLembrete = {
  chave: NivelLembrete
  label: string
  disponivel: boolean
  ultimoEnvio: Date | null
}

/**
 * Para cada nível de lembrete, indica se a fração tem atualmente dívida
 * nesse escalão (`disponivel`) e quando foi enviado da última vez (ou
 * `null` se nunca). Reenviar não é bloqueado — é uma decisão do
 * administrador, só se assinala o histórico.
 */
export function calcularEstadoLembretes(
  escaloes: Record<ChaveEscalao, number>,
  historico: { escalao: string; dataEnvio: Date }[],
): EstadoNivelLembrete[] {
  return NIVEIS_LEMBRETE.map((nivel) => {
    const envios = historico
      .filter((h) => h.escalao === nivel.chave)
      .sort((a, b) => b.dataEnvio.getTime() - a.dataEnvio.getTime())
    return {
      chave: nivel.chave,
      label: nivel.label,
      disponivel: (escaloes[nivel.chave] ?? 0) > 0,
      ultimoEnvio: envios[0]?.dataEnvio ?? null,
    }
  })
}
