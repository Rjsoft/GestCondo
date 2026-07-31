import { describe, expect, it } from 'vitest'
import {
  construirSequenciaBlocos,
  construirSequenciaBlocosComIndices,
  encontrarVozPorPreferencia,
  ePortugues,
  ePtPt,
  escolherMelhorVoz,
  normalizarLocale,
  normalizarTextoParaFala,
  reduzirEstadoLeitura,
  serializarPreferenciaVoz,
  validarVelocidade,
  type VozInfo,
} from './leitura-voz'

function voz(overrides: Partial<VozInfo>): VozInfo {
  return {
    voiceURI: 'voz-teste',
    name: 'Voz de teste',
    lang: 'pt-PT',
    default: false,
    localService: true,
    ...overrides,
  }
}

describe('normalizarTextoParaFala', () => {
  it('troca ‰ por "por mil", sem tocar nos números à volta', () => {
    expect(normalizarTextoParaFala('250‰')).toBe('250 por mil')
    expect(normalizarTextoParaFala('R/C Dto tem 250‰ e 1º Esq tem 375‰')).toBe(
      'R/C Dto tem 250 por mil e 1º Esq tem 375 por mil',
    )
  })

  it('não altera números, moeda, percentagens, datas nem siglas', () => {
    expect(normalizarTextoParaFala('1.250,00 €')).toBe('1.250,00 €')
    expect(normalizarTextoParaFala('10%')).toBe('10%')
    expect(normalizarTextoParaFala('01/08/2026')).toBe('01/08/2026')
    expect(normalizarTextoParaFala('NIF, RGPD, IBAN')).toBe('NIF, RGPD, IBAN')
    expect(normalizarTextoParaFala('artigo 1432.º')).toBe('artigo 1432.º')
  })

  it('não altera URLs nem emails', () => {
    expect(normalizarTextoParaFala('www.consumidor.gov.pt')).toBe('www.consumidor.gov.pt')
    expect(normalizarTextoParaFala('nome@exemplo.pt')).toBe('nome@exemplo.pt')
  })

  it('não duplica pontuação nem introduz texto novo', () => {
    const original = 'Isto é um teste, com vírgulas e pontos finais.'
    expect(normalizarTextoParaFala(original)).toBe(original)
  })

  it('colapsa espaços repetidos e remove espaço nas pontas', () => {
    expect(normalizarTextoParaFala('  texto   com   espaços  ')).toBe('texto com espaços')
  })
})

describe('construirSequenciaBlocos', () => {
  it('mapeia h1/h2 para título, h3/h4 para subtítulo, p para parágrafo, li para item', () => {
    const blocos = construirSequenciaBlocos([
      { tag: 'h1', texto: 'Finanças' },
      { tag: 'h2', texto: 'Movimentos' },
      { tag: 'h3', texto: 'Como obter um recibo' },
      { tag: 'p', texto: 'Texto explicativo.' },
      { tag: 'li', texto: 'Item da lista' },
    ])
    expect(blocos.map((b) => b.tipo)).toEqual([
      'titulo',
      'titulo',
      'subtitulo',
      'paragrafo',
      'item',
    ])
  })

  it('ignora tags desconhecidas (ex: botões, spans soltos)', () => {
    const blocos = construirSequenciaBlocos([
      { tag: 'button', texto: 'Guardar' },
      { tag: 'p', texto: 'Texto real.' },
    ])
    expect(blocos).toHaveLength(1)
    expect(blocos[0].texto).toBe('Texto real.')
  })

  it('descarta blocos vazios ou só com espaços em branco', () => {
    const blocos = construirSequenciaBlocos([
      { tag: 'p', texto: '   ' },
      { tag: 'p', texto: '' },
      { tag: 'p', texto: 'Conteúdo real' },
    ])
    expect(blocos).toEqual([{ tipo: 'paragrafo', texto: 'Conteúdo real' }])
  })

  it('normaliza o texto de cada bloco (ex: permilagem)', () => {
    const blocos = construirSequenciaBlocos([{ tag: 'li', texto: 'R/C Dto — 250‰' }])
    expect(blocos[0].texto).toBe('R/C Dto — 250 por mil')
  })
})

describe('construirSequenciaBlocosComIndices', () => {
  it('devolve o índice original de cada entrada válida, mesmo com entradas descartadas pelo meio', () => {
    const resultado = construirSequenciaBlocosComIndices([
      { tag: 'h2', texto: 'Título' }, // índice 0
      { tag: 'button', texto: 'Guardar' }, // índice 1 — descartado (tag desconhecida)
      { tag: 'p', texto: '   ' }, // índice 2 — descartado (vazio)
      { tag: 'p', texto: 'Texto real' }, // índice 3
    ])
    expect(resultado).toEqual([
      { bloco: { tipo: 'titulo', texto: 'Título' }, indiceOriginal: 0 },
      { bloco: { tipo: 'paragrafo', texto: 'Texto real' }, indiceOriginal: 3 },
    ])
  })

  it('produz exatamente os mesmos blocos que construirSequenciaBlocos, na mesma ordem', () => {
    const entradas = [
      { tag: 'h1', texto: 'Finanças' },
      { tag: 'button', texto: 'Novo movimento' },
      { tag: 'li', texto: 'R/C Dto — 250‰' },
    ]
    const comIndices = construirSequenciaBlocosComIndices(entradas).map((r) => r.bloco)
    expect(comIndices).toEqual(construirSequenciaBlocos(entradas))
  })

  it('devolve uma lista vazia quando não há entradas válidas', () => {
    expect(construirSequenciaBlocosComIndices([{ tag: 'button', texto: 'Guardar' }])).toEqual([])
  })
})

describe('normalizarLocale / ePtPt / ePortugues', () => {
  it('normaliza maiúsculas e underscores', () => {
    expect(normalizarLocale('PT-PT')).toBe('pt-pt')
    expect(normalizarLocale('pt_PT')).toBe('pt-pt')
  })

  it('reconhece pt-PT independentemente de formatação', () => {
    expect(ePtPt('pt-PT')).toBe(true)
    expect(ePtPt('PT_pt')).toBe(true)
    expect(ePtPt('pt-BR')).toBe(false)
    expect(ePtPt('en-US')).toBe(false)
  })

  it('ePortugues aceita qualquer variante de português', () => {
    expect(ePortugues('pt-BR')).toBe(true)
    expect(ePortugues('pt')).toBe(true)
    expect(ePortugues('pt-PT')).toBe(true)
    expect(ePortugues('es-ES')).toBe(false)
  })
})

describe('escolherMelhorVoz', () => {
  it('devolve null quando não há vozes', () => {
    expect(escolherMelhorVoz([])).toBeNull()
  })

  it('prioriza pt-PT sobre outras variantes de português', () => {
    const vozes = [voz({ voiceURI: 'a', lang: 'pt-BR' }), voz({ voiceURI: 'b', lang: 'pt-PT' })]
    expect(escolherMelhorVoz(vozes)?.voiceURI).toBe('b')
  })

  it('em caso de várias pt-PT, prefere a marcada como predefinida e local', () => {
    const vozes = [
      voz({ voiceURI: 'a', lang: 'pt-PT', default: false, localService: true }),
      voz({ voiceURI: 'b', lang: 'pt-PT', default: true, localService: true }),
      voz({ voiceURI: 'c', lang: 'pt-PT', default: false, localService: false }),
    ]
    expect(escolherMelhorVoz(vozes)?.voiceURI).toBe('b')
  })

  it('sem pt-PT, cai para outra variante de português', () => {
    const vozes = [voz({ voiceURI: 'a', lang: 'en-US' }), voz({ voiceURI: 'b', lang: 'pt-BR' })]
    expect(escolherMelhorVoz(vozes)?.voiceURI).toBe('b')
  })

  it('sem nenhuma voz portuguesa, cai para a voz predefinida do sistema', () => {
    const vozes = [
      voz({ voiceURI: 'a', lang: 'en-US', default: false }),
      voz({ voiceURI: 'b', lang: 'fr-FR', default: true }),
    ]
    expect(escolherMelhorVoz(vozes)?.voiceURI).toBe('b')
  })

  it('sem predefinida nem português, usa a primeira da lista', () => {
    const vozes = [voz({ voiceURI: 'a', lang: 'en-US' }), voz({ voiceURI: 'b', lang: 'fr-FR' })]
    expect(escolherMelhorVoz(vozes)?.voiceURI).toBe('a')
  })

  it('respeita a preferência guardada quando a voz ainda existe', () => {
    const vozes = [voz({ voiceURI: 'a', lang: 'pt-PT' }), voz({ voiceURI: 'b', lang: 'pt-PT' })]
    const preferencia = { voiceURI: 'a', nome: 'Voz de teste', lang: 'pt-PT' }
    expect(escolherMelhorVoz(vozes, preferencia)?.voiceURI).toBe('a')
  })

  it('ignora a preferência guardada se a voz já não existir, sem rebentar', () => {
    const vozes = [voz({ voiceURI: 'b', lang: 'pt-PT' })]
    const preferencia = { voiceURI: 'inexistente', nome: 'Antiga', lang: 'pt-PT' }
    expect(escolherMelhorVoz(vozes, preferencia)?.voiceURI).toBe('b')
  })
})

describe('encontrarVozPorPreferencia / serializarPreferenciaVoz', () => {
  it('encontra por voiceURI', () => {
    const vozes = [voz({ voiceURI: 'x' })]
    expect(
      encontrarVozPorPreferencia(vozes, { voiceURI: 'x', nome: '', lang: '' })?.voiceURI,
    ).toBe('x')
  })

  it('se o voiceURI não bater certo, tenta por nome+lang', () => {
    const vozes = [voz({ voiceURI: 'novo-id', name: 'Joana', lang: 'pt-PT' })]
    const pref = { voiceURI: 'id-antigo', nome: 'Joana', lang: 'pt-PT' }
    expect(encontrarVozPorPreferencia(vozes, pref)?.voiceURI).toBe('novo-id')
  })

  it('devolve null quando não há correspondência nenhuma', () => {
    const vozes = [voz({ voiceURI: 'x', name: 'A', lang: 'pt-PT' })]
    const pref = { voiceURI: 'y', nome: 'B', lang: 'en-US' }
    expect(encontrarVozPorPreferencia(vozes, pref)).toBeNull()
  })

  it('serializa só os campos necessários para reencontrar a voz depois', () => {
    const v = voz({ voiceURI: 'x', name: 'Joana', lang: 'pt-PT' })
    expect(serializarPreferenciaVoz(v)).toEqual({ voiceURI: 'x', nome: 'Joana', lang: 'pt-PT' })
  })
})

describe('validarVelocidade', () => {
  it('aceita as três chaves válidas', () => {
    expect(validarVelocidade('lenta')).toBe('lenta')
    expect(validarVelocidade('normal')).toBe('normal')
    expect(validarVelocidade('rapida')).toBe('rapida')
  })

  it('cai para "normal" com qualquer valor inválido ou inesperado', () => {
    expect(validarVelocidade('turbo')).toBe('normal')
    expect(validarVelocidade(undefined)).toBe('normal')
    expect(validarVelocidade(2)).toBe('normal')
    expect(validarVelocidade(null)).toBe('normal')
  })
})

describe('reduzirEstadoLeitura', () => {
  it('idle → speaking com INICIAR', () => {
    expect(reduzirEstadoLeitura('idle', { tipo: 'INICIAR' })).toBe('speaking')
  })

  it('speaking → paused com PAUSAR', () => {
    expect(reduzirEstadoLeitura('speaking', { tipo: 'PAUSAR' })).toBe('paused')
  })

  it('paused → speaking com RETOMAR', () => {
    expect(reduzirEstadoLeitura('paused', { tipo: 'RETOMAR' })).toBe('speaking')
  })

  it('PARAR e TERMINOU levam sempre a idle, de qualquer estado', () => {
    expect(reduzirEstadoLeitura('speaking', { tipo: 'PARAR' })).toBe('idle')
    expect(reduzirEstadoLeitura('paused', { tipo: 'PARAR' })).toBe('idle')
    expect(reduzirEstadoLeitura('error', { tipo: 'PARAR' })).toBe('idle')
    expect(reduzirEstadoLeitura('speaking', { tipo: 'TERMINOU' })).toBe('idle')
  })

  it('ERRO leva sempre a error', () => {
    expect(reduzirEstadoLeitura('speaking', { tipo: 'ERRO' })).toBe('error')
  })

  it('PAUSAR e RETOMAR são ignorados fora do estado esperado (sem transição inválida)', () => {
    expect(reduzirEstadoLeitura('idle', { tipo: 'PAUSAR' })).toBe('idle')
    expect(reduzirEstadoLeitura('idle', { tipo: 'RETOMAR' })).toBe('idle')
    expect(reduzirEstadoLeitura('speaking', { tipo: 'RETOMAR' })).toBe('speaking')
  })
})
