import { describe, expect, it } from 'vitest'
import {
  formatarLogOperacaoMassa,
  ibanValido,
  mascararIban,
  mensagemErroSobreposicaoExercicio,
  normalizarIban,
} from './contas-financeiras'

describe('normalizarIban', () => {
  it('remove espaços e converte para maiúsculas', () => {
    expect(normalizarIban('gb29 nwbk 6016 1331 9268 19')).toBe('GB29NWBK60161331926819')
  })
})

describe('ibanValido', () => {
  it('aceita um IBAN válido (checksum mod-97 correto)', () => {
    expect(ibanValido('GB29 NWBK 6016 1331 9268 19')).toBe(true)
  })

  it('rejeita um IBAN com checksum inválido', () => {
    expect(ibanValido('GB29NWBK60161331926818')).toBe(false)
  })

  it('rejeita texto demasiado curto', () => {
    expect(ibanValido('PT50123')).toBe(false)
  })

  it('rejeita texto com formato inválido (sem código de país)', () => {
    expect(ibanValido('123456789012345')).toBe(false)
  })
})

describe('mascararIban', () => {
  it('mostra só os últimos 4 caracteres', () => {
    expect(mascararIban('GB29 NWBK 6016 1331 9268 19')).toBe('•••• 6819')
  })

  it('devolve null quando não há IBAN', () => {
    expect(mascararIban(null)).toBeNull()
  })
})

describe('mensagemErroSobreposicaoExercicio', () => {
  it('traduz o código 23P01 para uma mensagem simples', () => {
    expect(mensagemErroSobreposicaoExercicio({ code: '23P01' })).toBe(
      'Já existe um exercício que inclui parte deste período. Altere as datas para que os exercícios não se sobreponham.',
    )
  })

  it('devolve null para outros erros', () => {
    expect(mensagemErroSobreposicaoExercicio({ code: '23505' })).toBeNull()
    expect(mensagemErroSobreposicaoExercicio(new Error('outro erro'))).toBeNull()
  })
})

describe('formatarLogOperacaoMassa', () => {
  it('não inclui lista de IDs quando não há registos afetados', () => {
    const texto = formatarLogOperacaoMassa({
      operacaoId: 'op-1',
      tipo: 'associacao-exercicio',
      descricao: '0 movimento(s) associado(s)',
      nomeEntidades: 'IDs de movimentos',
      ids: [],
    })
    expect(texto).toBe('0 movimento(s) associado(s) [operação op-1, tipo: associacao-exercicio]')
  })

  it('ordena os IDs antes de os incluir na amostra', () => {
    const texto = formatarLogOperacaoMassa({
      operacaoId: 'op-2',
      tipo: 'associacao-conta',
      descricao: '3 movimento(s) associado(s)',
      nomeEntidades: 'IDs de movimentos',
      ids: [21, 3, 18],
    })
    expect(texto).toContain('IDs de movimentos (amostra): 3, 18, 21.')
    expect(texto).not.toContain('não listados')
  })

  it('limita a amostra a 10 IDs e indica quantos ficaram de fora', () => {
    const onze = Array.from({ length: 11 }, (_, i) => i + 1)
    const texto = formatarLogOperacaoMassa({
      operacaoId: 'op-3',
      tipo: 'transporte-saldos',
      descricao: 'Saldo transportado para 11 conta(s)',
      nomeEntidades: 'IDs de contas',
      ids: onze,
    })
    expect(texto).toContain('IDs de contas (amostra): 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 (+1 não listados).')
  })

  it('não trunca quando há exatamente 10 IDs', () => {
    const dez = Array.from({ length: 10 }, (_, i) => i + 1)
    const texto = formatarLogOperacaoMassa({
      operacaoId: 'op-4',
      tipo: 'associacao-exercicio',
      descricao: '10 movimento(s) associado(s)',
      nomeEntidades: 'IDs de movimentos',
      ids: dez,
    })
    expect(texto).toContain('IDs de movimentos (amostra): 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.')
    expect(texto).not.toContain('não listados')
  })

  it('inclui o operacaoId e o tipo no texto, sem alterar os dados originais', () => {
    const ids = [5, 2]
    const texto = formatarLogOperacaoMassa({
      operacaoId: 'abc-123',
      tipo: 'associacao-conta',
      descricao: 'Descrição',
      nomeEntidades: 'IDs de movimentos',
      ids,
    })
    expect(texto).toContain('[operação abc-123, tipo: associacao-conta]')
    expect(ids).toEqual([5, 2]) // não muta o array recebido
  })
})
