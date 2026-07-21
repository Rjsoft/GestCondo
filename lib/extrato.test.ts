import { describe, expect, it } from 'vitest'
import { mapearLinhas, parseCsv, sugerirCorrespondencias } from './extrato'

describe('parseCsv', () => {
  it('faz parsing de um CSV simples separado por vírgulas', () => {
    const texto = 'Data,Descrição,Valor\n01/01/2026,Quota Jan,100.00\n02/01/2026,Água,-15.50'
    const linhas = parseCsv(texto)
    expect(linhas).toEqual([
      ['Data', 'Descrição', 'Valor'],
      ['01/01/2026', 'Quota Jan', '100.00'],
      ['02/01/2026', 'Água', '-15.50'],
    ])
  })

  it('lida com campos entre aspas contendo o delimitador', () => {
    const texto = 'Data,Descrição,Valor\n01/01/2026,"Pagamento, ref. 123",100.00'
    const linhas = parseCsv(texto)
    expect(linhas[1]).toEqual(['01/01/2026', 'Pagamento, ref. 123', '100.00'])
  })

  it('lida com aspas escapadas dentro de um campo', () => {
    const texto = '01/01/2026,"Diz ""ola""",50'
    const linhas = parseCsv(texto)
    expect(linhas[0][1]).toBe('Diz "ola"')
  })

  it('suporta ponto e vírgula como delimitador', () => {
    const texto = '01/01/2026;Quota;100,00'
    const linhas = parseCsv(texto, ';')
    expect(linhas[0]).toEqual(['01/01/2026', 'Quota', '100,00'])
  })

  it('ignora linhas totalmente vazias', () => {
    const texto = '01/01/2026,Quota,100\n\n02/01/2026,Água,-15'
    const linhas = parseCsv(texto)
    expect(linhas).toHaveLength(2)
  })
})

describe('mapearLinhas', () => {
  it('mapeia colunas no modo valor único', () => {
    const linhas = [
      ['01/01/2026', 'Quota Jan', '100.00'],
      ['02/01/2026', 'Água', '-15,50'],
    ]
    const resultado = mapearLinhas(linhas, {
      modo: 'valorUnico',
      colData: 0,
      colDescricao: 1,
      colValor: 2,
    })
    expect(resultado[0].valor).toBe(100)
    expect(resultado[0].descricao).toBe('Quota Jan')
    expect(resultado[0].data.getFullYear()).toBe(2026)
    expect(resultado[0].data.getMonth()).toBe(0)
    expect(resultado[0].data.getDate()).toBe(1)
    expect(resultado[1].valor).toBe(-15.5)
  })

  it('mapeia colunas no modo débito/crédito separados', () => {
    const linhas = [
      ['01/01/2026', 'Quota Jan', '', '100,00'],
      ['02/01/2026', 'Água', '15,50', ''],
    ]
    const resultado = mapearLinhas(linhas, {
      modo: 'debitoCredito',
      colData: 0,
      colDescricao: 1,
      colDebito: 2,
      colCredito: 3,
    })
    expect(resultado[0].valor).toBe(100)
    expect(resultado[1].valor).toBe(-15.5)
  })

  it('interpreta datas em formato ISO', () => {
    const resultado = mapearLinhas([['2026-01-01', 'Quota', '10']], {
      modo: 'valorUnico',
      colData: 0,
      colDescricao: 1,
      colValor: 2,
    })
    expect(resultado[0].data.getFullYear()).toBe(2026)
    expect(resultado[0].data.getMonth()).toBe(0)
    expect(resultado[0].data.getDate()).toBe(1)
  })

  it('lança erro para valor inválido', () => {
    expect(() =>
      mapearLinhas([['01/01/2026', 'Quota', 'abc']], {
        modo: 'valorUnico',
        colData: 0,
        colDescricao: 1,
        colValor: 2,
      }),
    ).toThrow()
  })
})

describe('sugerirCorrespondencias', () => {
  it('sugere par por valor igual e data próxima', () => {
    const linhasExtrato = [{ data: new Date(2026, 0, 5), valor: 100 }]
    const movimentos = [{ id: 1, data: new Date(2026, 0, 3), valor: 100 }]
    const sugestoes = sugerirCorrespondencias(linhasExtrato, movimentos)
    expect(sugestoes).toEqual([{ linhaIndex: 0, movimentoId: 1 }])
  })

  it('não sugere quando o valor difere', () => {
    const linhasExtrato = [{ data: new Date(2026, 0, 5), valor: 100 }]
    const movimentos = [{ id: 1, data: new Date(2026, 0, 5), valor: 99 }]
    expect(sugerirCorrespondencias(linhasExtrato, movimentos)).toEqual([])
  })

  it('não sugere quando a data está fora da janela', () => {
    const linhasExtrato = [{ data: new Date(2026, 0, 20), valor: 100 }]
    const movimentos = [{ id: 1, data: new Date(2026, 0, 1), valor: 100 }]
    expect(sugerirCorrespondencias(linhasExtrato, movimentos, 5)).toEqual([])
  })

  it('não sugere o mesmo movimento para duas linhas diferentes', () => {
    const linhasExtrato = [
      { data: new Date(2026, 0, 1), valor: 100 },
      { data: new Date(2026, 0, 2), valor: 100 },
    ]
    const movimentos = [{ id: 1, data: new Date(2026, 0, 1), valor: 100 }]
    const sugestoes = sugerirCorrespondencias(linhasExtrato, movimentos)
    expect(sugestoes).toHaveLength(1)
    expect(sugestoes[0].linhaIndex).toBe(0)
  })

  it('prefere o movimento com data mais próxima quando há vários candidatos', () => {
    const linhasExtrato = [{ data: new Date(2026, 0, 10), valor: 100 }]
    const movimentos = [
      { id: 1, data: new Date(2026, 0, 1), valor: 100 },
      { id: 2, data: new Date(2026, 0, 9), valor: 100 },
    ]
    const sugestoes = sugerirCorrespondencias(linhasExtrato, movimentos, 15)
    expect(sugestoes[0].movimentoId).toBe(2)
  })
})
