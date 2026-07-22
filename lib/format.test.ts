import { describe, expect, it } from 'vitest'
import { formatData, formatDataHora, formatEuro } from './format'

// Os testes comparam contra o próprio Intl (em vez de fixar a string exata
// "1 234,50 €") para não ficarem frágeis a diferenças de dados ICU entre
// máquinas/versões do Node — o que interessa validar é o comportamento da
// função (delegação para Intl, parsing de string, fallback para valores
// inválidos), não o formato exato do pt-PT.
function euro(n: number) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(n)
}

function data(d: Date) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

function dataHora(d: Date) {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

describe('formatEuro', () => {
  it('formata um número', () => {
    expect(formatEuro(1234.5)).toBe(euro(1234.5))
  })

  it('aceita uma string numérica', () => {
    expect(formatEuro('99.90')).toBe(euro(99.9))
  })

  it('formata valores negativos', () => {
    expect(formatEuro(-50)).toBe(euro(-50))
  })

  it('trata uma string não numérica como zero, em vez de rebentar', () => {
    expect(formatEuro('não é um número')).toBe(euro(0))
  })

  it('trata NaN como zero', () => {
    expect(formatEuro(Number.NaN)).toBe(euro(0))
  })

  it('trata Infinity como zero', () => {
    expect(formatEuro(Number.POSITIVE_INFINITY)).toBe(euro(0))
  })
})

describe('formatData', () => {
  it('formata uma Date', () => {
    const d = new Date('2026-03-05T10:00:00Z')
    expect(formatData(d)).toBe(data(d))
  })

  it('aceita uma string de data', () => {
    const iso = '2026-03-05T10:00:00Z'
    expect(formatData(iso)).toBe(data(new Date(iso)))
  })
})

describe('formatDataHora', () => {
  it('formata uma Date com hora e minuto', () => {
    const d = new Date('2026-03-05T14:30:00Z')
    expect(formatDataHora(d)).toBe(dataHora(d))
  })

  it('aceita uma string de data', () => {
    const iso = '2026-03-05T14:30:00Z'
    expect(formatDataHora(iso)).toBe(dataHora(new Date(iso)))
  })
})
