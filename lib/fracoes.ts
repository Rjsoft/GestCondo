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
