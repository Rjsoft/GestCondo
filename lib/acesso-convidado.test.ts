import { describe, expect, it } from 'vitest'
import { acessoConvidadoAtivo } from './acesso-convidado'

describe('acessoConvidadoAtivo', () => {
  const futuro = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const passado = new Date(Date.now() - 24 * 60 * 60 * 1000)

  it('ativo: não revogado e ainda dentro do prazo', () => {
    expect(acessoConvidadoAtivo({ revogadoEm: null, expiraEm: futuro })).toBe(true)
  })

  it('inativo: revogado, mesmo dentro do prazo', () => {
    expect(acessoConvidadoAtivo({ revogadoEm: new Date(), expiraEm: futuro })).toBe(false)
  })

  it('inativo: prazo já passou', () => {
    expect(acessoConvidadoAtivo({ revogadoEm: null, expiraEm: passado })).toBe(false)
  })

  it('inativo: revogado e prazo já passou', () => {
    expect(acessoConvidadoAtivo({ revogadoEm: new Date(), expiraEm: passado })).toBe(false)
  })
})
