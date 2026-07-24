// Teste estático (sem base de dados): garante que nenhuma server action
// financeira que escreva em `movimento` esqueça de chamar
// garantirExercicioAberto (ver CLAUDE.md, convenção de server actions
// financeiras). Não substitui os testes de integração que verificam o
// comportamento em runtime — serve para apanhar uma futura função nova
// que se esqueça da proteção, antes disso chegar a ser um bug.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const raizLib = dirname(fileURLToPath(import.meta.url))

function extrairFuncoesExportadas(conteudo: string) {
  const funcoes: { nome: string; corpo: string }[] = []
  const regexInicio = /export async function (\w+)\s*\([^)]*\)[^{]*\{/g
  let match: RegExpExecArray | null
  while ((match = regexInicio.exec(conteudo))) {
    const nome = match[1]
    let i = regexInicio.lastIndex
    let profundidade = 1
    const inicioCorpo = i
    while (profundidade > 0 && i < conteudo.length) {
      if (conteudo[i] === '{') profundidade++
      else if (conteudo[i] === '}') profundidade--
      i++
    }
    funcoes.push({ nome, corpo: conteudo.slice(inicioCorpo, i - 1) })
    regexInicio.lastIndex = i
  }
  return funcoes
}

function funcoesSemProtecao(caminhoRelativo: string) {
  const conteudo = readFileSync(join(raizLib, '..', caminhoRelativo), 'utf8')
  const funcoes = extrairFuncoesExportadas(conteudo)
  return funcoes
    .filter((f) => /\.(update|insert)\(movimento\)/.test(f.corpo) && !f.corpo.includes('garantirExercicioAberto'))
    .map((f) => f.nome)
}

describe('proteção de exercício financeiro fechado', () => {
  it('toda a função de app/actions/financas.ts que escreve em `movimento` chama garantirExercicioAberto', () => {
    expect(funcoesSemProtecao('app/actions/financas.ts')).toEqual([])
  })

  it('toda a função de app/actions/orcamentos.ts que escreve em `movimento` chama garantirExercicioAberto', () => {
    expect(funcoesSemProtecao('app/actions/orcamentos.ts')).toEqual([])
  })
})
