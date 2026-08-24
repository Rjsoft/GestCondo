import { describe, expect, it } from 'vitest'
import { lerPermilagem, parsearFracoes, validarConjuntoFracoes } from '@/lib/fracoes-massa'

describe('lerPermilagem', () => {
  it('aceita vírgula decimal, como se escreve em Portugal', () => {
    expect(lerPermilagem('83,33')).toBe(83.33)
  })

  it('aceita ponto decimal', () => {
    expect(lerPermilagem('83.33')).toBe(83.33)
  })

  it('ignora o símbolo ‰ se a pessoa o colar', () => {
    expect(lerPermilagem('83,33‰')).toBe(83.33)
  })

  it('rejeita texto que não seja um número', () => {
    expect(lerPermilagem('oitenta')).toBeNull()
    expect(lerPermilagem('83,33,1')).toBeNull()
    expect(lerPermilagem('-5')).toBeNull()
    expect(lerPermilagem('')).toBeNull()
  })
})

describe('parsearFracoes', () => {
  it('lê linhas separadas por tabulação (colagem do Excel)', () => {
    const { linhas, erros } = parsearFracoes('1ºDto\tMaria Silva\t83,33\n1ºEsq\tJoão Costa\t83,33')
    expect(erros).toEqual([])
    expect(linhas).toHaveLength(2)
    expect(linhas[0]).toMatchObject({
      numeroLinha: 1,
      identificacao: '1ºDto',
      proprietario: 'Maria Silva',
      permilagem: 83.33,
      nif: null,
    })
  })

  it('lê linhas separadas por ponto e vírgula (escrita à mão)', () => {
    const { linhas, erros } = parsearFracoes('R/C Dto; Ana Sousa; 100')
    expect(erros).toEqual([])
    expect(linhas[0]).toMatchObject({ identificacao: 'R/C Dto', proprietario: 'Ana Sousa', permilagem: 100 })
  })

  it('não trata a vírgula como separador de colunas — é o separador decimal', () => {
    const { linhas, erros } = parsearFracoes('1ºDto; Maria Silva; 83,33')
    expect(erros).toEqual([])
    expect(linhas[0].permilagem).toBe(83.33)
  })

  it('lê o NIF quando existe uma quarta coluna', () => {
    const { linhas } = parsearFracoes('1ºDto\tMaria Silva\t83,33\t123456789')
    expect(linhas[0].nif).toBe('123456789')
  })

  it('ignora linhas vazias sem as reportar como erro', () => {
    const { linhas, erros } = parsearFracoes('\n1ºDto;Maria;10\n\n  \n1ºEsq;João;10\n')
    expect(erros).toEqual([])
    expect(linhas).toHaveLength(2)
  })

  it('aponta a linha exata de cada problema e mantém as linhas boas', () => {
    const { linhas, erros } = parsearFracoes('1ºDto;Maria;10\nsó-isto\n1ºEsq;João;abc\n2ºDto;Ana;20')
    expect(linhas.map((l) => l.identificacao)).toEqual(['1ºDto', '2ºDto'])
    expect(erros).toHaveLength(2)
    expect(erros[0].numeroLinha).toBe(2)
    expect(erros[1].numeroLinha).toBe(3)
    expect(erros[1].erro).toContain('83,33')
  })

  it('reporta falta de identificação e de proprietário separadamente', () => {
    const { erros } = parsearFracoes(';Maria;10\n1ºEsq;;10')
    expect(erros[0].erro).toContain('identificação')
    expect(erros[1].erro).toContain('proprietário')
  })
})

describe('validarConjuntoFracoes', () => {
  const linha = (identificacao: string, permilagem: number, numeroLinha = 1) => ({
    numeroLinha,
    identificacao,
    proprietario: 'Alguém',
    permilagem,
    nif: null,
  })

  it('aceita um conjunto válido', () => {
    expect(validarConjuntoFracoes([linha('1ºDto', 500), linha('1ºEsq', 500, 2)], [], 0)).toEqual([])
  })

  it('deteta identificações repetidas dentro do que foi colado', () => {
    const erros = validarConjuntoFracoes([linha('1ºDto', 100), linha('1ºDto', 100, 2)], [], 0)
    expect(erros[0]).toContain('duas vezes')
    expect(erros[0]).toContain('linhas 1 e 2')
  })

  it('deteta repetições ignorando maiúsculas e espaços', () => {
    const erros = validarConjuntoFracoes([linha('1ºDto', 100), linha('  1ºdto  ', 100, 2)], [], 0)
    expect(erros.some((e) => e.includes('duas vezes'))).toBe(true)
  })

  it('deteta identificação que já existe no condomínio', () => {
    const erros = validarConjuntoFracoes([linha('1ºDto', 100)], ['1ºDto'], 0)
    expect(erros[0]).toContain('Já existe')
  })

  it('bloqueia quando a soma ultrapassa 1000‰, contando as frações já existentes', () => {
    const erros = validarConjuntoFracoes([linha('1ºDto', 300)], [], 800)
    expect(erros[0]).toContain('1100.00')
    expect(erros[0]).toContain('1000')
  })

  it('deixa passar exatamente 1000‰', () => {
    expect(validarConjuntoFracoes([linha('1ºDto', 200)], [], 800)).toEqual([])
  })
})
