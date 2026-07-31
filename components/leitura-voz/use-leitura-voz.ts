'use client'

import { useCallback, useEffect, useId, useReducer, useRef, useState, useSyncExternalStore } from 'react'
import {
  construirSequenciaBlocosComIndices,
  escolherMelhorVoz,
  reduzirEstadoLeitura,
  validarVelocidade,
  VELOCIDADES,
  type BlocoLeitura,
  type EntradaBloco,
  type EstadoLeitura,
  type PreferenciaVoz,
  type VelocidadeChave,
  type VozInfo,
} from '@/lib/leitura-voz'

const CHAVE_PREFERENCIAS = 'gestcondo:leitura-voz:preferencias'
const EVENTO_PARAR = 'leitura-voz:parar-secao'
// Páginas com várias instâncias (ex: um botão "Ler este aviso" por aviso da
// lista) precisam de garantir que só uma lê de cada vez — o motor de voz do
// browser já só permite uma fala real em simultâneo, mas sem isto cada
// instância React não saberia que outra assumiu, ficando com o botão e o
// destaque presos no estado antigo (mesmo problema, por analogia, do que
// aconteceu com EVENTO_PARAR — ver relatório).
const EVENTO_INICIAR = 'leitura-voz:iniciar-secao'
const CLASSES_REALCE = ['outline-2', 'outline-offset-2', 'outline-primary', 'bg-primary/10', 'rounded']
const SELETOR_BLOCOS = 'h1, h2, h3, h4, p, li'
// Deliberadamente sem "a[href]": uma ligação dentro de uma frase (ex: "abra
// a página de registo") é texto normal da frase, não um controlo de UI — se
// fosse excluída, o bloco ficaria com uma frase quebrada. Isto exclui só
// controlos que nunca fazem parte do sentido de uma frase de conteúdo.
const SELETOR_INTERATIVOS = 'button, input, select, textarea, [role="button"], [contenteditable="true"]'

type Preferencias = { velocidade: VelocidadeChave; voz: PreferenciaVoz | null }

// Referência estável (não uma função que devolve um literal novo de cada
// vez) — getServerSnapshot do useSyncExternalStore, mais abaixo, tem de
// devolver sempre a mesma referência quando nada mudou, senão o React entra
// em ciclo de re-render (foi mesmo apanhado assim numa verificação manual
// no browser, não é só uma preocupação teórica).
const PREFERENCIAS_OMISSAO: Preferencias = { velocidade: 'normal', voz: null }

function preferenciasPorOmissao(): Preferencias {
  return PREFERENCIAS_OMISSAO
}

function lerPreferencias(): Preferencias {
  if (typeof window === 'undefined') return preferenciasPorOmissao()
  try {
    const raw = window.localStorage.getItem(CHAVE_PREFERENCIAS)
    if (!raw) return preferenciasPorOmissao()
    const dados = JSON.parse(raw)
    const voz =
      dados?.voz && typeof dados.voz.voiceURI === 'string'
        ? (dados.voz as PreferenciaVoz)
        : null
    return { velocidade: validarVelocidade(dados?.velocidade), voz }
  } catch {
    return preferenciasPorOmissao()
  }
}

function gravarPreferencias(prefs: Preferencias) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(prefs))
  } catch {
    // localStorage indisponível (modo privado, quota esgotada) — a leitura
    // continua a funcionar normalmente, só não guarda a preferência.
  }
}

// --- Preferências como pequeno "external store" próprio (mesmo padrão das
// vozes, acima) — evita um useState inicializado com valor por omissão e
// corrigido depois num useEffect (setState direto no corpo de um efeito).
// Também sincroniza entre separadores/abas do mesmo browser via o evento
// nativo 'storage'.
let preferenciasCache: Preferencias | null = null
const ouvintesPreferencias = new Set<() => void>()

function getPreferenciasSnapshot(): Preferencias {
  if (preferenciasCache === null) preferenciasCache = lerPreferencias()
  return preferenciasCache
}
function getPreferenciasServerSnapshot(): Preferencias {
  return preferenciasPorOmissao()
}
function subscreverPreferencias(callback: () => void) {
  ouvintesPreferencias.add(callback)
  if (typeof window === 'undefined') return () => ouvintesPreferencias.delete(callback)
  const aoMudarNoutraAba = (ev: StorageEvent) => {
    if (ev.key !== null && ev.key !== CHAVE_PREFERENCIAS) return
    preferenciasCache = lerPreferencias()
    callback()
  }
  window.addEventListener('storage', aoMudarNoutraAba)
  return () => {
    ouvintesPreferencias.delete(callback)
    window.removeEventListener('storage', aoMudarNoutraAba)
  }
}
function atualizarPreferencias(novas: Preferencias) {
  preferenciasCache = novas
  gravarPreferencias(novas)
  ouvintesPreferencias.forEach((cb) => cb())
}
function useLeituraVozPreferencias(): Preferencias {
  return useSyncExternalStore(
    subscreverPreferencias,
    getPreferenciasSnapshot,
    getPreferenciasServerSnapshot,
  )
}

// --- Deteção de suporte, sem setState em efeitos e sem risco de hidratação
// inconsistente: useSyncExternalStore permite que o servidor e o cliente
// devolvam valores diferentes de propósito, sem aviso de mismatch — ao
// contrário de um useState/useEffect a corrigir o valor depois de montar.
function subscreverNunca() {
  return () => {}
}
function suporteNoServidor() {
  return false
}
function suporteNoCliente() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
function useSuportaLeituraVoz(): boolean {
  return useSyncExternalStore(subscreverNunca, suporteNoCliente, suporteNoServidor)
}

// --- Vozes: cache module-level atualizada pelo evento nativo
// 'voiceschanged'; nunca fica "presa a carregar" (getVoices() vazio é um
// snapshot válido) e nunca duplica listeners (useSyncExternalStore só
// subscreve uma vez por consumidor montado).
let vozesCache: SpeechSynthesisVoice[] = []
function subscreverVozes(callback: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => {}
  const atualizar = () => {
    vozesCache = window.speechSynthesis.getVoices()
    callback()
  }
  window.speechSynthesis.addEventListener('voiceschanged', atualizar)
  atualizar()
  return () => window.speechSynthesis.removeEventListener('voiceschanged', atualizar)
}
function getVozesSnapshot() {
  return vozesCache
}
function useVozesDisponiveis(): SpeechSynthesisVoice[] {
  return useSyncExternalStore(subscreverVozes, getVozesSnapshot, getVozesSnapshot)
}

function paraVozInfo(v: SpeechSynthesisVoice): VozInfo {
  return { voiceURI: v.voiceURI, name: v.name, lang: v.lang, default: v.default, localService: v.localService }
}

// --- Extração do conteúdo legível -----------------------------------------
// Contrato explícito: só lê dentro do contentor com o id indicado (que deve
// ter data-speech-content), ignora elementos com data-speech-ignore,
// [hidden], aria-hidden="true", .sr-only, invisíveis por CSS (em qualquer
// antepassado, via Element.checkVisibility quando disponível) e controlos
// interativos. Usa data-speech-text como texto alternativo quando presente.

function estaVisivel(el: HTMLElement): boolean {
  if (typeof el.checkVisibility === 'function') {
    return el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true })
  }
  return el.offsetParent !== null || window.getComputedStyle(el).position === 'fixed'
}

function temAntepassadoIgnorado(el: HTMLElement, container: HTMLElement): boolean {
  let atual: HTMLElement | null = el
  while (atual && atual !== container.parentElement) {
    if (
      atual.hasAttribute('data-speech-ignore') ||
      atual.hasAttribute('hidden') ||
      atual.getAttribute('aria-hidden') === 'true' ||
      atual.classList.contains('sr-only')
    ) {
      return true
    }
    atual = atual.parentElement
  }
  return false
}

/** Texto "próprio" de um bloco, sem repetir o texto de blocos aninhados
 * (ex: um <li> que introduz uma sub-lista <ul><li>...) — evita ler o mesmo
 * conteúdo duas vezes. Usa textContent, não innerText: innerText depende de
 * layout e é pouco fiável em nós clonados/destacados do documento. */
function textoProprioDoBloco(el: HTMLElement): string {
  const alternativo = el.getAttribute('data-speech-text')
  if (alternativo) return alternativo
  const clone = el.cloneNode(true) as HTMLElement
  clone.querySelectorAll(SELETOR_BLOCOS).forEach((filho) => filho.remove())
  clone.querySelectorAll(SELETOR_INTERATIVOS).forEach((filho) => filho.remove())
  return clone.textContent ?? ''
}

function extrairBlocosDom(
  targetId: string,
): { entradas: EntradaBloco[]; elementos: HTMLElement[] } | null {
  const container = document.getElementById(targetId)
  if (!container) return null
  const candidatos = Array.from(container.querySelectorAll<HTMLElement>(SELETOR_BLOCOS))
  const entradas: EntradaBloco[] = []
  const elementos: HTMLElement[] = []
  for (const el of candidatos) {
    if (el.matches(SELETOR_INTERATIVOS)) continue
    if (temAntepassadoIgnorado(el, container)) continue
    if (!estaVisivel(el)) continue
    const texto = textoProprioDoBloco(el).trim()
    if (!texto) continue
    entradas.push({ tag: el.tagName.toLowerCase(), texto })
    elementos.push(el)
  }
  return { entradas, elementos }
}

// --- Atalho de teclado -----------------------------------------------------
// Ver RELATORIO_LEITURA_VOZ.md para a justificação de Alt+Shift+R em vez de
// accessKey ou de um atalho de letra única.
function elementoEhCampoDeTexto(el: Element | null): boolean {
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  return el.getAttribute('contenteditable') === 'true'
}

export type EstadoUI = 'indisponivel' | EstadoLeitura

export function useLeituraVoz(targetId: string, ativarAtalho = true) {
  const suportado = useSuportaLeituraVoz()
  const vozesNativas = useVozesDisponiveis()
  const instanciaId = useId()

  const [estado, dispatch] = useReducer(reduzirEstadoLeitura, 'idle')
  const preferencias = useLeituraVozPreferencias()
  const [avisoSemVozPt, setAvisoSemVozPt] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const sessaoRef = useRef(0)
  const blocosRef = useRef<{ el: HTMLElement; bloco: BlocoLeitura }[]>([])
  const indiceRef = useRef(0)
  const elementoRealcadoRef = useRef<HTMLElement | null>(null)
  // Sincronizada num efeito (nunca durante o render) para que `passo`,
  // dentro de falarBloco, leia sempre a preferência mais recente mesmo a
  // meio de uma sequência de blocos já em curso — mudar a velocidade não
  // recria a cadeia de callbacks já agendada, só esta ref.
  const preferenciasRef = useRef(preferencias)
  const scrollSuspensoRef = useRef(false)
  const scrollProgramaticoRef = useRef(false)

  useEffect(() => {
    preferenciasRef.current = preferencias
  }, [preferencias])

  const limparRealce = useCallback(() => {
    if (elementoRealcadoRef.current) {
      elementoRealcadoRef.current.classList.remove(...CLASSES_REALCE)
      elementoRealcadoRef.current = null
    }
  }, [])

  const pararTudo = useCallback(() => {
    sessaoRef.current += 1
    if (suportado) window.speechSynthesis.cancel()
    limparRealce()
    blocosRef.current = []
    indiceRef.current = 0
    scrollSuspensoRef.current = false
    dispatch({ tipo: 'PARAR' })
  }, [limparRealce, suportado])

  // Cancela ao desmontar (sair da rota), ao ouvir o evento de "mudou de
  // secção" disparado por quem gere os separadores, e ao ouvir outra
  // instância a começar a ler (ex: outro botão "Ler este aviso" na mesma
  // página) — decisão deliberada de não depender de onend/onerror para
  // repor o estado (ver relatório): pararTudo() repõe tudo diretamente e
  // de forma síncrona.
  useEffect(() => {
    const aoParar = () => pararTudo()
    const aoIniciarOutra = (ev: Event) => {
      const detalhe = (ev as CustomEvent<{ instanciaId: string }>).detail
      if (detalhe?.instanciaId !== instanciaId) pararTudo()
    }
    window.addEventListener(EVENTO_PARAR, aoParar)
    window.addEventListener(EVENTO_INICIAR, aoIniciarOutra)
    return () => {
      window.removeEventListener(EVENTO_PARAR, aoParar)
      window.removeEventListener(EVENTO_INICIAR, aoIniciarOutra)
      // Invalida a sessão antes de cancelar — sem isto, um onend/onerror
      // nativo que chegue atrasado (a API confirma o cancelamento de forma
      // assíncrona, por vezes com atraso real) podia encontrar sessaoRef
      // por incrementar e continuar para o bloco seguinte depois de a
      // página já ter sido abandonada.
      sessaoRef.current += 1
      if (suportado) window.speechSynthesis.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao montar/desmontar; pararTudo e instanciaId (useId) já são estáveis
  }, [])

  const acompanharScroll = useCallback((el: HTMLElement) => {
    if (scrollSuspensoRef.current) return
    const rect = el.getBoundingClientRect()
    const dentroDaJanela = rect.top >= 0 && rect.bottom <= window.innerHeight
    if (dentroDaJanela) return
    const reduzMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    scrollProgramaticoRef.current = true
    el.scrollIntoView({ behavior: reduzMovimento ? 'auto' : 'smooth', block: 'center' })
    window.setTimeout(() => {
      scrollProgramaticoRef.current = false
    }, 600)
  }, [])

  useEffect(() => {
    // Ouve o evento nativo 'scroll' (não só wheel/touchmove) — cobre também
    // scroll por teclado (PageUp/PageDown/setas), arrastar a scrollbar, ou
    // qualquer outro mecanismo; scrollProgramaticoRef distingue o scroll que
    // a própria leitura provocou do que o utilizador fez manualmente.
    const aoFazerScroll = () => {
      if (!scrollProgramaticoRef.current) scrollSuspensoRef.current = true
    }
    window.addEventListener('scroll', aoFazerScroll, { passive: true })
    return () => window.removeEventListener('scroll', aoFazerScroll)
  }, [])

  const falarBloco = useCallback(
    (indice: number, sessao: number) => {
      function passo(i: number) {
        if (sessao !== sessaoRef.current) return // leitura antiga, ignorar
        const fila = blocosRef.current
        if (i >= fila.length) {
          limparRealce()
          dispatch({ tipo: 'TERMINOU' })
          return
        }
        limparRealce()
        indiceRef.current = i
        const { el, bloco } = fila[i]
        el.classList.add(...CLASSES_REALCE)
        elementoRealcadoRef.current = el
        acompanharScroll(el)

        const utterance = new SpeechSynthesisUtterance(bloco.texto)
        const vozes = vozesNativas.map(paraVozInfo)
        const vozEscolhida = escolherMelhorVoz(vozes, preferenciasRef.current.voz)
        if (vozEscolhida) {
          const vozReal = vozesNativas.find((v) => v.voiceURI === vozEscolhida.voiceURI)
          if (vozReal) utterance.voice = vozReal
          utterance.lang = vozEscolhida.lang
          setAvisoSemVozPt(!vozEscolhida.lang.toLowerCase().startsWith('pt'))
        } else {
          utterance.lang = 'pt-PT'
          setAvisoSemVozPt(true)
        }
        utterance.rate = VELOCIDADES[preferenciasRef.current.velocidade]
        utterance.onend = () => {
          if (sessao !== sessaoRef.current) return
          passo(i + 1)
        }
        utterance.onerror = (ev) => {
          if (sessao !== sessaoRef.current) return
          if (ev.error === 'canceled' || ev.error === 'interrupted') return // cancelamento nosso, já tratado
          limparRealce()
          setErro('Não foi possível continuar a leitura. Tente novamente.')
          dispatch({ tipo: 'ERRO' })
        }
        window.speechSynthesis.speak(utterance)
      }
      passo(indice)
    },
    [acompanharScroll, limparRealce, vozesNativas],
  )

  const iniciarSecao = useCallback(() => {
    if (!suportado) {
      setErro('O seu browser não suporta leitura em voz alta.')
      return
    }
    const resultado = extrairBlocosDom(targetId)
    if (!resultado || resultado.entradas.length === 0) return
    // Usa os índices originais devolvidos por construirSequenciaBlocosComIndices
    // para emparelhar cada bloco com o seu elemento — mesma fonte de verdade
    // do que entradas ficam, sem repetir o critério de filtragem à parte.
    const pares = construirSequenciaBlocosComIndices(resultado.entradas).map(
      ({ bloco, indiceOriginal }) => ({ el: resultado.elementos[indiceOriginal], bloco }),
    )

    // Avisa qualquer outra instância montada na página (ex: outro botão
    // "Ler este aviso") para parar primeiro — o motor de voz do browser só
    // permite uma fala real de cada vez; sem isto, a instância anterior
    // ficaria com o botão/destaque presos, mesmo com o áudio já a mudar.
    window.dispatchEvent(new CustomEvent(EVENTO_INICIAR, { detail: { instanciaId } }))

    setErro(null)
    scrollSuspensoRef.current = false
    blocosRef.current = pares
    indiceRef.current = 0
    sessaoRef.current += 1
    const sessaoAtual = sessaoRef.current
    window.speechSynthesis.cancel()
    dispatch({ tipo: 'INICIAR' })
    falarBloco(0, sessaoAtual)
  }, [falarBloco, instanciaId, suportado, targetId])

  const pausar = useCallback(() => {
    if (!suportado) return
    window.speechSynthesis.pause()
    dispatch({ tipo: 'PAUSAR' })
  }, [suportado])

  const retomar = useCallback(() => {
    if (!suportado) return
    window.speechSynthesis.resume()
    dispatch({ tipo: 'RETOMAR' })
  }, [suportado])

  const parar = useCallback(() => {
    pararTudo()
  }, [pararTudo])

  const reiniciarSecao = useCallback(() => {
    iniciarSecao()
  }, [iniciarSecao])

  /** Muda voz/velocidade: reinicia sempre o bloco atual com as novas
   * definições (mesmo comportamento em "a ler" e "em pausa"), em vez de
   * tentar retomar a meio de uma frase — mais simples e previsível do que
   * tentar preservar a posição exata dentro do bloco. */
  const aplicarNovaConfiguracao = useCallback(
    (novas: Partial<Preferencias>) => {
      const atualizado = { ...preferenciasRef.current, ...novas }
      // Atualiza a ref já aqui, não só no efeito que a sincroniza com o
      // estado do store — falarBloco(), chamado já a seguir, tem de ver o
      // valor novo de imediato, sem esperar pelo próximo ciclo de render.
      preferenciasRef.current = atualizado
      atualizarPreferencias(atualizado)
      if (estado === 'speaking' || estado === 'paused') {
        const indiceAtual = indiceRef.current
        sessaoRef.current += 1
        const sessaoAtual = sessaoRef.current
        window.speechSynthesis.cancel()
        dispatch({ tipo: 'INICIAR' })
        falarBloco(indiceAtual, sessaoAtual)
      }
    },
    [estado, falarBloco],
  )

  const definirVelocidade = useCallback(
    (velocidade: VelocidadeChave) => aplicarNovaConfiguracao({ velocidade }),
    [aplicarNovaConfiguracao],
  )

  const definirVoz = useCallback(
    (voz: PreferenciaVoz) => aplicarNovaConfiguracao({ voz }),
    [aplicarNovaConfiguracao],
  )

  // Atalho global Alt+Shift+R — inicia/pausa/retoma. Ver relatório para a
  // comparação com accessKey e com um atalho de letra única.
  useEffect(() => {
    if (!ativarAtalho || !suportado) return
    const aoTeclar = (ev: KeyboardEvent) => {
      if (elementoEhCampoDeTexto(document.activeElement)) return
      if (!ev.altKey || !ev.shiftKey || ev.ctrlKey || ev.metaKey) return
      if (ev.key.toLowerCase() !== 'r') return
      ev.preventDefault()
      if (estado === 'idle' || estado === 'error') iniciarSecao()
      else if (estado === 'speaking') pausar()
      else if (estado === 'paused') retomar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [ativarAtalho, suportado, estado, iniciarSecao, pausar, retomar])

  const vozesPortuguesas = vozesNativas.filter((v) => v.lang.toLowerCase().startsWith('pt'))

  const estadoUI: EstadoUI = !suportado ? 'indisponivel' : estado

  return {
    estado: estadoUI,
    erro,
    avisoSemVozPt,
    velocidade: preferencias.velocidade,
    vozesPortuguesas,
    vozPreferidaURI: preferencias.voz?.voiceURI ?? null,
    iniciarSecao,
    pausar,
    retomar,
    parar,
    reiniciarSecao,
    definirVelocidade,
    definirVoz,
  }
}

/** Chamado por quem controla os separadores (ex: onValueChange da Tabs) —
 * dispara o cancelamento para qualquer instância de useLeituraVoz montada na
 * página, sem as duas partes precisarem de se conhecer diretamente. */
export function pararLeituraAoMudarSecao() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENTO_PARAR))
}
