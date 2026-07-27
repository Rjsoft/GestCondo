'use server'

import { db } from '@/lib/db'
import { membro, mensagem } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { removerAcentos } from '@/lib/format'
import { PERFIS_GESTAO, temPermissaoGestao, type Perfil } from '@/lib/perfis'
import { requireAdmin, requireMembroComEscrita } from '@/lib/session'
import { and, asc, count, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 20
const CONTEUDO_MAX = 2000

function validarConteudo(conteudo: string) {
  const texto = conteudo.trim()
  if (!texto) throw new Error('Escreva uma mensagem')
  if (texto.length > CONTEUDO_MAX) {
    throw new Error(`A mensagem não pode exceder ${CONTEUDO_MAX} caracteres`)
  }
  return texto
}

/** Um membro de gestão (admin/gestor) ou auditor nunca pode ser o "dono" de
 * uma conversa — impede a administração de abrir/criar uma conversa com
 * outro admin/gestor/auditor. */
function ehAlvoInvalido(perfil: string) {
  return PERFIS_GESTAO.includes(perfil as Perfil) || perfil === 'auditor'
}

/** Conversa do próprio membro (condómino/inquilino/fornecedor) com a
 * administração do seu condomínio. Marca como lidas, como efeito
 * secundário, as mensagens da administração ainda não vistas — UX de
 * conversa, ao contrário do "confirmar leitura" de documentos/avisos, que é
 * um ato deliberado e distinto. */
export async function getMinhaConversa() {
  const m = await requireMembroComEscrita()

  const mensagens = await db
    .select()
    .from(mensagem)
    .where(and(eq(mensagem.condominioId, m.condominioId), eq(mensagem.userId, m.userId)))
    .orderBy(asc(mensagem.createdAt))

  await db
    .update(mensagem)
    .set({ lida: true })
    .where(
      and(
        eq(mensagem.condominioId, m.condominioId),
        eq(mensagem.userId, m.userId),
        eq(mensagem.autorEhGestao, true),
        eq(mensagem.lida, false),
      ),
    )

  return mensagens
}

/** Envia mensagem na própria conversa — nunca aceita um destinatário vindo
 * do cliente, ao contrário de enviarMensagemParaMembro. */
export async function enviarMensagemPropria(conteudo: string) {
  const m = await requireMembroComEscrita()
  const texto = validarConteudo(conteudo)

  const [nova] = await db
    .insert(mensagem)
    .values({
      condominioId: m.condominioId,
      userId: m.userId,
      autorUserId: m.userId,
      autorNome: m.nome,
      autorEhGestao: false,
      conteudo: texto,
    })
    .returning({ id: mensagem.id })

  // Sem nome nem conteúdo em `detalhes` — /auditoria é visível a auditor,
  // que não deve conseguir reconstruir quem escreveu o quê a partir do
  // registo de auditoria.
  await registarAuditoria({
    actor: m,
    acao: 'criar',
    entidade: 'mensagem',
    entidadeId: nova.id,
    detalhes: 'Mensagem enviada',
  })

  revalidatePath('/mensagens')
}

/** Conversa de um membro específico, vista pela administração. */
export async function getConversa(userId: string) {
  const admin = await requireAdmin()

  const [membroAlvo] = await db
    .select()
    .from(membro)
    .where(and(eq(membro.userId, userId), eq(membro.condominioId, admin.condominioId)))
    .limit(1)

  if (membroAlvo && ehAlvoInvalido(membroAlvo.perfil)) {
    throw new Error('Conversa não disponível')
  }

  const mensagens = await db
    .select()
    .from(mensagem)
    .where(and(eq(mensagem.condominioId, admin.condominioId), eq(mensagem.userId, userId)))
    .orderBy(asc(mensagem.createdAt))

  if (mensagens.length === 0 && !membroAlvo) {
    throw new Error('Conversa não encontrada')
  }

  await db
    .update(mensagem)
    .set({ lida: true })
    .where(
      and(
        eq(mensagem.condominioId, admin.condominioId),
        eq(mensagem.userId, userId),
        eq(mensagem.autorEhGestao, false),
        eq(mensagem.lida, false),
      ),
    )

  // Se o membro já foi removido (ex. sucessão por óbito), o nome vem da
  // mensagem mais antiga que ele escreveu — a conversa fica acessível na
  // mesma, como evidência, em vez de desaparecer.
  const nome =
    membroAlvo?.nome ?? mensagens.find((msg) => !msg.autorEhGestao)?.autorNome ?? 'Ex-membro'

  return { mensagens, nome, perfil: membroAlvo?.perfil ?? null }
}

/** Resposta da administração a um membro específico. */
export async function enviarMensagemParaMembro(userId: string, conteudo: string) {
  const admin = await requireAdmin()
  const texto = validarConteudo(conteudo)

  const [membroAlvo] = await db
    .select()
    .from(membro)
    .where(and(eq(membro.userId, userId), eq(membro.condominioId, admin.condominioId)))
    .limit(1)
  if (!membroAlvo) throw new Error('Membro não encontrado')
  if (ehAlvoInvalido(membroAlvo.perfil)) {
    throw new Error('Não é possível enviar mensagem a este perfil')
  }

  const [nova] = await db
    .insert(mensagem)
    .values({
      condominioId: admin.condominioId,
      userId,
      autorUserId: admin.userId,
      autorNome: admin.nome,
      autorEhGestao: true,
      conteudo: texto,
    })
    .returning({ id: mensagem.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'mensagem',
    entidadeId: nova.id,
    detalhes: 'Mensagem enviada',
  })

  revalidatePath(`/mensagens/${userId}`)
  revalidatePath('/mensagens')
}

/** Lista de conversas do condomínio, uma linha por membro com pelo menos
 * uma mensagem — agregada em memória a partir de todas as mensagens do
 * condomínio, tal como getMapaSaldos() agrega quotas por fração; o volume
 * esperado (uma conversa por condómino) não justifica uma query SQL de
 * agregação. */
export async function getConversas({ page = 1, search = '' }: { page?: number; search?: string } = {}) {
  const admin = await requireAdmin()

  const [mensagens, membros] = await Promise.all([
    db
      .select()
      .from(mensagem)
      .where(eq(mensagem.condominioId, admin.condominioId))
      .orderBy(desc(mensagem.createdAt)),
    db
      .select({ userId: membro.userId, nome: membro.nome, perfil: membro.perfil })
      .from(membro)
      .where(eq(membro.condominioId, admin.condominioId)),
  ])

  const membroPorUserId = new Map(membros.map((m) => [m.userId, m]))

  type Conversa = {
    userId: string
    nome: string | null
    perfil: string | null
    ultimaMensagem: string
    ultimaData: Date
    naoLidas: number
  }
  const porUtilizador = new Map<string, Conversa>()

  // `mensagens` já vem ordenada da mais recente para a mais antiga, por
  // isso a primeira ocorrência de cada userId é sempre a última mensagem
  // dessa conversa.
  for (const msg of mensagens) {
    let conversa = porUtilizador.get(msg.userId)
    if (!conversa) {
      const membroAtual = membroPorUserId.get(msg.userId)
      conversa = {
        userId: msg.userId,
        nome: membroAtual?.nome ?? null,
        perfil: membroAtual?.perfil ?? null,
        ultimaMensagem: msg.conteudo,
        ultimaData: msg.createdAt,
        naoLidas: 0,
      }
      porUtilizador.set(msg.userId, conversa)
    }
    // Membro removido: recupera o nome a partir da mensagem mais recente
    // que ele próprio escreveu (nunca do lado da gestão).
    if (!conversa.nome && !msg.autorEhGestao) conversa.nome = msg.autorNome
    if (!msg.autorEhGestao && !msg.lida) conversa.naoLidas++
  }

  let conversas = Array.from(porUtilizador.values()).map((c) => ({
    ...c,
    nome: c.nome ?? 'Ex-membro',
  }))

  if (search) {
    const termo = removerAcentos(search.toLowerCase())
    conversas = conversas.filter((c) => removerAcentos(c.nome.toLowerCase()).includes(termo))
  }

  const total = conversas.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pagina = conversas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return { conversas: pagina, total, page, totalPages }
}

/** Contagem de não lidas para o badge da sidebar — gestão vê o total de
 * conversas por ler do condomínio; um membro comum só a sua. */
export async function getContagemMensagensNaoLidas() {
  const m = await requireMembroComEscrita()

  if (temPermissaoGestao(m)) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(mensagem)
      .where(
        and(
          eq(mensagem.condominioId, m.condominioId),
          eq(mensagem.autorEhGestao, false),
          eq(mensagem.lida, false),
        ),
      )
    return total
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(mensagem)
    .where(
      and(
        eq(mensagem.condominioId, m.condominioId),
        eq(mensagem.userId, m.userId),
        eq(mensagem.autorEhGestao, true),
        eq(mensagem.lida, false),
      ),
    )
  return total
}
