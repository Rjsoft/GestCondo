// Lógica pura da funcionalidade "Ler em voz alta" — sem DOM, sem
// `speechSynthesis`, para poder ser testada em Node (vitest.config.ts usa
// environment: 'node', sem jsdom). Tudo o que precisa de DOM/API do browser
// vive em components/leitura-voz/use-leitura-voz.ts.

export type TipoBloco = 'titulo' | 'subtitulo' | 'paragrafo' | 'item'

export type BlocoLeitura = {
  tipo: TipoBloco
  texto: string
}

/** Par (tag HTML, texto já extraído) — representação independente do DOM,
 * para poder testar a construção da sequência de blocos sem jsdom. */
export type EntradaBloco = {
  tag: string
  texto: string
}

const TIPO_POR_TAG: Record<string, TipoBloco> = {
  h1: 'titulo',
  h2: 'titulo',
  h3: 'subtitulo',
  h4: 'subtitulo',
  p: 'paragrafo',
  li: 'item',
}

/** Um único caractere sem leitura fiável em nenhuma voz testada — troca
 * puramente ortográfica, nunca altera o valor numérico à volta. Deliberadamente
 * conservador: sem normalizar €, %, siglas ou datas nesta fase (ver
 * RELATORIO_LEITURA_VOZ.md) — exigiria testar em vozes reais para não
 * arriscar trocar a pronúncia por algo pior ou incorreto. */
export function normalizarTextoParaFala(texto: string): string {
  return texto.replace(/‰/g, ' por mil').replace(/\s+/g, ' ').trim()
}

function tipoEtextoValidos(entrada: EntradaBloco): { tipo: TipoBloco; texto: string } | null {
  const tipo = TIPO_POR_TAG[entrada.tag.toLowerCase()]
  if (!tipo) return null
  const texto = normalizarTextoParaFala(entrada.texto)
  if (texto.length === 0) return null
  return { tipo, texto }
}

export function construirSequenciaBlocos(entradas: EntradaBloco[]): BlocoLeitura[] {
  const blocos: BlocoLeitura[] = []
  for (const entrada of entradas) {
    const valido = tipoEtextoValidos(entrada)
    if (valido) blocos.push(valido)
  }
  return blocos
}

/**
 * Mesma construção que `construirSequenciaBlocos`, mas devolvendo também o
 * índice original de cada entrada em `entradas` — permite ao chamador
 * emparelhar cada bloco com o elemento DOM correspondente sem duplicar o
 * critério de filtragem (mesma fonte de verdade, sem risco de desalinhar os
 * dois se a normalização vier a mudar no futuro).
 */
export function construirSequenciaBlocosComIndices(
  entradas: EntradaBloco[],
): { bloco: BlocoLeitura; indiceOriginal: number }[] {
  const resultado: { bloco: BlocoLeitura; indiceOriginal: number }[] = []
  entradas.forEach((entrada, indiceOriginal) => {
    const valido = tipoEtextoValidos(entrada)
    if (valido) resultado.push({ bloco: valido, indiceOriginal })
  })
  return resultado
}

// --- Vozes ---------------------------------------------------------------

/** Subconjunto de SpeechSynthesisVoice usado nas funções puras — permite
 * testar com objetos simples em vez de instâncias reais do browser. */
export type VozInfo = {
  voiceURI: string
  name: string
  lang: string
  default: boolean
  localService: boolean
}

export type PreferenciaVoz = {
  voiceURI: string
  nome: string
  lang: string
}

export function normalizarLocale(lang: string): string {
  return lang.trim().toLowerCase().replace(/_/g, '-')
}

export function ePtPt(lang: string): boolean {
  return normalizarLocale(lang) === 'pt-pt'
}

export function ePortugues(lang: string): boolean {
  return normalizarLocale(lang).startsWith('pt')
}

export function serializarPreferenciaVoz(voz: VozInfo): PreferenciaVoz {
  return { voiceURI: voz.voiceURI, nome: voz.name, lang: voz.lang }
}

export function encontrarVozPorPreferencia(
  vozes: VozInfo[],
  preferencia: PreferenciaVoz,
): VozInfo | null {
  return (
    vozes.find((v) => v.voiceURI === preferencia.voiceURI) ??
    vozes.find((v) => v.name === preferencia.nome && v.lang === preferencia.lang) ??
    null
  )
}

/**
 * Escolhe a melhor voz disponível, por ordem de prioridade:
 * 1. voz da preferência guardada (se ainda existir);
 * 2. pt-PT exata, com critério de desempate: voz do sistema marcada como
 *    predefinida > voz local (não remota) > primeira encontrada;
 * 3. qualquer outra voz em português (mesmo critério de desempate);
 * 4. a voz marcada como predefinida do sistema, seja qual for o idioma;
 * 5. a primeira voz da lista.
 * Devolve null só quando a lista de vozes está mesmo vazia.
 */
export function escolherMelhorVoz(
  vozes: VozInfo[],
  preferencia?: PreferenciaVoz | null,
): VozInfo | null {
  if (vozes.length === 0) return null

  if (preferencia) {
    const porPreferencia = encontrarVozPorPreferencia(vozes, preferencia)
    if (porPreferencia) return porPreferencia
  }

  const melhorDoGrupo = (grupo: VozInfo[]): VozInfo | null => {
    if (grupo.length === 0) return null
    return (
      grupo.find((v) => v.default && v.localService) ??
      grupo.find((v) => v.default) ??
      grupo.find((v) => v.localService) ??
      grupo[0]
    )
  }

  const ptPt = melhorDoGrupo(vozes.filter((v) => ePtPt(v.lang)))
  if (ptPt) return ptPt

  const portugues = melhorDoGrupo(vozes.filter((v) => ePortugues(v.lang)))
  if (portugues) return portugues

  return vozes.find((v) => v.default) ?? vozes[0]
}

// --- Velocidade ------------------------------------------------------------

export const VELOCIDADES = {
  lenta: 0.8,
  normal: 1,
  rapida: 1.2,
} as const

export type VelocidadeChave = keyof typeof VELOCIDADES

export function validarVelocidade(valor: unknown): VelocidadeChave {
  return valor === 'lenta' || valor === 'normal' || valor === 'rapida' ? valor : 'normal'
}

// --- Máquina de estados ------------------------------------------------------

/**
 * Estados realmente alcançáveis pela implementação (ver RELATORIO_LEITURA_VOZ.md
 * secção "Máquina de estados" para a justificação de não incluir
 * 'loading-voices' nem 'stopping' como estados distintos: o carregamento de
 * vozes nunca bloqueia a UI — usa sempre o snapshot disponível, mesmo vazio —,
 * e parar é sempre síncrono do lado da aplicação, nunca à espera de um evento
 * nativo, por isso não existe um estado intermédio real de "a parar").
 */
export type EstadoLeitura = 'idle' | 'speaking' | 'paused' | 'error'

export type AcaoLeitura =
  | { tipo: 'INICIAR' }
  | { tipo: 'PAUSAR' }
  | { tipo: 'RETOMAR' }
  | { tipo: 'PARAR' }
  | { tipo: 'TERMINOU' }
  | { tipo: 'ERRO' }

export function reduzirEstadoLeitura(estado: EstadoLeitura, acao: AcaoLeitura): EstadoLeitura {
  switch (acao.tipo) {
    case 'INICIAR':
      return 'speaking'
    case 'PAUSAR':
      return estado === 'speaking' ? 'paused' : estado
    case 'RETOMAR':
      return estado === 'paused' ? 'speaking' : estado
    case 'PARAR':
      return 'idle'
    case 'TERMINOU':
      return 'idle'
    case 'ERRO':
      return 'error'
    default:
      return estado
  }
}
