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
 * **Dívidas de vários anos** (corrigido 2026-08-24, no próprio dia em que a
 * primeira versão saiu): cada linha pode trazer a sua própria data numa
 * terceira coluna, e a mesma fração pode aparecer em várias linhas desde que
 * com datas diferentes. Sem isto, três anos de dívida ficavam num único
 * movimento com uma só data, e isso **falseava** a antiguidade da dívida
 * (`lib/antiguidade-divida.ts` distribui por escalões a partir da data do
 * movimento) e os juros de mora (`lib/juros.ts` conta dias de atraso pela
 * mesma data, a favor do devedor).
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
  /**
   * Data da dívida em formato ISO (`aaaa-mm-dd`), lida da terceira coluna.
   * `null` quando a linha não a traz — nesse caso vale a data por omissão
   * escolhida no diálogo, que é o comportamento de quem só tem um ano de
   * dívida e não quer pensar nisto.
   */
  dataIso: string | null
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

/**
 * Lê a data de uma linha. Aceita três formas, por ordem de conveniência
 * para quem tem a dívida organizada por ano:
 *
 * - `2023` — um ano só: fica **31 de dezembro de 2023**, que é como se fecha
 *   um exercício e como as dívidas antigas costumam estar registadas;
 * - `31/12/2023` — a forma como se escreve uma data em Portugal;
 * - `2023-12-31` — ISO, para quem exporta de outro sistema.
 *
 * Devolve sempre `aaaa-mm-dd`, ou `null` se não for nenhuma delas.
 */
export function lerDataSaldo(valor: string): string | null {
  const limpo = valor.trim()
  if (!limpo) return null

  const soAno = /^(\d{4})$/.exec(limpo)
  if (soAno) {
    const ano = Number(soAno[1])
    if (ano < 1900 || ano > 2200) return null
    return `${ano}-12-31`
  }

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpo)
  if (iso) return validarComponentes(Number(iso[1]), Number(iso[2]), Number(iso[3]))

  const pt = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(limpo)
  if (pt) return validarComponentes(Number(pt[3]), Number(pt[2]), Number(pt[1]))

  return null
}

/** Rejeita 31/02 e afins — o `Date` do JavaScript aceitaria e saltava para março. */
function validarComponentes(ano: number, mes: number, dia: number): string | null {
  if (ano < 1900 || ano > 2200 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null
  const d = new Date(Date.UTC(ano, mes - 1, dia))
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) {
    return null
  }
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
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

    const [identificacao = '', valorTexto = '', dataTexto = ''] = colunas
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

    // A data é opcional: sem ela vale a data por omissão do diálogo.
    let dataIso: string | null = null
    if (dataTexto) {
      dataIso = lerDataSaldo(dataTexto)
      if (dataIso === null) {
        erros.push({
          numeroLinha,
          texto: linha,
          erro: `"${dataTexto}" não é uma data válida. Escreva só o ano (2023), ou a data completa (31/12/2023).`,
        })
        return
      }
    }

    linhas.push({ numeroLinha, identificacao, valor, dataIso })
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
  dataPorOmissaoIso: string,
): string[] {
  const erros: string[] = []
  const normalizar = (s: string) => s.trim().toLowerCase()
  const existentes = new Set(identificacoesExistentes.map(normalizar))

  // A chave é fração **+ data**, não só fração: a mesma fração pode e deve
  // aparecer várias vezes quando deve vários anos. O que continua a ser um
  // engano é a mesma fração com a mesma data — aí os valores somavam-se em
  // silêncio e a dívida ficava errada.
  const vistas = new Map<string, number>()
  for (const l of linhas) {
    const chaveFracao = normalizar(l.identificacao)

    if (!existentes.has(chaveFracao)) {
      erros.push(
        `Não existe nenhuma fração com a identificação "${l.identificacao}" (linha ${l.numeroLinha}). Verifique se está escrita exatamente como em "Frações".`,
      )
    }

    const dataEfetiva = l.dataIso ?? dataPorOmissaoIso
    const chave = `${chaveFracao}|${dataEfetiva}`
    const anterior = vistas.get(chave)
    if (anterior !== undefined) {
      erros.push(
        `A fração "${l.identificacao}" aparece duas vezes com a mesma data (linhas ${anterior} e ${l.numeroLinha}). Some os valores numa só linha, ou indique datas diferentes se forem dívidas de anos diferentes.`,
      )
    } else {
      vistas.set(chave, l.numeroLinha)
    }
  }

  return erros
}
