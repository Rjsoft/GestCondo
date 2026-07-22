import { describe, expect, it } from 'vitest'
import { calcularQuotasMensais } from './rateio'

describe('calcularQuotasMensais', () => {
  it('rateia proporcionalmente por permilagem quando a soma é 1000‰', () => {
    const fracoes = [
      { id: 1, permilagem: 600 },
      { id: 2, permilagem: 400 },
    ]
    const resultado = calcularQuotasMensais(fracoes, 1200)
    expect(resultado).toEqual([
      { fracaoId: 1, valorMensal: 60 }, // 1200 * 0.6 / 12
      { fracaoId: 2, valorMensal: 40 }, // 1200 * 0.4 / 12
    ])
  })

  it('continua proporcionalmente correto quando a soma das permilagens não é 1000‰', () => {
    const fracoes = [
      { id: 1, permilagem: 300 },
      { id: 2, permilagem: 300 },
    ]
    // Soma = 600‰, não 1000‰ — o rateio usa a soma real, não um total fixo.
    const resultado = calcularQuotasMensais(fracoes, 1200)
    expect(resultado).toEqual([
      { fracaoId: 1, valorMensal: 50 },
      { fracaoId: 2, valorMensal: 50 },
    ])
  })

  it('arredonda a 2 casas decimais', () => {
    const fracoes = [
      { id: 1, permilagem: 333 },
      { id: 2, permilagem: 667 },
    ]
    const resultado = calcularQuotasMensais(fracoes, 1000)
    expect(resultado[0].valorMensal).toBeCloseTo(27.75, 2)
    expect(resultado[1].valorMensal).toBeCloseTo(55.58, 2)
  })

  it('lança erro quando nenhuma fração tem permilagem', () => {
    const fracoes = [
      { id: 1, permilagem: 0 },
      { id: 2, permilagem: 0 },
    ]
    expect(() => calcularQuotasMensais(fracoes, 1200)).toThrow(
      /não é possível ratear/,
    )
  })

  it('isenta do elevador quem está marcado, rateando o resto pelas restantes', () => {
    // R/C isento de elevador; dois pisos com direito a elevador, permilagem
    // igual entre os três. Parcela geral: por permilagem entre os três.
    // Parcela elevador: só entre os dois com direito, 50/50.
    const fracoes = [
      { id: 1, permilagem: 300, isentaElevador: true }, // R/C
      { id: 2, permilagem: 350, isentaElevador: false },
      { id: 3, permilagem: 350, isentaElevador: false },
    ]
    const resultado = calcularQuotasMensais(fracoes, 1200, 600)
    // Geral: 1200/12 = 100/mês total, dividido 300/350/350 de 1000.
    const rc = resultado.find((r) => r.fracaoId === 1)!
    const piso2 = resultado.find((r) => r.fracaoId === 2)!
    const piso3 = resultado.find((r) => r.fracaoId === 3)!

    expect(rc.valorMensal).toBeCloseTo((1200 * 0.3) / 12, 2) // só parte geral
    expect(piso2.valorMensal).toBeCloseTo((1200 * 0.35) / 12 + (600 * 0.5) / 12, 2)
    expect(piso3.valorMensal).toBeCloseTo((1200 * 0.35) / 12 + (600 * 0.5) / 12, 2)
  })

  it('lança erro se todas as frações estiverem isentas do elevador mas há valor a ratear', () => {
    const fracoes = [
      { id: 1, permilagem: 500, isentaElevador: true },
      { id: 2, permilagem: 500, isentaElevador: true },
    ]
    expect(() => calcularQuotasMensais(fracoes, 1200, 600)).toThrow(
      /todas as frações estão isentas/i,
    )
  })

  it('sem valorAnualElevador, comporta-se como antes (sem isenção nenhuma)', () => {
    const fracoes = [
      { id: 1, permilagem: 500, isentaElevador: true },
      { id: 2, permilagem: 500, isentaElevador: false },
    ]
    const resultado = calcularQuotasMensais(fracoes, 1200)
    expect(resultado).toEqual([
      { fracaoId: 1, valorMensal: 50 },
      { fracaoId: 2, valorMensal: 50 },
    ])
  })
})
