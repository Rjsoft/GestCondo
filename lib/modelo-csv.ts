/**
 * Modelos descarregáveis para preencher no Excel e voltar a carregar
 * (`FUNCTIONAL_GAPS.md` secção 11).
 *
 * **Porquê CSV e não `.xlsx`**: ler e escrever `.xlsx` a sério exige uma
 * biblioteca de folhas de cálculo, que este projeto não tem — o `jszip`
 * que existe serve os `.zip` do arquivo documental e não lê folhas. O CSV
 * abre e grava nativamente no Excel, e evita uma dependência nova só para
 * isto. Se um dia o `.xlsx` for mesmo necessário, é uma decisão de
 * dependência a tomar à parte.
 *
 * Dois detalhes que fazem a diferença entre "abre bem" e "abre uma
 * salgalhada", e por isso estão aqui e não espalhados pelos componentes:
 *
 * 1. **Separador `;`** — o Excel em português usa o ponto e vírgula como
 *    separador de listas (a vírgula é o separador decimal). Com vírgulas,
 *    o Excel português mete a linha toda numa só célula.
 * 2. **BOM UTF-8** — sem ele, o Excel lê o ficheiro como ANSI e os acentos
 *    aparecem trocados ("Identificaçãoo").
 */

const BOM = '﻿'
const SEPARADOR = ';'

export type ModeloCsv = {
  nomeFicheiro: string
  cabecalho: string[]
  exemplos: string[][]
}

export const MODELO_FRACOES: ModeloCsv = {
  nomeFicheiro: 'modelo-fracoes.csv',
  cabecalho: ['Identificação', 'Proprietário', 'Permilagem', 'NIF (opcional)'],
  exemplos: [
    ['1ºDto', 'Maria Silva', '83,33', '123456789'],
    ['1ºEsq', 'João Costa', '83,33', ''],
    ['R/C Dto', 'Ana Sousa', '100', ''],
  ],
}

export const MODELO_SALDOS: ModeloCsv = {
  nomeFicheiro: 'modelo-saldos-iniciais.csv',
  cabecalho: ['Fração', 'Valor em dívida', 'Ano ou data (opcional)'],
  // Os exemplos mostram de propósito a mesma fração em dois anos: é o caso
  // que a primeira versão desta funcionalidade não cobria, e é o que faz a
  // antiguidade da dívida e os juros de mora contarem certo.
  exemplos: [
    ['1ºDto', '125,50', '2024'],
    ['1ºDto', '340,00', '2025'],
    ['1ºEsq', '1.234,56', ''],
  ],
}

/** Envolve em aspas apenas quando é mesmo preciso, para o ficheiro ficar legível num editor de texto. */
function celula(valor: string): string {
  if (valor.includes(SEPARADOR) || valor.includes('"') || valor.includes('\n')) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

/** Conteúdo do modelo, pronto a gravar. Puro — testável sem browser. */
export function gerarCsvModelo(modelo: ModeloCsv): string {
  const linhas = [modelo.cabecalho, ...modelo.exemplos]
  return BOM + linhas.map((l) => l.map(celula).join(SEPARADOR)).join('\r\n') + '\r\n'
}

/**
 * Descarrega o modelo no browser. Fica aqui e não no componente para os
 * dois diálogos (frações e saldos) partilharem exatamente o mesmo
 * comportamento.
 */
export function descarregarModelo(modelo: ModeloCsv) {
  const blob = new Blob([gerarCsvModelo(modelo)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = modelo.nomeFicheiro
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Lê um ficheiro escolhido pela pessoa e devolve o texto, já sem BOM — o
 * BOM que nós próprios pomos no modelo voltaria a entrar aqui e apareceria
 * colado à primeira identificação, fazendo a fração "não existir".
 */
export async function lerFicheiroTexto(ficheiro: File): Promise<string> {
  const texto = await ficheiro.text()
  return texto.replace(/^﻿/, '')
}
