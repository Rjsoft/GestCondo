import { describe, expect, it } from 'vitest'
import {
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
