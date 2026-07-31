import { describe, expect, it } from 'vitest'
import {
  detetarAtasPorEscrever,
  detetarFracoesSemPermilagem,
  detetarMovimentosDuplicados,
  detetarPontosSemResultado,
} from './inconsistencias'

describe('detetarFracoesSemPermilagem', () => {
  it('sinaliza frações com permilagem exatamente 0', () => {
    const r = detetarFracoesSemPermilagem([
      { id: 1, identificacao: 'R/C Dto', permilagem: 0 },
      { id: 2, identificacao: '1º Esq', permilagem: 375 },
    ])
    expect(r).toHaveLength(1)
    expect(r[0].titulo).toContain('R/C Dto')
  })

  it('não sinaliza frações com permilagem preenchida', () => {
    expect(
      detetarFracoesSemPermilagem([{ id: 1, identificacao: 'R/C Dto', permilagem: 250 }]),
    ).toEqual([])
  })

  it('devolve lista vazia sem frações', () => {
    expect(detetarFracoesSemPermilagem([])).toEqual([])
  })
})

describe('detetarMovimentosDuplicados', () => {
  it('sinaliza dois movimentos com a mesma fração, valor, data e tipo', () => {
    const data = new Date('2027-01-15')
    const r = detetarMovimentosDuplicados([
      { id: 1, fracaoId: 1, valor: 100, data, tipo: 'receita', descricao: 'Quota janeiro' },
      { id: 2, fracaoId: 1, valor: 100, data, tipo: 'receita', descricao: 'Quota janeiro' },
    ])
    expect(r).toHaveLength(1)
    expect(r[0].detalhe).toContain('2 movimentos')
  })

  it('não sinaliza movimentos com valores diferentes', () => {
    const data = new Date('2027-01-15')
    const r = detetarMovimentosDuplicados([
      { id: 1, fracaoId: 1, valor: 100, data, tipo: 'receita', descricao: 'Quota' },
      { id: 2, fracaoId: 1, valor: 150, data, tipo: 'receita', descricao: 'Quota' },
    ])
    expect(r).toEqual([])
  })

  it('não sinaliza movimentos em dias diferentes', () => {
    const r = detetarMovimentosDuplicados([
      { id: 1, fracaoId: 1, valor: 100, data: new Date('2027-01-15'), tipo: 'receita', descricao: 'Quota' },
      { id: 2, fracaoId: 1, valor: 100, data: new Date('2027-02-15'), tipo: 'receita', descricao: 'Quota' },
    ])
    expect(r).toEqual([])
  })

  it('ignora movimentos sem fração associada (nunca comparados entre si)', () => {
    const data = new Date('2027-01-15')
    const r = detetarMovimentosDuplicados([
      { id: 1, fracaoId: null, valor: 100, data, tipo: 'despesa', descricao: 'Limpeza' },
      { id: 2, fracaoId: null, valor: 100, data, tipo: 'despesa', descricao: 'Limpeza' },
    ])
    expect(r).toEqual([])
  })

  it('não sinaliza receita e despesa com o mesmo valor/data/fração (tipos diferentes)', () => {
    const data = new Date('2027-01-15')
    const r = detetarMovimentosDuplicados([
      { id: 1, fracaoId: 1, valor: 100, data, tipo: 'receita', descricao: 'Quota' },
      { id: 2, fracaoId: 1, valor: 100, data, tipo: 'despesa', descricao: 'Reparação' },
    ])
    expect(r).toEqual([])
  })

  it('agrupa três ou mais duplicados na mesma entrada', () => {
    const data = new Date('2027-01-15')
    const r = detetarMovimentosDuplicados([
      { id: 1, fracaoId: 1, valor: 100, data, tipo: 'receita', descricao: 'Quota' },
      { id: 2, fracaoId: 1, valor: 100, data, tipo: 'receita', descricao: 'Quota' },
      { id: 3, fracaoId: 1, valor: 100, data, tipo: 'receita', descricao: 'Quota' },
    ])
    expect(r).toHaveLength(1)
    expect(r[0].detalhe).toContain('3 movimentos')
  })
})

describe('detetarAtasPorEscrever', () => {
  it('sinaliza assembleia realizada há mais de 30 dias sem ata', () => {
    const hoje = new Date('2027-03-01')
    const r = detetarAtasPorEscrever(
      [{ id: 1, dataPrimeiraConvocatoria: new Date('2027-01-01'), estado: 'realizada', textoAta: null }],
      hoje,
    )
    expect(r).toHaveLength(1)
  })

  it('não sinaliza se a ata já foi escrita', () => {
    const hoje = new Date('2027-03-01')
    const r = detetarAtasPorEscrever(
      [{ id: 1, dataPrimeiraConvocatoria: new Date('2027-01-01'), estado: 'realizada', textoAta: 'Texto da ata' }],
      hoje,
    )
    expect(r).toEqual([])
  })

  it('não sinaliza dentro do prazo (ainda não passaram 30 dias)', () => {
    const hoje = new Date('2027-01-10')
    const r = detetarAtasPorEscrever(
      [{ id: 1, dataPrimeiraConvocatoria: new Date('2027-01-01'), estado: 'realizada', textoAta: null }],
      hoje,
    )
    expect(r).toEqual([])
  })

  it('não sinaliza assembleias ainda só convocadas ou canceladas', () => {
    const hoje = new Date('2027-06-01')
    const r = detetarAtasPorEscrever(
      [
        { id: 1, dataPrimeiraConvocatoria: new Date('2027-01-01'), estado: 'convocada', textoAta: null },
        { id: 2, dataPrimeiraConvocatoria: new Date('2027-01-01'), estado: 'cancelada', textoAta: null },
      ],
      hoje,
    )
    expect(r).toEqual([])
  })

  it('aceita um prazo customizado', () => {
    const hoje = new Date('2027-01-10')
    const r = detetarAtasPorEscrever(
      [{ id: 1, dataPrimeiraConvocatoria: new Date('2027-01-01'), estado: 'realizada', textoAta: null }],
      hoje,
      5,
    )
    expect(r).toHaveLength(1)
  })
})

describe('detetarPontosSemResultado', () => {
  it('sinaliza ponto sem resultado numa assembleia realizada', () => {
    const r = detetarPontosSemResultado(
      [{ id: 1, dataPrimeiraConvocatoria: new Date('2027-01-01'), estado: 'realizada', textoAta: null }],
      [{ id: 10, assembleiaId: 1, titulo: 'Aprovação de contas', resultado: null }],
    )
    expect(r).toHaveLength(1)
  })

  it('sinaliza também em assembleias já aprovadas (ata fechada)', () => {
    const r = detetarPontosSemResultado(
      [{ id: 1, dataPrimeiraConvocatoria: new Date('2027-01-01'), estado: 'aprovada', textoAta: 'Ata' }],
      [{ id: 10, assembleiaId: 1, titulo: 'Aprovação de contas', resultado: null }],
    )
    expect(r).toHaveLength(1)
  })

  it('não sinaliza pontos já com resultado registado', () => {
    const r = detetarPontosSemResultado(
      [{ id: 1, dataPrimeiraConvocatoria: new Date('2027-01-01'), estado: 'realizada', textoAta: null }],
      [{ id: 10, assembleiaId: 1, titulo: 'Aprovação de contas', resultado: 'aprovado' }],
    )
    expect(r).toEqual([])
  })

  it('não sinaliza pontos de assembleias ainda só convocadas', () => {
    const r = detetarPontosSemResultado(
      [{ id: 1, dataPrimeiraConvocatoria: new Date('2027-01-01'), estado: 'convocada', textoAta: null }],
      [{ id: 10, assembleiaId: 1, titulo: 'Aprovação de contas', resultado: null }],
    )
    expect(r).toEqual([])
  })
})
