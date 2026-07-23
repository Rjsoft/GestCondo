// Constantes puras de finanças (rótulos de enums) — sem dependência de base
// de dados, para poder ser importado tanto em Server Actions/Components
// como em Client Components (mesmo padrão de lib/perfis.ts, lib/fracoes.ts).

export const TIPO_MOVIMENTO_LABEL: Record<string, string> = {
  receita: 'Receita (quota)',
  despesa: 'Despesa',
}

export const DESTINO_LABEL: Record<string, string> = {
  geral: 'Conta corrente do condomínio',
  reserva: 'Fundo de reserva',
}

export const MEIO_PAGAMENTO_LABEL: Record<string, string> = {
  transferencia: 'Transferência',
  multibanco: 'Multibanco',
  numerario: 'Numerário',
  cheque: 'Cheque',
  outro: 'Outro',
}

export const TIPO_SEGURO_LABEL: Record<string, string> = {
  multirriscos: 'Multirriscos',
  incendio: 'Incêndio',
  outro: 'Outro',
}
