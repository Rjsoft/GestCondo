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

/**
 * Um ficheiro guardado a partir do modelo (ou do Excel) traz uma linha de
 * cabeçalho. Só a **primeira** linha não vazia é candidata, e só quando a
 * primeira coluna é uma das palavras conhecidas — nunca por adivinhação a
 * partir do conteúdo, para não engolir em silêncio uma linha de dados com
 * um erro que a pessoa devia ver.
 */
export function ehLinhaCabecalho(primeiraColuna: string, palavras: string[]): boolean {
  const normalizada = primeiraColuna
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  return palavras.includes(normalizada)
}

const CABECALHOS_FRACAO = ['identificacao', 'fracao', 'identificacao da fracao']

export type LinhaFracaoMassa = {
  /** 1-based, como a pessoa vê no que colou — para as mensagens de erro. */
  numeroLinha: number
  identificacao: string
  proprietario: string
  permilagem: number
  nif: string | null
  contactoEmail: string | null
  contactoTelefone: string | null
}

/** O que se sabe de uma fração já existente, para planear atualizações. */
export type FracaoExistente = {
  id: number
  identificacao: string
  nif: string | null
  contactoEmail: string | null
  contactoTelefone: string | null
}

/**
 * Campos que uma importação pode preencher numa fração que já existe.
 *
 * **Ficam de fora, deliberadamente**: `permilagem` (mudá-la altera o rateio
 * de todas as quotas), `proprietario` (tem fluxo próprio,
 * `registarTransmissaoFracao`, com histórico de titularidade e efeitos
 * legais na declaração de dívida) e `isentaElevador` (também mexe no
 * cálculo do rateio). Um ficheiro colado não pode ser a porta de entrada
 * para nada disso — ver `FUNCTIONAL_GAPS.md` secção 11.
 */
export const CAMPOS_ATUALIZAVEIS = {
  nif: 'NIF',
  contactoEmail: 'Email',
  contactoTelefone: 'Telefone',
} as const

export type CampoAtualizavel = keyof typeof CAMPOS_ATUALIZAVEIS

export type AtualizacaoFracao = {
  id: number
  identificacao: string
  numeroLinha: number
  campos: { campo: CampoAtualizavel; label: string; novo: string }[]
}

export type PlanoImportacao = {
  aCriar: LinhaFracaoMassa[]
  aAtualizar: AtualizacaoFracao[]
  /** Já existem e o ficheiro não traz nada de novo — nem erro, nem trabalho. */
  semAlteracao: string[]
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

  let primeiraLinhaUtil = true

  todas.forEach((original, i) => {
    const numeroLinha = i + 1
    const linha = original.trim()
    if (!linha) return

    const colunas = separarColunas(linha).map((c) => c.trim())

    if (primeiraLinhaUtil) {
      primeiraLinhaUtil = false
      if (ehLinhaCabecalho(colunas[0] ?? '', CABECALHOS_FRACAO)) return
    }
    const [
      identificacao = '',
      proprietario = '',
      permilagemTexto = '',
      nif = '',
      contactoEmail = '',
      contactoTelefone = '',
    ] = colunas

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
      contactoEmail: contactoEmail || null,
      contactoTelefone: contactoTelefone || null,
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
export function normalizarIdentificacao(s: string): string {
  return s.trim().toLowerCase()
}

export function validarConjuntoFracoes(
  linhas: LinhaFracaoMassa[],
  identificacoesExistentes: string[],
  somaPermilagemExistente: number,
  opcoes: { atualizarExistentes?: boolean } = {},
): string[] {
  const erros: string[] = []
  const jaExistem = new Set(identificacoesExistentes.map(normalizarIdentificacao))

  const vistas = new Map<string, number>()
  for (const l of linhas) {
    const chave = normalizarIdentificacao(l.identificacao)
    const anterior = vistas.get(chave)
    if (anterior !== undefined) {
      erros.push(
        `A identificação "${l.identificacao}" aparece duas vezes (linhas ${anterior} e ${l.numeroLinha}).`,
      )
    } else {
      vistas.set(chave, l.numeroLinha)
    }
    // Com "atualizar existentes" ligado, uma fração que já existe deixa de
    // ser um erro e passa a ser uma linha de atualização.
    if (jaExistem.has(chave) && !opcoes.atualizarExistentes) {
      erros.push(`Já existe uma fração com a identificação "${l.identificacao}" neste condomínio.`)
    }
  }

  // Só a permilagem das frações **novas** conta para o limite: a de uma
  // fração existente já está incluída em `somaPermilagemExistente`, e a
  // importação nunca lhe toca.
  const somaNovas = linhas
    .filter((l) => !jaExistem.has(normalizarIdentificacao(l.identificacao)))
    .reduce((s, l) => s + l.permilagem, 0)
  if (excedePermilagemTotal(somaPermilagemExistente, somaNovas)) {
    erros.push(
      `A soma das permilagens ficaria em ${(somaPermilagemExistente + somaNovas).toFixed(2)}‰ — acima do máximo de ${PERMILAGEM_TOTAL_MAX}‰.`,
    )
  }

  return erros
}

/**
 * Separa o que o ficheiro pede em criações e atualizações.
 *
 * **Regra que não se negoceia**: só preenche campos **vazios**. Um valor já
 * gravado nunca é substituído por esta via — ao contrário de criar, uma
 * atualização em massa podia destruir dados corretos em silêncio, e uma
 * lista trazida de outro sistema está muitas vezes mais desatualizada do
 * que o que já está na aplicação. Quem quiser corrigir um valor existente
 * usa "Editar fração", onde vê o que está lá antes de escrever por cima.
 */
export function planearImportacaoFracoes(
  linhas: LinhaFracaoMassa[],
  existentes: FracaoExistente[],
): PlanoImportacao {
  const porIdentificacao = new Map(
    existentes.map((f) => [normalizarIdentificacao(f.identificacao), f]),
  )

  const aCriar: LinhaFracaoMassa[] = []
  const aAtualizar: AtualizacaoFracao[] = []
  const semAlteracao: string[] = []

  for (const l of linhas) {
    const existente = porIdentificacao.get(normalizarIdentificacao(l.identificacao))
    if (!existente) {
      aCriar.push(l)
      continue
    }

    const campos: AtualizacaoFracao['campos'] = []
    for (const campo of Object.keys(CAMPOS_ATUALIZAVEIS) as CampoAtualizavel[]) {
      const novo = l[campo]
      const atual = existente[campo]
      const atualVazio = atual === null || atual.trim() === ''
      if (novo && atualVazio) {
        campos.push({ campo, label: CAMPOS_ATUALIZAVEIS[campo], novo })
      }
    }

    if (campos.length > 0) {
      aAtualizar.push({
        id: existente.id,
        identificacao: existente.identificacao,
        numeroLinha: l.numeroLinha,
        campos,
      })
    } else {
      semAlteracao.push(existente.identificacao)
    }
  }

  return { aCriar, aAtualizar, semAlteracao }
}
