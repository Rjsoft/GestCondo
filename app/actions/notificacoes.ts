'use server'

import { getAvisos } from '@/app/actions/avisos'
import { getConversas, getContagemMensagensNaoLidas } from '@/app/actions/mensagens'
import { getOcorrencias } from '@/app/actions/ocorrencias'
import { requireMembroAprovado, temConsultaGestao, temPermissaoGestao } from '@/lib/session'

const LIMITE_POR_CATEGORIA = 5

export type NotificacaoItem = { titulo: string; subtitulo: string; href: string }
export type CategoriaNotificacoes = { total: number; itens: NotificacaoItem[] }

export type Notificacoes = {
  mensagens: CategoriaNotificacoes
  avisos: CategoriaNotificacoes
  ocorrencias: CategoriaNotificacoes
}

/**
 * Centro de notificações — reúne o que já é rastreado em cada módulo
 * (mensagens por ler, avisos importantes/urgentes por confirmar,
 * ocorrências que precisam de ação) num só sítio, sem tabela nova.
 * `avisos`/`ocorrencias` só veem a 1ª página de cada listagem (mais
 * recentes) — em condomínios com um volume muito grande, um item mais
 * antigo por confirmar/triar pode não aparecer aqui (ver FUNCTIONAL_GAPS.md).
 */
export async function getNotificacoes(): Promise<Notificacoes> {
  const m = await requireMembroAprovado()
  const ehAuditor = m.perfil === 'auditor' && !m.isSuperAdmin

  const [contagemMensagens, avisosR, ocorrenciasR] = await Promise.all([
    ehAuditor ? Promise.resolve(0) : getContagemMensagensNaoLidas().catch(() => 0),
    getAvisos({ page: 1 }),
    ehAuditor ? Promise.resolve({ ocorrencias: [] }) : getOcorrencias({ page: 1 }).catch(() => ({ ocorrencias: [] })),
  ])

  let itensMensagens: NotificacaoItem[] = []
  if (temPermissaoGestao(m)) {
    const { conversas } = await getConversas()
    itensMensagens = conversas
      .filter((c) => c.naoLidas > 0)
      .slice(0, LIMITE_POR_CATEGORIA)
      .map((c) => ({
        titulo: c.nome,
        subtitulo: `${c.naoLidas} mensagem${c.naoLidas > 1 ? 's' : ''} por ler`,
        href: `/mensagens/${c.userId}`,
      }))
  } else if (contagemMensagens > 0) {
    itensMensagens = [
      {
        titulo: 'Administração',
        subtitulo: `${contagemMensagens} mensagem${contagemMensagens > 1 ? 's' : ''} por ler`,
        href: '/mensagens',
      },
    ]
  }

  const itensAvisos: NotificacaoItem[] = avisosR.avisos
    .filter((a) => (a.prioridade === 'importante' || a.prioridade === 'urgente') && !a.jaConfirmei)
    .slice(0, LIMITE_POR_CATEGORIA)
    .map((a) => ({
      titulo: a.titulo,
      subtitulo: a.prioridade === 'urgente' ? 'Urgente — por confirmar' : 'Importante — por confirmar',
      href: '/avisos',
    }))

  let itensOcorrencias: NotificacaoItem[] = []
  if (m.perfil === 'fornecedor' && m.fornecedorId) {
    itensOcorrencias = ocorrenciasR.ocorrencias
      .filter((o) => o.fornecedorId === m.fornecedorId && o.estado === 'aberta')
      .slice(0, LIMITE_POR_CATEGORIA)
      .map((o) => ({ titulo: o.titulo, subtitulo: 'Atribuída a si — por aceitar', href: '/ocorrencias' }))
  } else if (temConsultaGestao(m)) {
    itensOcorrencias = ocorrenciasR.ocorrencias
      .filter((o) => o.estado === 'aberta')
      .slice(0, LIMITE_POR_CATEGORIA)
      .map((o) => ({ titulo: o.titulo, subtitulo: 'Aberta — por triar', href: '/ocorrencias' }))
  }

  return {
    mensagens: { total: contagemMensagens, itens: itensMensagens },
    avisos: { total: itensAvisos.length, itens: itensAvisos },
    ocorrencias: { total: itensOcorrencias.length, itens: itensOcorrencias },
  }
}
