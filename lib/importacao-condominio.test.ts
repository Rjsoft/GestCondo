import { describe, expect, it } from 'vitest'
import { paraData, paraDataOuNula, remapear, remapearOpcional } from './importacao-condominio'

describe('paraData / paraDataOuNula', () => {
  it('converte uma string ISO (como vem de JSON.parse) numa Date', () => {
    const d = paraData('2026-07-21T10:00:00.000Z')
    expect(d).toBeInstanceOf(Date)
    expect(d.toISOString()).toBe('2026-07-21T10:00:00.000Z')
  })

  it('paraDataOuNula devolve null para null/undefined', () => {
    expect(paraDataOuNula(null)).toBeNull()
    expect(paraDataOuNula(undefined)).toBeNull()
  })

  it('paraDataOuNula converte um valor presente', () => {
    expect(paraDataOuNula('2026-01-01T00:00:00.000Z')).toBeInstanceOf(Date)
  })
})

describe('remapear / remapearOpcional', () => {
  it('traduz um id antigo para o novo id correspondente', () => {
    const mapa = new Map([[1, 101], [2, 102]])
    expect(remapear(mapa, 1)).toBe(101)
    expect(remapear(mapa, 2)).toBe(102)
  })

  it('lança erro quando o id antigo não está no mapa (ficheiro inconsistente)', () => {
    const mapa = new Map([[1, 101]])
    expect(() => remapear(mapa, 999)).toThrow(/inconsistente/)
  })

  it('remapearOpcional passa null através sem remapear', () => {
    const mapa = new Map([[1, 101]])
    expect(remapearOpcional(mapa, null)).toBeNull()
  })

  it('remapearOpcional remapeia um id presente', () => {
    const mapa = new Map([[1, 101]])
    expect(remapearOpcional(mapa, 1)).toBe(101)
  })

  it('remapearOpcional lança erro para um id não-nulo ausente do mapa', () => {
    const mapa = new Map<number, number>()
    expect(() => remapearOpcional(mapa, 5)).toThrow(/inconsistente/)
  })
})
