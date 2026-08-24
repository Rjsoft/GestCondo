import { describe, expect, it } from 'vitest'
import { MODELO_FRACOES, MODELO_SALDOS, gerarCsvModelo } from '@/lib/modelo-csv'
import { parsearFracoes } from '@/lib/fracoes-massa'
import { parsearSaldosIniciais } from '@/lib/saldos-iniciais'

describe('gerarCsvModelo', () => {
  it('começa com BOM UTF-8, sem o qual o Excel troca os acentos', () => {
    expect(gerarCsvModelo(MODELO_FRACOES).charCodeAt(0)).toBe(0xfeff)
  })

  it('usa ponto e vírgula, que é o separador de listas do Excel português', () => {
    const csv = gerarCsvModelo(MODELO_SALDOS)
    expect(csv).toContain('Fração;Valor em dívida')
  })

  it('mantém a vírgula decimal dos exemplos intacta', () => {
    expect(gerarCsvModelo(MODELO_SALDOS)).toContain('1ºDto;125,50')
  })

  it('termina as linhas com CRLF, como o Excel espera', () => {
    expect(gerarCsvModelo(MODELO_SALDOS)).toContain('\r\n')
  })
})

// O que interessa mesmo: o que sai do modelo tem de voltar a entrar. Se
// alguém mudar o cabeçalho de um lado sem mudar do outro, estes testes
// falham — que é exatamente o que se quer.
describe('ida e volta: modelo -> analisador', () => {
  it('o modelo de frações é lido sem erros, com o cabeçalho ignorado', () => {
    const csv = gerarCsvModelo(MODELO_FRACOES).replace(/^﻿/, '')
    const { linhas, erros } = parsearFracoes(csv)
    expect(erros).toEqual([])
    expect(linhas).toHaveLength(MODELO_FRACOES.exemplos.length)
    expect(linhas[0]).toMatchObject({
      identificacao: '1ºDto',
      proprietario: 'Maria Silva',
      permilagem: 83.33,
      nif: '123456789',
    })
  })

  it('o modelo de saldos é lido sem erros, com o cabeçalho ignorado', () => {
    const csv = gerarCsvModelo(MODELO_SALDOS).replace(/^﻿/, '')
    const { linhas, erros } = parsearSaldosIniciais(csv)
    expect(erros).toEqual([])
    expect(linhas).toHaveLength(MODELO_SALDOS.exemplos.length)
    expect(linhas[2]).toMatchObject({ identificacao: 'R/C Dto', valor: 1234.56 })
  })
})

describe('cabeçalho', () => {
  it('só a primeira linha é candidata a cabeçalho', () => {
    const { linhas, erros } = parsearSaldosIniciais('Fração; Valor\n1ºDto; 10\nFração; Valor')
    // A terceira linha não é ignorada: é uma linha de dados com um valor
    // inválido, e a pessoa tem de a ver.
    expect(linhas).toHaveLength(1)
    expect(erros).toHaveLength(1)
    expect(erros[0].numeroLinha).toBe(3)
  })

  it('não engole uma linha de dados que comece por outra palavra qualquer', () => {
    const { linhas } = parsearFracoes('1ºDto; Maria; 10')
    expect(linhas).toHaveLength(1)
  })

  it('reconhece o cabeçalho independentemente de acentos e maiúsculas', () => {
    expect(parsearFracoes('IDENTIFICAÇÃO;Proprietário;Permilagem\n1ºDto;Maria;10').linhas).toHaveLength(1)
    expect(parsearSaldosIniciais('fracao;valor\n1ºDto;10').linhas).toHaveLength(1)
  })
})
