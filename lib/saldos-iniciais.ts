/**
 * Abertura de saldos iniciais por fração (`FUNCTIONAL_GAPS.md` secção 11).
 *
 * Um condomínio que muda para o GestCondo traz quase sempre dívidas
 * acumuladas. Como a dívida por fração é **derivada** de `movimento` — e
 * bem, é isso que a torna auditável e sustenta a declaração de dívida —,
 * dar entrada dessas dívidas exigia criar um movimento de cada vez no
 * diálogo "Novo movimento". Num prédio com 20 frações em atraso, eram 20
 * lançamentos manuais.
 *
 * Aqui só vive a leitura do texto colado. A escrita, as regras de
 * exercício financeiro e a auditoria ficam em
 * `app/actions/financas.ts:criarSaldosIniciaisEmMassa`.
 */

import { ehLinhaCabecalho } from '@/lib/fracoes-massa'

const CABECALHOS_SALDO = ['fracao', 'identificacao', 'identificacao da fracao']

export type LinhaSaldoInicial = {
  /** 1-based, como a pessoa vê no que colou. */
  numeroLinha: number
  identificacao: string
  valor: number
}

export type ErroLinhaSaldo = {
  numeroLinha: number
  texto: string
  erro: string
}

export type ResultadoParseSaldos = {
  linhas: LinhaSaldoInicial[]
  erros: ErroLinhaSaldo[]
}

/**
 * Lê um valor em euros como se escreve em Portugal. Aceita "1.234,56",
 * "1234,56", "1234.56" e "1234", com ou sem "€".
 *
 * A regra do separador de milhares: se aparecerem **os dois** símbolos, o
 * ponto é milhares e a vírgula é decimal ("1.234,56"). Se só aparecer o
 * ponto, é decimal ("1234.56") — não há forma de distinguir "1.234" de mil
 * duzentos e trinta e quatro sem contexto, e tratar o ponto como decimal é
 * o que não perde cêntimos por engano.
 */
export function lerValorEuros(valor: string): number | null {
  let limpo = valor.trim().replace(/€/g, '').replace(/\s/g, '')
  if (!limpo) return null

  const temPonto = limpo.includes('.')
  const temVirgula = limpo.includes(',')

  if (temPonto && temVirgula) {
    limpo = limpo.replace(/\./g, '').replace(',', '.')
  } else if (temVirgula) {
    limpo = limpo.replace(',', '.')
  }

  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null
  const n = Number(limpo)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

function separarColunas(linha: string): string[] {
  // Tabulação (colagem do Excel) ou ponto e vírgula (escrita à mão). Nunca
  // vírgula — é o separador decimal do valor.
  if (linha.includes('\t')) return linha.split('\t')
  return linha.split(';')
}

export function parsearSaldosIniciais(texto: string): ResultadoParseSaldos {
  const linhas: LinhaSaldoInicial[] = []
  const erros: ErroLinhaSaldo[] = []

  let primeiraLinhaUtil = true

  texto.split(/\r?\n/).forEach((original, i) => {
    const numeroLinha = i + 1
    const linha = original.trim()
    if (!linha) return

    const colunas = separarColunas(linha).map((c) => c.trim())

    if (primeiraLinhaUtil) {
      primeiraLinhaUtil = false
      if (ehLinhaCabecalho(colunas[0] ?? '', CABECALHOS_SALDO)) return
    }

    if (colunas.length < 2) {
      erros.push({
        numeroLinha,
        texto: linha,
        erro: 'Faltam colunas — são precisas duas: identificação da fração e valor em dívida.',
      })
      return
    }

    const [identificacao = '', valorTexto = ''] = colunas
    if (!identificacao) {
      erros.push({ numeroLinha, texto: linha, erro: 'Falta a identificação da fração.' })
      return
    }

    const valor = lerValorEuros(valorTexto)
    if (valor === null) {
      erros.push({
        numeroLinha,
        texto: linha,
        erro: `"${valorTexto}" não é um valor válido. Escreva o montante em dívida, por exemplo 125,50. Tem de ser maior do que zero.`,
      })
      return
    }

    linhas.push({ numeroLinha, identificacao, valor })
  })

  return { linhas, erros }
}

/**
 * Verificações sobre o conjunto: frações que não existem no condomínio e
 * frações repetidas no que foi colado (quase sempre um engano — dois saldos
 * iniciais para a mesma fração somam-se em silêncio e a dívida fica errada).
 *
 * `identificacoesExistentes` vem da base de dados mas é passada de fora,
 * para esta função continuar pura e testável.
 */
export function validarConjuntoSaldos(
  linhas: LinhaSaldoInicial[],
  identificacoesExistentes: string[],
): string[] {
  const erros: string[] = []
  const normalizar = (s: string) => s.trim().toLowerCase()
  const existentes = new Set(identificacoesExistentes.map(normalizar))

  const vistas = new Map<string, number>()
  for (const l of linhas) {
    const chave = normalizar(l.identificacao)

    if (!existentes.has(chave)) {
      erros.push(
        `Não existe nenhuma fração com a identificação "${l.identificacao}" (linha ${l.numeroLinha}). Verifique se está escrita exatamente como em "Frações".`,
      )
    }

    const anterior = vistas.get(chave)
    if (anterior !== undefined) {
      erros.push(
        `A fração "${l.identificacao}" aparece duas vezes (linhas ${anterior} e ${l.numeroLinha}). Some os valores numa só linha.`,
      )
    } else {
      vistas.set(chave, l.numeroLinha)
    }
  }

  return erros
}
