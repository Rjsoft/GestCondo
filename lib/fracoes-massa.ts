import { excedePermilagemTotal, PERMILAGEM_TOTAL_MAX } from '@/lib/fracoes'

/**
 * Criação de frações em massa a partir de texto colado (`FUNCTIONAL_GAPS.md`
 * secção 11). Um condomínio novo tem tipicamente a lista de frações já feita
 * numa folha de cálculo ou em papel; criar 40 frações uma a uma no diálogo
 * "Nova fração", com 13 campos cada, é a maior fricção do primeiro dia.
 *
 * **A vírgula NÃO é separador de colunas**, de propósito: em Portugal a
 * permilagem escreve-se "83,33". Aceitam-se tabulações (o que o Excel dá ao
 * copiar) e ponto e vírgula (o que uma pessoa escreve à mão). Assim, colar
 * do Excel funciona sem a pessoa ter de pensar no formato.
 *
 * Sem acesso à base de dados de propósito — é aqui que vive a lógica
 * testável; a escrita e as verificações que dependem do condomínio ficam em
 * `app/actions/fracoes.ts:criarFracoesEmMassa`.
 */

export type LinhaFracaoMassa = {
  /** 1-based, como a pessoa vê no que colou — para as mensagens de erro. */
  numeroLinha: number
  identificacao: string
  proprietario: string
  permilagem: number
  nif: string | null
}

export type ErroLinhaFracao = {
  numeroLinha: number
  texto: string
  erro: string
}

export type ResultadoParseFracoes = {
  linhas: LinhaFracaoMassa[]
  erros: ErroLinhaFracao[]
}

/** "83,33" e "83.33" são ambos válidos; a vírgula é o separador decimal em pt-PT. */
export function lerPermilagem(valor: string): number | null {
  const limpo = valor.trim().replace(/‰/g, '').replace(',', '.')
  if (!limpo) return null
  if (!/^\d+(\.\d+)?$/.test(limpo)) return null
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

function separarColunas(linha: string): string[] {
  // Tabulação primeiro (colagem do Excel), ponto e vírgula a seguir (escrita
  // à mão). Nunca vírgula — ver nota no topo do ficheiro.
  if (linha.includes('\t')) return linha.split('\t')
  return linha.split(';')
}

/**
 * Converte o texto colado em linhas prontas a criar. Linhas vazias são
 * ignoradas em silêncio; linhas com problemas vão para `erros` com o número
 * da linha, para a pessoa as poder corrigir sem perder as boas.
 */
export function parsearFracoes(texto: string): ResultadoParseFracoes {
  const linhas: LinhaFracaoMassa[] = []
  const erros: ErroLinhaFracao[] = []

  const todas = texto.split(/\r?\n/)

  todas.forEach((original, i) => {
    const numeroLinha = i + 1
    const linha = original.trim()
    if (!linha) return

    const colunas = separarColunas(linha).map((c) => c.trim())
    const [identificacao = '', proprietario = '', permilagemTexto = '', nif = ''] = colunas

    if (colunas.length < 3) {
      erros.push({
        numeroLinha,
        texto: linha,
        erro: 'Faltam colunas — são precisas pelo menos três: identificação, proprietário e permilagem.',
      })
      return
    }
    if (!identificacao) {
      erros.push({ numeroLinha, texto: linha, erro: 'Falta a identificação da fração.' })
      return
    }
    if (!proprietario) {
      erros.push({ numeroLinha, texto: linha, erro: 'Falta o nome do proprietário.' })
      return
    }

    const permilagem = lerPermilagem(permilagemTexto)
    if (permilagem === null) {
      erros.push({
        numeroLinha,
        texto: linha,
        erro: `"${permilagemTexto}" não é uma permilagem válida. Escreva só o número, por exemplo 83,33.`,
      })
      return
    }

    linhas.push({
      numeroLinha,
      identificacao,
      proprietario,
      permilagem,
      nif: nif || null,
    })
  })

  return { linhas, erros }
}

/**
 * Verificações que só fazem sentido sobre o conjunto todo, e não linha a
 * linha: identificações repetidas (dentro do que foi colado ou contra as
 * frações que já existem) e o limite de 1000‰.
 *
 * `identificacoesExistentes` e `somaPermilagemExistente` vêm da base de
 * dados, mas são passados de fora para esta função continuar pura.
 */
export function validarConjuntoFracoes(
  linhas: LinhaFracaoMassa[],
  identificacoesExistentes: string[],
  somaPermilagemExistente: number,
): string[] {
  const erros: string[] = []

  const normalizar = (s: string) => s.trim().toLowerCase()
  const jaExistem = new Set(identificacoesExistentes.map(normalizar))

  const vistas = new Map<string, number>()
  for (const l of linhas) {
    const chave = normalizar(l.identificacao)
    const anterior = vistas.get(chave)
    if (anterior !== undefined) {
      erros.push(
        `A identificação "${l.identificacao}" aparece duas vezes (linhas ${anterior} e ${l.numeroLinha}).`,
      )
    } else {
      vistas.set(chave, l.numeroLinha)
    }
    if (jaExistem.has(chave)) {
      erros.push(`Já existe uma fração com a identificação "${l.identificacao}" neste condomínio.`)
    }
  }

  const somaNovas = linhas.reduce((s, l) => s + l.permilagem, 0)
  if (excedePermilagemTotal(somaPermilagemExistente, somaNovas)) {
    erros.push(
      `A soma das permilagens ficaria em ${(somaPermilagemExistente + somaNovas).toFixed(2)}‰ — acima do máximo de ${PERMILAGEM_TOTAL_MAX}‰.`,
    )
  }

  return erros
}
