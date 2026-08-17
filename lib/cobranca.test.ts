import { describe, expect, it } from 'vitest'
import {
  calcularDivergenciaPlano,
  ehEstadoTerminal,
  prestacoesEmAtraso,
  transicaoEstruturalmenteValida,
} from './cobranca'

describe('ehEstadoTerminal', () => {
  it('identifica os três estados terminais', () => {
    expect(ehEstadoTerminal('regularizado')).toBe(true)
    expect(ehEstadoTerminal('encerrado')).toBe(true)
    expect(ehEstadoTerminal('cancelado')).toBe(true)
  })

  it('não trata estados intermédios como terminais', () => {
    expect(ehEstadoTerminal('em_atraso')).toBe(false)
    expect(ehEstadoTerminal('acordo_prestacional')).toBe(false)
    expect(ehEstadoTerminal('processo_judicial')).toBe(false)
  })
})

describe('transicaoEstruturalmenteValida', () => {
  it('rejeita sair de um estado terminal', () => {
    const r = transicaoEstruturalmenteValida('regularizado', 'em_atraso', { temNota: true })
    expect(r.valida).toBe(false)
    expect(r.motivo).toMatch(/já está terminado/)
  })

  it('rejeita um estado desconhecido', () => {
    const r = transicaoEstruturalmenteValida('em_atraso', 'estado_inventado', { temNota: true })
    expect(r.valida).toBe(false)
  })

  it('rejeita transitar para o mesmo estado', () => {
    const r = transicaoEstruturalmenteValida('negociacao', 'negociacao', { temNota: true })
    expect(r.valida).toBe(false)
  })

  it('exige nota para encerrado e cancelado', () => {
    expect(transicaoEstruturalmenteValida('em_atraso', 'encerrado', { temNota: false }).valida).toBe(false)
    expect(transicaoEstruturalmenteValida('em_atraso', 'cancelado', { temNota: false }).valida).toBe(false)
    expect(transicaoEstruturalmenteValida('em_atraso', 'encerrado', { temNota: true }).valida).toBe(true)
  })

  it('aceita qualquer estado não-terminal para qualquer outro não-terminal, sem sequência imposta', () => {
    expect(transicaoEstruturalmenteValida('em_atraso', 'processo_judicial', { temNota: false }).valida).toBe(true)
    expect(transicaoEstruturalmenteValida('processo_judicial', 'negociacao', { temNota: false }).valida).toBe(true)
    expect(transicaoEstruturalmenteValida('acordo_prestacional', 'lembrete_informal', { temNota: false }).valida).toBe(
      true,
    )
  })

  it('aceita transitar para regularizado sem exigir nota (a validação da dívida real é feita à parte)', () => {
    expect(transicaoEstruturalmenteValida('acordo_prestacional', 'regularizado', { temNota: false }).valida).toBe(
      true,
    )
  })
})

describe('prestacoesEmAtraso', () => {
  const hoje = new Date('2026-08-17T00:00:00Z')

  it('devolve só as pendentes com data prevista já passada', () => {
    const prestacoes = [
      { id: 1, estado: 'pendente', dataPrevista: new Date('2026-07-01') },
      { id: 2, estado: 'pendente', dataPrevista: new Date('2026-09-01') },
      { id: 3, estado: 'cumprida', dataPrevista: new Date('2026-06-01') },
    ]
    const resultado = prestacoesEmAtraso(prestacoes, hoje)
    expect(resultado.map((p) => p.id)).toEqual([1])
  })

  it('não considera nada em atraso quando não há prestações pendentes vencidas', () => {
    const prestacoes = [{ id: 1, estado: 'cumprida', dataPrevista: new Date('2026-01-01') }]
    expect(prestacoesEmAtraso(prestacoes, hoje)).toEqual([])
  })
})

describe('calcularDivergenciaPlano', () => {
  it('sem divergência quando o total do plano bate certo com a dívida real', () => {
    expect(calcularDivergenciaPlano(1200, 1200)).toEqual({ diferenca: 0, temDivergencia: false })
  })

  it('assinala divergência quando os valores diferem', () => {
    const r = calcularDivergenciaPlano(1000, 1200)
    expect(r.diferenca).toBeCloseTo(-200, 2)
    expect(r.temDivergencia).toBe(true)
  })

  it('tolera diferenças de arredondamento de cêntimos', () => {
    expect(calcularDivergenciaPlano(100.001, 100)).toEqual({ diferenca: 0, temDivergencia: false })
  })
})
