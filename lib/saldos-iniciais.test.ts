import { describe, expect, it } from 'vitest'
import { lerValorEuros, parsearSaldosIniciais, validarConjuntoSaldos } from '@/lib/saldos-iniciais'

describe('lerValorEuros', () => {
  it('aceita vírgula decimal, como se escreve em Portugal', () => {
    expect(lerValorEuros('125,50')).toBe(125.5)
  })

  it('aceita ponto como separador de milhares quando há também vírgula decimal', () => {
    expect(lerValorEuros('1.234,56')).toBe(1234.56)
  })

  it('trata o ponto como decimal quando é o único símbolo', () => {
    expect(lerValorEuros('1234.56')).toBe(1234.56)
  })

  it('aceita valores inteiros e ignora o símbolo do euro e espaços', () => {
    expect(lerValorEuros('250')).toBe(250)
    expect(lerValorEuros(' 250,00 € ')).toBe(250)
  })

  it('rejeita zero e valores negativos — um saldo inicial é uma dívida', () => {
    expect(lerValorEuros('0')).toBeNull()
    expect(lerValorEuros('0,00')).toBeNull()
    expect(lerValorEuros('-50')).toBeNull()
  })

  it('rejeita mais de dois cêntimos e texto', () => {
    expect(lerValorEuros('12,345')).toBeNull()
    expect(lerValorEuros('cem euros')).toBeNull()
    expect(lerValorEuros('')).toBeNull()
  })
})

describe('parsearSaldosIniciais', () => {
  it('lê linhas separadas por tabulação e por ponto e vírgula', () => {
    const porTab = parsearSaldosIniciais('1ºDto\t125,50')
    const porPontoVirgula = parsearSaldosIniciais('1ºDto; 125,50')
    expect(porTab.linhas[0]).toMatchObject({ identificacao: '1ºDto', valor: 125.5 })
    expect(porPontoVirgula.linhas[0]).toMatchObject({ identificacao: '1ºDto', valor: 125.5 })
  })

  it('não parte o valor pela vírgula decimal', () => {
    const { linhas, erros } = parsearSaldosIniciais('1ºDto; 1.234,56')
    expect(erros).toEqual([])
    expect(linhas[0].valor).toBe(1234.56)
  })

  it('ignora linhas vazias', () => {
    const { linhas, erros } = parsearSaldosIniciais('\n1ºDto;10\n\n  \n1ºEsq;20\n')
    expect(erros).toEqual([])
    expect(linhas).toHaveLength(2)
  })

  it('aponta a linha de cada problema e mantém as boas', () => {
    const { linhas, erros } = parsearSaldosIniciais('1ºDto;10\nsó-isto\n1ºEsq;abc\n2ºDto;20')
    expect(linhas.map((l) => l.identificacao)).toEqual(['1ºDto', '2ºDto'])
    expect(erros).toHaveLength(2)
    expect(erros[0].numeroLinha).toBe(2)
    expect(erros[1].numeroLinha).toBe(3)
  })

  it('rejeita uma linha sem identificação', () => {
    const { erros } = parsearSaldosIniciais('; 100')
    expect(erros[0].erro).toContain('identificação')
  })

  it('rejeita um valor de zero com mensagem sobre ser maior do que zero', () => {
    const { erros } = parsearSaldosIniciais('1ºDto; 0')
    expect(erros[0].erro).toContain('maior do que zero')
  })
})

describe('validarConjuntoSaldos', () => {
  const linha = (identificacao: string, numeroLinha = 1) => ({
    numeroLinha,
    identificacao,
    valor: 100,
  })

  it('aceita frações que existem', () => {
    expect(validarConjuntoSaldos([linha('1ºDto'), linha('1ºEsq', 2)], ['1ºDto', '1ºEsq'])).toEqual([])
  })

  it('recusa uma fração que não existe no condomínio', () => {
    const erros = validarConjuntoSaldos([linha('9ºDto')], ['1ºDto'])
    expect(erros[0]).toContain('Não existe nenhuma fração')
    expect(erros[0]).toContain('linha 1')
  })

  it('compara ignorando maiúsculas e espaços', () => {
    expect(validarConjuntoSaldos([linha('  1ºdto ')], ['1ºDto'])).toEqual([])
  })

  it('deteta a mesma fração repetida, que somaria em silêncio', () => {
    const erros = validarConjuntoSaldos([linha('1ºDto'), linha('1ºDto', 2)], ['1ºDto'])
    expect(erros[0]).toContain('duas vezes')
    expect(erros[0]).toContain('Some os valores')
  })
})
