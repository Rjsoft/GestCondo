// Lógica pura de importação/conciliação de extrato bancário — sem acesso a
// BD, testável isoladamente (ver lib/extrato.test.ts). O acesso a BD fica em
// app/actions/extrato.ts.

/** Faz parsing de um texto CSV para linhas de campos de texto. Lida com
 * campos entre aspas (podendo conter o delimitador ou quebras de linha) e
 * aspas escapadas (""). Não assume nenhum formato de banco específico —
 * o mapeamento de colunas é feito depois por `mapearLinhas`. */
export function parseCsv(texto: string, delimitador = ','): string[][] {
  const linhas: string[][] = []
  let campoAtual = ''
  let linhaAtual: string[] = []
  let dentroDeAspas = false

  // Normaliza quebras de linha para simplificar o loop.
  const conteudo = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < conteudo.length; i++) {
    const char = conteudo[i]
    const proximo = conteudo[i + 1]

    if (dentroDeAspas) {
      if (char === '"' && proximo === '"') {
        campoAtual += '"'
        i++
      } else if (char === '"') {
        dentroDeAspas = false
      } else {
        campoAtual += char
      }
      continue
    }

    if (char === '"') {
      dentroDeAspas = true
    } else if (char === delimitador) {
      linhaAtual.push(campoAtual)
      campoAtual = ''
    } else if (char === '\n') {
      linhaAtual.push(campoAtual)
      linhas.push(linhaAtual)
      linhaAtual = []
      campoAtual = ''
    } else {
      campoAtual += char
    }
  }
  // Última linha (sem quebra de linha final).
  if (campoAtual !== '' || linhaAtual.length > 0) {
    linhaAtual.push(campoAtual)
    linhas.push(linhaAtual)
  }

  return linhas.filter((linha) => linha.some((campo) => campo.trim() !== ''))
}

export type MapeamentoColunas =
  | { modo: 'valorUnico'; colData: number; colDescricao: number; colValor: number }
  | {
      modo: 'debitoCredito'
      colData: number
      colDescricao: number
      colDebito: number
      colCredito: number
    }

export type LinhaExtratoImportada = {
  data: Date
  descricao: string
  valor: number
}

function parseValor(texto: string): number {
  // Aceita "1234,56", "1.234,56", "1234.56" — remove separador de milhares
  // e normaliza a vírgula decimal para ponto.
  const limpo = texto.trim().replace(/\s/g, '')
  const temVirgulaDecimal = /,\d{1,2}$/.test(limpo)
  const normalizado = temVirgulaDecimal
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo.replace(/,/g, '')
  const valor = Number(normalizado)
  if (Number.isNaN(valor)) {
    throw new Error(`Valor inválido: "${texto}"`)
  }
  return valor
}

function parseData(texto: string): Date {
  const t = texto.trim()
  // dd/mm/aaaa ou dd-mm-aaaa
  const matchPt = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (matchPt) {
    const [, dia, mes, ano] = matchPt
    return new Date(Number(ano), Number(mes) - 1, Number(dia))
  }
  // aaaa-mm-dd (ISO)
  const matchIso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (matchIso) {
    const [, ano, mes, dia] = matchIso
    return new Date(Number(ano), Number(mes) - 1, Number(dia))
  }
  const data = new Date(t)
  if (Number.isNaN(data.getTime())) {
    throw new Error(`Data inválida: "${texto}"`)
  }
  return data
}

/** Aplica o mapeamento de colunas escolhido pelo utilizador às linhas em
 * bruto do CSV (já sem a linha de cabeçalho), devolvendo linhas prontas a
 * importar. Lança se alguma linha tiver uma data ou valor inválido. */
export function mapearLinhas(
  linhas: string[][],
  mapeamento: MapeamentoColunas,
): LinhaExtratoImportada[] {
  return linhas.map((linha) => {
    const data = parseData(linha[mapeamento.colData] ?? '')
    const descricao = (linha[mapeamento.colDescricao] ?? '').trim()
    let valor: number
    if (mapeamento.modo === 'valorUnico') {
      valor = parseValor(linha[mapeamento.colValor] ?? '')
    } else {
      const debitoTexto = (linha[mapeamento.colDebito] ?? '').trim()
      const creditoTexto = (linha[mapeamento.colCredito] ?? '').trim()
      const debito = debitoTexto ? parseValor(debitoTexto) : 0
      const credito = creditoTexto ? parseValor(creditoTexto) : 0
      // Débito é tipicamente exportado como positivo — a saída de dinheiro
      // conta como negativo na nossa convenção assinada.
      valor = credito - Math.abs(debito)
    }
    return { data, descricao, valor }
  })
}

export type MovimentoParaConciliar = {
  id: number
  data: Date
  valor: number // já com sinal aplicado: receita = positivo, despesa = negativo
}

export type SugestaoConciliacao = {
  linhaIndex: number
  movimentoId: number
}

/** Sugere pares (linha do extrato, movimento) por valor exatamente igual e
 * data dentro de `janelaDias`. Cada movimento só é sugerido para uma linha
 * (o primeiro par válido por ordem de proximidade de data), evitando
 * sugerir o mesmo movimento duas vezes. Não decide nada sozinho — só
 * pré-preenche a UI, a confirmação final é sempre manual. */
export function sugerirCorrespondencias(
  linhasExtrato: { data: Date; valor: number }[],
  movimentos: MovimentoParaConciliar[],
  janelaDias = 5,
): SugestaoConciliacao[] {
  const usados = new Set<number>()
  const sugestoes: SugestaoConciliacao[] = []
  const msPorDia = 24 * 60 * 60 * 1000

  linhasExtrato.forEach((linha, linhaIndex) => {
    const candidatos = movimentos
      .filter((m) => !usados.has(m.id))
      .filter((m) => Math.abs(m.valor - linha.valor) < 0.005)
      .map((m) => ({
        movimento: m,
        diffDias: Math.abs(m.data.getTime() - linha.data.getTime()) / msPorDia,
      }))
      .filter((c) => c.diffDias <= janelaDias)
      .sort((a, b) => a.diffDias - b.diffDias)

    const melhor = candidatos[0]
    if (melhor) {
      usados.add(melhor.movimento.id)
      sugestoes.push({ linhaIndex, movimentoId: melhor.movimento.id })
    }
  })

  return sugestoes
}
