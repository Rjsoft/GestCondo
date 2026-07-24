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

export const TIPOS_CONTA = ['ordem', 'prazo', 'caixa', 'transitoria'] as const

export const TIPO_CONTA_LABEL: Record<string, string> = {
  ordem: 'Conta à ordem',
  prazo: 'Conta a prazo',
  caixa: 'Caixa (numerário)',
  transitoria: 'Conta transitória',
}

export const ESTADO_EXERCICIO_LABEL: Record<string, string> = {
  aberto: 'Aberto',
  fechado: 'Fechado',
}

export const ESTADO_CONTA_LABEL: Record<string, string> = {
  ativa: 'Ativa',
  encerrada: 'Encerrada',
}

// Mensagens de validação partilhadas entre a server action que valida (e
// lança o erro) e o diálogo cliente que o mostra junto do campo (L3,
// docs/audit/ACCESSIBILITY_AUDIT.md) — uma só fonte de verdade, nunca
// texto duplicado nos dois lados.
export const MSG_CONTA = {
  nomeObrigatorio: 'Preencha o nome da conta',
  tipoInvalido: 'Tipo de conta inválido',
  caixaSemIban: 'Uma conta de caixa não tem IBAN',
  notaTransitoriaObrigatoria: 'Indique o motivo desta conta temporária ou de transição',
  ibanInvalido: 'O IBAN indicado não é válido — confirme se foi copiado corretamente',
} as const

export const MSG_EXERCICIO = {
  dataFimAntesDoInicio: 'A data de fim tem de ser posterior à data de início',
} as const
