import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { extrairTextoDeReactNode, pesquisarSecoesAjuda, type SecaoPesquisavel } from './pesquisa-ajuda'

// Normalização simples para os testes (minúsculas apenas) — o comportamento
// de remoção de acentos é responsabilidade de quem chama a função (ver
// app/actions/pesquisa.ts, que usa removerAcentos), não desta lib.
const normalizar = (s: string) => s.toLowerCase()

describe('extrairTextoDeReactNode', () => {
  it('devolve strings simples tal como estão', () => {
    expect(extrairTextoDeReactNode('Olá mundo')).toBe('Olá mundo')
  })

  it('converte números para texto', () => {
    expect(extrairTextoDeReactNode(42)).toBe('42')
  })

  it('ignora null, undefined e booleanos (renderização condicional em JSX)', () => {
    expect(extrairTextoDeReactNode(null)).toBe('')
    expect(extrairTextoDeReactNode(undefined)).toBe('')
    expect(extrairTextoDeReactNode(false)).toBe('')
    expect(extrairTextoDeReactNode(true)).toBe('')
  })

  it('junta os textos de um array de nós com espaço', () => {
    expect(extrairTextoDeReactNode(['Primeiro', 'Segundo'])).toBe('Primeiro Segundo')
  })

  it('desce recursivamente pelos filhos de um elemento React', () => {
    const elemento = createElement(
      'p',
      null,
      'Texto antes ',
      createElement('strong', null, 'dentro de outra tag'),
      ' texto depois',
    )
    expect(extrairTextoDeReactNode(elemento)).toBe('Texto antes  dentro de outra tag  texto depois')
  })

  it('lida com filhos aninhados em vários níveis', () => {
    const elemento = createElement(
      'div',
      null,
      createElement('section', null, createElement('p', null, 'Nível profundo')),
    )
    expect(extrairTextoDeReactNode(elemento)).toBe('Nível profundo')
  })
})

describe('pesquisarSecoesAjuda', () => {
  const secoes: SecaoPesquisavel[] = [
    {
      value: 'financas',
      label: 'Finanças',
      conteudo: createElement(
        'p',
        null,
        'O administrador pode lançar juros de mora sobre quotas em atraso.',
      ),
    },
    {
      value: 'assembleias',
      label: 'Assembleias',
      conteudo: createElement(
        'p',
        null,
        'O quórum é calculado automaticamente a partir da permilagem de cada fração.',
      ),
    },
  ]

  it('encontra uma secção pelo texto do conteúdo, não só pelo título', () => {
    const r = pesquisarSecoesAjuda(secoes, 'juros de mora', normalizar)
    expect(r).toHaveLength(1)
    expect(r[0].value).toBe('financas')
  })

  it('encontra uma secção pelo label mesmo sem o termo aparecer no texto', () => {
    const r = pesquisarSecoesAjuda(secoes, 'assembleias', normalizar)
    expect(r.map((x) => x.value)).toContain('assembleias')
  })

  it('devolve lista vazia sem correspondência nenhuma', () => {
    expect(pesquisarSecoesAjuda(secoes, 'palavra-que-nao-existe', normalizar)).toEqual([])
  })

  it('devolve lista vazia para um termo vazio', () => {
    expect(pesquisarSecoesAjuda(secoes, '', normalizar)).toEqual([])
  })

  it('o trecho devolvido contém o termo pesquisado, com contexto à volta', () => {
    const r = pesquisarSecoesAjuda(secoes, 'quórum', normalizar)
    expect(r[0].trecho.toLowerCase()).toContain('quórum')
  })

  it('respeita o limite de resultados', () => {
    const muitas: SecaoPesquisavel[] = Array.from({ length: 10 }, (_, i) => ({
      value: `secao-${i}`,
      label: `Secção ${i}`,
      conteudo: createElement('p', null, 'texto comum a todas'),
    }))
    const r = pesquisarSecoesAjuda(muitas, 'comum', normalizar, 3)
    expect(r).toHaveLength(3)
  })
})
