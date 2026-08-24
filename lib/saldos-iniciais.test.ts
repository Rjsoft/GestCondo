import { describe, expect, it } from 'vitest'
import {
  lerDataSaldo,
  lerValorEuros,
  parsearSaldosIniciais,
  validarConjuntoSaldos,
} from '@/lib/saldos-iniciais'

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

describe('lerDataSaldo', () => {
  it('lê um ano só como 31 de dezembro desse ano', () => {
    expect(lerDataSaldo('2023')).toBe('2023-12-31')
  })

  it('lê uma data portuguesa', () => {
    expect(lerDataSaldo('31/12/2023')).toBe('2023-12-31')
    expect(lerDataSaldo('1/3/2024')).toBe('2024-03-01')
  })

  it('lê uma data ISO', () => {
    expect(lerDataSaldo('2023-12-31')).toBe('2023-12-31')
  })

  it('rejeita datas que não existem, que o Date aceitaria e empurraria para o mês seguinte', () => {
    expect(lerDataSaldo('31/02/2024')).toBeNull()
    expect(lerDataSaldo('2023-02-30')).toBeNull()
  })

  it('rejeita texto e anos absurdos', () => {
    expect(lerDataSaldo('o ano passado')).toBeNull()
    expect(lerDataSaldo('1500')).toBeNull()
    expect(lerDataSaldo('')).toBeNull()
  })
})

describe('parsearSaldosIniciais — data por linha', () => {
  it('lê a data da terceira coluna', () => {
    const { linhas, erros } = parsearSaldosIniciais('1ºDto; 125,50; 2024')
    expect(erros).toEqual([])
    expect(linhas[0]).toMatchObject({ valor: 125.5, dataIso: '2024-12-31' })
  })

  it('deixa a data a null quando a linha não a traz', () => {
    expect(parsearSaldosIniciais('1ºDto; 125,50').linhas[0].dataIso).toBeNull()
  })

  it('aponta a linha quando a data é inválida', () => {
    const { erros } = parsearSaldosIniciais('1ºDto; 10; ontem')
    expect(erros[0].erro).toContain('não é uma data válida')
  })
})

describe('validarConjuntoSaldos', () => {
  const OMISSAO = '2025-12-31'
  const linha = (identificacao: string, numeroLinha = 1, dataIso: string | null = null) => ({
    numeroLinha,
    identificacao,
    valor: 100,
    dataIso,
  })

  it('aceita frações que existem', () => {
    expect(
      validarConjuntoSaldos([linha('1ºDto'), linha('1ºEsq', 2)], ['1ºDto', '1ºEsq'], OMISSAO),
    ).toEqual([])
  })

  it('recusa uma fração que não existe no condomínio', () => {
    const erros = validarConjuntoSaldos([linha('9ºDto')], ['1ºDto'], OMISSAO)
    expect(erros[0]).toContain('Não existe nenhuma fração')
    expect(erros[0]).toContain('linha 1')
  })

  it('compara ignorando maiúsculas e espaços', () => {
    expect(validarConjuntoSaldos([linha('  1ºdto ')], ['1ºDto'], OMISSAO)).toEqual([])
  })

  it('deteta a mesma fração com a MESMA data, que somaria em silêncio', () => {
    const erros = validarConjuntoSaldos([linha('1ºDto'), linha('1ºDto', 2)], ['1ºDto'], OMISSAO)
    expect(erros[0]).toContain('duas vezes com a mesma data')
  })

  // O ponto de toda esta alteração: dívidas de vários anos.
  it('aceita a mesma fração em anos diferentes', () => {
    const erros = validarConjuntoSaldos(
      [linha('1ºDto', 1, '2023-12-31'), linha('1ºDto', 2, '2024-12-31'), linha('1ºDto', 3, '2025-12-31')],
      ['1ºDto'],
      OMISSAO,
    )
    expect(erros).toEqual([])
  })

  it('apanha o choque entre uma linha sem data e outra com a data por omissão escrita à mão', () => {
    const erros = validarConjuntoSaldos(
      [linha('1ºDto', 1, null), linha('1ºDto', 2, OMISSAO)],
      ['1ºDto'],
      OMISSAO,
    )
    expect(erros[0]).toContain('mesma data')
  })
})
