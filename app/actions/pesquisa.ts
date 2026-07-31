'use server'

import { getAvisos } from '@/app/actions/avisos'
import { getDocumentos } from '@/app/actions/documentos'
import { getOcorrencias } from '@/app/actions/ocorrencias'
import { getMovimentosPaginado } from '@/app/actions/financas'
import { getFracoes, getMembros } from '@/app/actions/fracoes'
import { requireMembroAprovado, temConsultaGestao } from '@/lib/session'
import { removerAcentos } from '@/lib/format'
import { pesquisarSecoesAjuda } from '@/lib/pesquisa-ajuda'
import { SECOES_AJUDA } from '@/components/ajuda/secoes'

const LIMITE_POR_CATEGORIA = 5

export type ResultadoPesquisa = { titulo: string; subtitulo: string; href?: string }

export type PesquisaGlobalResultado = {
  avisos: ResultadoPesquisa[]
  documentos: ResultadoPesquisa[]
  ocorrencias: ResultadoPesquisa[]
  condominos: ResultadoPesquisa[]
  movimentos: ResultadoPesquisa[]
  ajuda: ResultadoPesquisa[]
}

function vazio(): PesquisaGlobalResultado {
  return { avisos: [], documentos: [], ocorrencias: [], condominos: [], movimentos: [], ajuda: [] }
}

function normalizarParaPesquisa(s: string): string {
  return removerAcentos(s.toLowerCase())
}

/**
 * Pesquisa entre módulos, para quem não sabe onde uma coisa está guardada
 * (FUNCTIONAL_GAPS.md, "Usabilidade transversal"). Reaproveita diretamente
 * as funções de listagem já existentes de cada módulo (já corrigidas para
 * pesquisa insensível a acentos) — cada uma aplica o seu próprio âmbito de
 * permissão; uma categoria a que o membro não tem acesso é omitida do
 * resultado em vez de rebentar a pesquisa inteira.
 */
export async function pesquisaGlobal(query: string): Promise<PesquisaGlobalResultado> {
  const m = await requireMembroAprovado()
  const termo = query.trim()
  if (termo.length < 2) return vazio()

  const [avisosR, documentosR, ocorrenciasR, movimentosR] = await Promise.all([
    getAvisos({ search: termo, page: 1 }),
    getDocumentos({ search: termo, page: 1 }),
    getOcorrencias({ search: termo, page: 1 }).catch(() => ({ ocorrencias: [] })),
    getMovimentosPaginado({ search: termo, page: 1 }).catch(() => ({ movimentos: [] })),
  ])

  let condominos: ResultadoPesquisa[] = []
  if (temConsultaGestao(m)) {
    const termoSemAcento = removerAcentos(termo.toLowerCase())
    const [membros, fracoes] = await Promise.all([getMembros(), getFracoes()])
    const deMembros = membros
      .filter(
        (mb) =>
          removerAcentos(mb.nome.toLowerCase()).includes(termoSemAcento) ||
          removerAcentos(mb.email.toLowerCase()).includes(termoSemAcento),
      )
      .map((mb) => ({ titulo: mb.nome, subtitulo: mb.email }))
    const deFracoes = fracoes
      .filter(
        (f) =>
          removerAcentos(f.identificacao.toLowerCase()).includes(termoSemAcento) ||
          removerAcentos(f.proprietario.toLowerCase()).includes(termoSemAcento),
      )
      .map((f) => ({ titulo: f.identificacao, subtitulo: f.proprietario }))
    condominos = [...deMembros, ...deFracoes].slice(0, LIMITE_POR_CATEGORIA)
  }

  const ajuda: ResultadoPesquisa[] = pesquisarSecoesAjuda(
    SECOES_AJUDA,
    termo,
    normalizarParaPesquisa,
    LIMITE_POR_CATEGORIA,
  ).map((r) => ({ titulo: r.label, subtitulo: r.trecho, href: `/ajuda?secao=${r.value}` }))

  return {
    avisos: avisosR.avisos
      .slice(0, LIMITE_POR_CATEGORIA)
      .map((a) => ({ titulo: a.titulo, subtitulo: a.conteudo.slice(0, 100) })),
    documentos: documentosR.documentos
      .slice(0, LIMITE_POR_CATEGORIA)
      .map((d) => ({ titulo: d.titulo, subtitulo: d.descricao ?? '' })),
    ocorrencias: ocorrenciasR.ocorrencias
      .slice(0, LIMITE_POR_CATEGORIA)
      .map((o) => ({ titulo: o.titulo, subtitulo: o.descricao ?? '' })),
    condominos,
    movimentos: movimentosR.movimentos
      .slice(0, LIMITE_POR_CATEGORIA)
      .map((mv) => ({ titulo: mv.categoria, subtitulo: mv.descricao ?? '' })),
    ajuda,
  }
}
