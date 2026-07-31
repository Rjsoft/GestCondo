// Pesquisa sobre o conteúdo de /ajuda (docs/audit/AI_FEATURES_VIABILITY.md,
// item P0 "pesquisa melhorada na ajuda") — determinística, sem IA. O
// conteúdo de cada secção é React (JSX), não texto simples; extrairTexto
// achata a árvore de nós para uma string pesquisável, sem depender de DOM
// (só objetos simples), por isso corre tanto no servidor como é testável em
// Node sem jsdom.

import type { ReactNode } from 'react'

export function extrairTextoDeReactNode(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extrairTextoDeReactNode).join(' ')
  if (typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props
    return extrairTextoDeReactNode(props?.children)
  }
  return ''
}

export type SecaoPesquisavel = { value: string; label: string; conteudo: ReactNode }

export type ResultadoPesquisaAjuda = {
  value: string
  label: string
  trecho: string
}

const TAMANHO_TRECHO = 140

/**
 * Devolve um pedaço de `texto` à volta da primeira ocorrência de `termo`
 * (já normalizados/em minúsculas pelo chamador), para dar contexto do sítio
 * onde o termo aparece em vez de mostrar sempre o início da secção.
 */
function extrairTrecho(texto: string, textoNormalizado: string, termoNormalizado: string): string {
  const indice = textoNormalizado.indexOf(termoNormalizado)
  if (indice === -1) return texto.slice(0, TAMANHO_TRECHO).trim()
  const inicio = Math.max(0, indice - 40)
  const fim = Math.min(texto.length, indice + termoNormalizado.length + 80)
  const prefixo = inicio > 0 ? '…' : ''
  const sufixo = fim < texto.length ? '…' : ''
  return `${prefixo}${texto.slice(inicio, fim).trim()}${sufixo}`
}

/**
 * `normalizar` é injetado pelo chamador (ex: removerAcentos + toLowerCase)
 * em vez de importado diretamente, para esta função continuar sem
 * dependências e testável com strings simples, sem acentos a atrapalhar os
 * exemplos dos testes.
 */
export function pesquisarSecoesAjuda(
  secoes: SecaoPesquisavel[],
  termo: string,
  normalizar: (s: string) => string,
  limite = 5,
): ResultadoPesquisaAjuda[] {
  const termoNormalizado = normalizar(termo)
  if (termoNormalizado.length === 0) return []

  const resultados: ResultadoPesquisaAjuda[] = []
  for (const secao of secoes) {
    const labelNormalizado = normalizar(secao.label)
    const texto = extrairTextoDeReactNode(secao.conteudo)
    const textoNormalizado = normalizar(texto)
    if (!labelNormalizado.includes(termoNormalizado) && !textoNormalizado.includes(termoNormalizado)) {
      continue
    }
    resultados.push({
      value: secao.value,
      label: secao.label,
      trecho: extrairTrecho(texto, textoNormalizado, termoNormalizado),
    })
    if (resultados.length >= limite) break
  }
  return resultados
}
