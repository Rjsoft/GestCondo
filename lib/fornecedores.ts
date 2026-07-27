// Constantes partilhadas entre app/actions/contratos.ts ('use server', não
// pode exportar valores não-função) e os componentes cliente.

export const PERIODICIDADES = ['mensal', 'trimestral', 'semestral', 'anual', 'pontual'] as const

export type Periodicidade = (typeof PERIODICIDADES)[number]

export const PERIODICIDADE_LABEL: Record<Periodicidade, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  pontual: 'Pontual (sem renovação)',
}
