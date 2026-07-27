import { describe, expect, it } from 'vitest'
import { calcularEstadoLembretes } from './lembrete-cobranca'
import type { ChaveEscalao } from './antiguidade-divida'

function escaloes(parcial: Partial<Record<ChaveEscalao, number>>): Record<ChaveEscalao, number> {
  return {
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '91-180': 0,
    '181-365': 0,
    '365+': 0,
    ...parcial,
  }
}

describe('calcularEstadoLembretes', () => {
  it('nenhum nível disponível sem dívida nos escalões relevantes', () => {
    const r = calcularEstadoLembretes(escaloes({ '0-30': 50 }), [])
    expect(r.every((n) => !n.disponivel)).toBe(true)
  })

  it('1º lembrete disponível quando há dívida no escalão 31-60', () => {
    const r = calcularEstadoLembretes(escaloes({ '31-60': 80 }), [])
    const nivel1 = r.find((n) => n.chave === '31-60')
    expect(nivel1?.disponivel).toBe(true)
    expect(nivel1?.ultimoEnvio).toBeNull()
  })

  it('devolve a data do envio mais recente para o escalão', () => {
    const historico = [
      { escalao: '31-60', dataEnvio: new Date('2026-01-01') },
      { escalao: '31-60', dataEnvio: new Date('2026-02-01') },
    ]
    const r = calcularEstadoLembretes(escaloes({ '31-60': 80 }), historico)
    const nivel1 = r.find((n) => n.chave === '31-60')
    expect(nivel1?.ultimoEnvio).toEqual(new Date('2026-02-01'))
  })

  it('disponibilidade não é bloqueada por já ter sido enviado antes', () => {
    const historico = [{ escalao: '61-90', dataEnvio: new Date('2026-01-01') }]
    const r = calcularEstadoLembretes(escaloes({ '61-90': 40 }), historico)
    const nivel2 = r.find((n) => n.chave === '61-90')
    expect(nivel2?.disponivel).toBe(true)
    expect(nivel2?.ultimoEnvio).toEqual(new Date('2026-01-01'))
  })

  it('escalões acima de 90 dias não geram níveis próprios (2 níveis apenas)', () => {
    const r = calcularEstadoLembretes(escaloes({ '91-180': 200 }), [])
    expect(r).toHaveLength(2)
    expect(r.every((n) => !n.disponivel)).toBe(true)
  })
})
