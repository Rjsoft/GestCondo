import { describe, expect, it } from 'vitest'
import { excedePermilagemTotal } from './fracoes'

describe('excedePermilagemTotal', () => {
  it('não excede quando a soma fica abaixo de 1000‰', () => {
    expect(excedePermilagemTotal(500, 400)).toBe(false)
  })

  it('não excede quando a soma é exatamente 1000‰', () => {
    expect(excedePermilagemTotal(600, 400)).toBe(false)
  })

  it('excede quando a soma ultrapassa 1000‰', () => {
    expect(excedePermilagemTotal(700, 400)).toBe(true)
  })

  it('não excede quando não há outras frações', () => {
    expect(excedePermilagemTotal(0, 1000)).toBe(false)
  })
})
