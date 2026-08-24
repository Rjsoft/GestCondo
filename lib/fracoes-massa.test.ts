import { describe, expect, it } from 'vitest'
import {
  lerPermilagem,
  parsearFracoes,
  planearImportacaoFracoes,
  validarConjuntoFracoes,
} from '@/lib/fracoes-massa'

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
    contactoEmail: null,
    contactoTelefone: null,
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

describe('planearImportacaoFracoes', () => {
  const linha = (
    identificacao: string,
    extra: Partial<{ nif: string | null; contactoEmail: string | null; contactoTelefone: string | null }> = {},
    numeroLinha = 1,
  ) => ({
    numeroLinha,
    identificacao,
    proprietario: 'Alguém',
    permilagem: 100,
    nif: null,
    contactoEmail: null,
    contactoTelefone: null,
    ...extra,
  })

  const existente = (
    identificacao: string,
    extra: Partial<{ nif: string | null; contactoEmail: string | null; contactoTelefone: string | null }> = {},
  ) => ({
    id: 1,
    identificacao,
    nif: null,
    contactoEmail: null,
    contactoTelefone: null,
    ...extra,
  })

  it('trata como criação uma fração que não existe', () => {
    const plano = planearImportacaoFracoes([linha('9ºDto')], [])
    expect(plano.aCriar).toHaveLength(1)
    expect(plano.aAtualizar).toEqual([])
  })

  it('preenche um campo que está vazio na fração existente', () => {
    const plano = planearImportacaoFracoes(
      [linha('1ºDto', { nif: '123456789' })],
      [existente('1ºDto')],
    )
    expect(plano.aCriar).toEqual([])
    expect(plano.aAtualizar).toHaveLength(1)
    expect(plano.aAtualizar[0].campos).toEqual([
      { campo: 'nif', label: 'NIF', novo: '123456789' },
    ])
  })

  // A regra que impede esta funcionalidade de destruir dados.
  it('NUNCA substitui um valor que já lá está', () => {
    const plano = planearImportacaoFracoes(
      [linha('1ºDto', { nif: '999999999' })],
      [existente('1ºDto', { nif: '123456789' })],
    )
    expect(plano.aAtualizar).toEqual([])
    expect(plano.semAlteracao).toEqual(['1ºDto'])
  })

  it('preenche só os campos vazios, deixando os preenchidos em paz', () => {
    const plano = planearImportacaoFracoes(
      [linha('1ºDto', { nif: '999999999', contactoEmail: 'novo@exemplo.pt' })],
      [existente('1ºDto', { nif: '123456789' })],
    )
    expect(plano.aAtualizar[0].campos.map((c) => c.campo)).toEqual(['contactoEmail'])
  })

  it('trata um valor existente só com espaços como vazio', () => {
    const plano = planearImportacaoFracoes(
      [linha('1ºDto', { nif: '123456789' })],
      [existente('1ºDto', { nif: '   ' })],
    )
    expect(plano.aAtualizar[0].campos).toHaveLength(1)
  })

  it('não propõe nada quando o ficheiro não traz informação nova', () => {
    const plano = planearImportacaoFracoes([linha('1ºDto')], [existente('1ºDto')])
    expect(plano.aAtualizar).toEqual([])
    expect(plano.semAlteracao).toEqual(['1ºDto'])
  })

  it('nunca propõe permilagem nem proprietário, mesmo vindo diferentes no ficheiro', () => {
    const plano = planearImportacaoFracoes(
      [{ ...linha('1ºDto'), proprietario: 'Outro Dono', permilagem: 999 }],
      [existente('1ºDto')],
    )
    expect(plano.aAtualizar).toEqual([])
    expect(plano.semAlteracao).toEqual(['1ºDto'])
  })

  it('compara identificações ignorando maiúsculas e espaços', () => {
    const plano = planearImportacaoFracoes(
      [linha('  1ºDTO ', { nif: '123456789' })],
      [existente('1ºDto')],
    )
    expect(plano.aAtualizar).toHaveLength(1)
  })

  it('mistura criações e atualizações no mesmo ficheiro', () => {
    const plano = planearImportacaoFracoes(
      [linha('1ºDto', { nif: '123456789' }), linha('9ºDto', {}, 2)],
      [existente('1ºDto')],
    )
    expect(plano.aCriar.map((l) => l.identificacao)).toEqual(['9ºDto'])
    expect(plano.aAtualizar.map((a) => a.identificacao)).toEqual(['1ºDto'])
  })
})

describe('validarConjuntoFracoes com atualização de existentes', () => {
  const linha = (identificacao: string, permilagem: number, numeroLinha = 1) => ({
    numeroLinha,
    identificacao,
    proprietario: 'Alguém',
    permilagem,
    nif: null,
    contactoEmail: null,
    contactoTelefone: null,
  })

  it('deixa de acusar "já existe" quando a atualização está ligada', () => {
    const erros = validarConjuntoFracoes([linha('1ºDto', 100)], ['1ºDto'], 1000, {
      atualizarExistentes: true,
    })
    expect(erros).toEqual([])
  })

  it('não soma a permilagem de uma fração existente ao limite — a importação não lhe toca', () => {
    // O condomínio já está nos 1000‰ e a linha repete uma fração existente:
    // sem esta regra, o total apareceria como 1100‰ e bloqueava sem motivo.
    const erros = validarConjuntoFracoes([linha('1ºDto', 100)], ['1ºDto'], 1000, {
      atualizarExistentes: true,
    })
    expect(erros).toEqual([])
  })

  it('continua a bloquear quando as frações NOVAS ultrapassam o limite', () => {
    const erros = validarConjuntoFracoes(
      [linha('1ºDto', 100), linha('9ºDto', 100, 2)],
      ['1ºDto'],
      1000,
      { atualizarExistentes: true },
    )
    expect(erros[0]).toContain('1100.00')
  })
})
