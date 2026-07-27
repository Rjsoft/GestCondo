import { describe, expect, it } from 'vitest'
import { calcularAntiguidadeDivida } from './antiguidade-divida'

const HOJE = new Date('2026-07-27T00:00:00Z')

function diasAntes(dias: number): Date {
  return new Date(HOJE.getTime() - dias * 24 * 60 * 60 * 1000)
}

describe('calcularAntiguidadeDivida', () => {
  it('agrupa uma quota em cada escalão pelo número de dias de atraso', () => {
    const quotas = [
      { fracaoId: 1, valor: 50, data: diasAntes(10) }, // 0-30
      { fracaoId: 1, valor: 60, data: diasAntes(45) }, // 31-60
      { fracaoId: 1, valor: 70, data: diasAntes(75) }, // 61-90
      { fracaoId: 1, valor: 80, data: diasAntes(150) }, // 91-180
      { fracaoId: 1, valor: 90, data: diasAntes(300) }, // 181-365
      { fracaoId: 1, valor: 100, data: diasAntes(400) }, // 365+
    ]
    const [resultado] = calcularAntiguidadeDivida(quotas, HOJE)
    expect(resultado.fracaoId).toBe(1)
    expect(resultado.escaloes).toEqual({
      '0-30': 50,
      '31-60': 60,
      '61-90': 70,
      '91-180': 80,
      '181-365': 90,
      '365+': 100,
    })
    expect(resultado.total).toBe(450)
  })

  it('soma várias quotas no mesmo escalão', () => {
    const quotas = [
      { fracaoId: 1, valor: 50, data: diasAntes(5) },
      { fracaoId: 1, valor: 30, data: diasAntes(20) },
    ]
    const [resultado] = calcularAntiguidadeDivida(quotas, HOJE)
    expect(resultado.escaloes['0-30']).toBe(80)
    expect(resultado.total).toBe(80)
  })

  it('separa por fração', () => {
    const quotas = [
      { fracaoId: 1, valor: 50, data: diasAntes(5) },
      { fracaoId: 2, valor: 100, data: diasAntes(400) },
    ]
    const resultado = calcularAntiguidadeDivida(quotas, HOJE)
    const f1 = resultado.find((r) => r.fracaoId === 1)!
    const f2 = resultado.find((r) => r.fracaoId === 2)!
    expect(f1.escaloes['0-30']).toBe(50)
    expect(f1.total).toBe(50)
    expect(f2.escaloes['365+']).toBe(100)
    expect(f2.total).toBe(100)
  })

  it('devolve lista vazia sem quotas', () => {
    expect(calcularAntiguidadeDivida([], HOJE)).toEqual([])
  })

  it('quota vencida exatamente hoje (0 dias) cai no primeiro escalão', () => {
    const [resultado] = calcularAntiguidadeDivida([{ fracaoId: 1, valor: 20, data: HOJE }], HOJE)
    expect(resultado.escaloes['0-30']).toBe(20)
  })

  it('arredonda a 2 casas decimais', () => {
    const quotas = [
      { fracaoId: 1, valor: 10.005, data: diasAntes(5) },
      { fracaoId: 1, valor: 10.005, data: diasAntes(6) },
    ]
    const [resultado] = calcularAntiguidadeDivida(quotas, HOJE)
    expect(resultado.escaloes['0-30']).toBeCloseTo(20.01, 2)
  })
})
