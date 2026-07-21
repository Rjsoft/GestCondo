import { describe, expect, it } from 'vitest'
import { calcularJurosMora, calcularJurosQuota } from './juros'

describe('calcularJurosQuota', () => {
  it('calcula juros simples proporcionais aos dias de atraso', () => {
    const hoje = new Date('2027-01-31')
    const quota = { valor: 1000, data: new Date('2027-01-01') } // 30 dias
    const r = calcularJurosQuota(quota, 4, hoje) // 4% ao ano
    expect(r.diasAtraso).toBe(30)
    // 1000 * 0.04 * (30/365) = 3.2876... arredondado a 3.29
    expect(r.valorJuros).toBeCloseTo(3.29, 2)
  })

  it('devolve 0 dias e 0 juros quando a data ainda não passou', () => {
    const hoje = new Date('2027-01-01')
    const quota = { valor: 1000, data: new Date('2027-02-01') }
    const r = calcularJurosQuota(quota, 4, hoje)
    expect(r.diasAtraso).toBe(0)
    expect(r.valorJuros).toBe(0)
  })

  it('devolve 0 dias e 0 juros quando a data é hoje', () => {
    const hoje = new Date('2027-01-01')
    const quota = { valor: 1000, data: new Date('2027-01-01') }
    const r = calcularJurosQuota(quota, 4, hoje)
    expect(r.diasAtraso).toBe(0)
    expect(r.valorJuros).toBe(0)
  })
})

describe('calcularJurosMora', () => {
  it('agrupa e soma os juros por fração, mantendo o detalhe por quota', () => {
    const hoje = new Date('2027-03-01')
    const quotas = [
      { fracaoId: 1, valor: 100, data: new Date('2027-01-01') }, // 59 dias
      { fracaoId: 1, valor: 100, data: new Date('2027-02-01') }, // 28 dias
      { fracaoId: 2, valor: 200, data: new Date('2027-01-01') }, // 59 dias
    ]
    const r = calcularJurosMora(quotas, 4, hoje)

    const fracao1 = r.find((f) => f.fracaoId === 1)!
    const fracao2 = r.find((f) => f.fracaoId === 2)!

    expect(fracao1.quotas).toHaveLength(2)
    expect(fracao1.valorJuros).toBeCloseTo(
      fracao1.quotas.reduce((s, q) => s + q.valorJuros, 0),
      2,
    )
    expect(fracao2.quotas).toHaveLength(1)
    expect(fracao2.valorJuros).toBeGreaterThan(0)
  })

  it('devolve lista vazia quando não há quotas em atraso', () => {
    expect(calcularJurosMora([], 4)).toEqual([])
  })
})
