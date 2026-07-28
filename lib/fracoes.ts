// Tipos e constantes puras sobre frações — sem dependência de base de dados,
// para poder ser importado tanto em Server Actions como em Client Components
// (mesmo padrão de lib/perfis.ts).

export type TipoTitular =
  | 'proprietario'
  | 'inquilino'
  | 'usufrutuario'
  | 'locatario'
  | 'antigo'

export const TIPOS_TITULAR: TipoTitular[] = [
  'proprietario',
  'inquilino',
  'usufrutuario',
  'locatario',
  'antigo',
]

export const TIPO_TITULAR_LABEL: Record<TipoTitular, string> = {
  proprietario: 'Proprietário',
  inquilino: 'Inquilino',
  usufrutuario: 'Usufrutuário',
  locatario: 'Locatário',
  antigo: 'Antigo condómino',
}

// Soma máxima de permilagem entre todas as frações de um condomínio — o
// próprio conceito de permilagem (quota-parte em milésimos) implica que a
// soma nunca deveria ultrapassar 1000‰, ao contrário de ficar abaixo (uma
// fração ainda por registar é uma situação transitória normal, não um
// erro). Ver FUNCTIONAL_GAPS.md, "Permilagens".
export const PERMILAGEM_TOTAL_MAX = 1000

export function excedePermilagemTotal(somaOutrasFracoes: number, novaPermilagem: number): boolean {
  return somaOutrasFracoes + novaPermilagem > PERMILAGEM_TOTAL_MAX
}

export const DECISOES_SALDO = ['transferido', 'mantido_vendedor', 'regularizado'] as const

export type DecisaoSaldo = (typeof DECISOES_SALDO)[number]

export const DECISAO_SALDO_LABEL: Record<DecisaoSaldo, string> = {
  transferido: 'Transferido para o novo titular',
  mantido_vendedor: 'Mantido como dívida do vendedor',
  regularizado: 'Regularizado no ato da escritura',
}
