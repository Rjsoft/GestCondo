'use server'

import { db } from '@/lib/db'
import { fornecedor, membro, ocorrencia } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { apagarFicheiro, guardarFicheiro } from '@/lib/storage'
import {
  requireAdmin,
  requireMembroComEscrita,
  temConsultaGestao,
  temPermissaoGestao,
} from '@/lib/session'
import { and, count, desc, eq, getTableColumns, isNull, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 20

export async function getOcorrencias({ page = 1, search = '' }: { page?: number; search?: string } = {}) {
  const m = await requireMembroComEscrita()
  // Admin/gestor/auditor veem todas as do seu condomínio; os restantes
  // (condómino, inquilino, fornecedor) veem só as suas.
  const escopo = temConsultaGestao(m)
    ? and(eq(ocorrencia.condominioId, m.condominioId), isNull(ocorrencia.deletedAt))
    : and(
        eq(ocorrencia.condominioId, m.condominioId),
        eq(ocorrencia.userId, m.userId),
        isNull(ocorrencia.deletedAt),
      )

  const condicao = search
    ? and(
        escopo,
        or(
          sql`unaccent(${ocorrencia.titulo}) ilike unaccent(${`%${search}%`})`,
          sql`unaccent(${ocorrencia.descricao}) ilike unaccent(${`%${search}%`})`,
        ),
      )
    : escopo

  const [ocorrencias, [{ total }]] = await Promise.all([
    db
      .select({ ...getTableColumns(ocorrencia), fornecedorNome: fornecedor.nome })
      .from(ocorrencia)
      .leftJoin(fornecedor, eq(ocorrencia.fornecedorId, fornecedor.id))
      .where(condicao)
      .orderBy(desc(ocorrencia.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(ocorrencia).where(condicao),
  ])

  return { ocorrencias, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export async function criarOcorrencia(formData: FormData) {
  // Qualquer membro aprovado com poder de escrita (todos exceto auditor).
  const m = await requireMembroComEscrita()

  const titulo = String(formData.get('titulo') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const local = String(formData.get('local') || '').trim()
  const categoria = String(formData.get('categoria') || 'manutencao')
  const prioridade = String(formData.get('prioridade') || 'normal')

  if (!titulo || !descricao) {
    throw new Error('Preencha o título e a descrição')
  }

  const foto = formData.get('foto')
  let fotoUrl: string | null = null
  let fotoNomeFicheiro: string | null = null
  if (foto instanceof File && foto.size > 0) {
    const guardado = await guardarFicheiro(foto, 'ocorrencias')
    fotoUrl = guardado.url
    fotoNomeFicheiro = guardado.nomeFicheiro
  }

  const [nova] = await db
    .insert(ocorrencia)
    .values({
      condominioId: m.condominioId,
      userId: m.userId,
      reporterNome: m.nome,
      titulo,
      descricao,
      local: local || null,
      categoria,
      prioridade,
      estado: 'aberta',
      fotoUrl,
      fotoNomeFicheiro,
    })
    .returning({ id: ocorrencia.id })

  await registarAuditoria({
    actor: m,
    acao: 'criar',
    entidade: 'ocorrencia',
    entidadeId: nova.id,
    detalhes: titulo,
  })

  revalidatePath('/ocorrencias')
  revalidatePath('/')
}

const ESTADOS = ['aberta', 'em_curso', 'resolvida']

const ESTADO_LABEL: Record<string, string> = {
  aberta: 'Aberta',
  em_curso: 'Em curso',
  resolvida: 'Resolvida',
}

export async function atualizarEstadoOcorrencia(id: number, estado: string) {
  // Apenas admin/gestor gerem o estado das ocorrências.
  const admin = await requireAdmin()
  if (!ESTADOS.includes(estado)) throw new Error('Estado inválido')

  // Estado anterior, para o registo de auditoria mostrar a transição
  // completa (De X para Y) — sem isto não se sabia quando/de onde uma
  // ocorrência tinha mudado de estado, só o estado atual (FUNCTIONAL_GAPS.md,
  // "Histórico de intervenções"). Reaproveita o audit_log já existente, sem
  // tabela nova: a página /auditoria já lista por data/autor/entidade.
  const [antes] = await db
    .select({ estado: ocorrencia.estado })
    .from(ocorrencia)
    .where(and(eq(ocorrencia.id, id), eq(ocorrencia.condominioId, admin.condominioId)))
    .limit(1)
  if (antes && antes.estado === estado) return

  const [atualizada] = await db
    .update(ocorrencia)
    .set({ estado, updatedAt: new Date() })
    .where(
      and(
        eq(ocorrencia.id, id),
        eq(ocorrencia.condominioId, admin.condominioId),
      ),
    )
    .returning({ userId: ocorrencia.userId, titulo: ocorrencia.titulo })

  // Título incluído no detalhe (não só "estado alterado de X para Y") para
  // a pesquisa em /auditoria encontrar o histórico completo de uma
  // ocorrência específica pelo título, tal como já encontra a sua criação.
  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'ocorrencia',
    entidadeId: id,
    detalhes: antes
      ? `${atualizada?.titulo ?? ''}: estado alterado de "${ESTADO_LABEL[antes.estado] ?? antes.estado}" para "${ESTADO_LABEL[estado] ?? estado}"`
      : `${atualizada?.titulo ?? ''}: estado alterado para "${ESTADO_LABEL[estado] ?? estado}"`,
    alteracoes: [{ campo: 'estado', label: 'Estado', antes: antes?.estado ?? null, depois: estado }],
  })

  // Notifica quem reportou a ocorrência — não o próprio admin que a
  // atualizou, que já sabe.
  if (atualizada && atualizada.userId !== admin.userId) {
    const [reporter] = await db
      .select({ email: membro.email })
      .from(membro)
      .where(and(eq(membro.userId, atualizada.userId), eq(membro.condominioId, admin.condominioId)))
      .limit(1)

    if (reporter) {
      await sendEmail({
        to: reporter.email,
        subject: `Ocorrência atualizada: ${atualizada.titulo}`,
        html: `<p>A sua ocorrência "${atualizada.titulo}" passou para o estado <strong>${ESTADO_LABEL[estado] ?? estado}</strong>.</p><p>Consulte os detalhes na aplicação GestCondo.</p>`,
      })
    }
  }

  revalidatePath('/ocorrencias')
  revalidatePath('/')
}

/**
 * Atribui (ou remove, com fornecedorId null) o fornecedor responsável por
 * tratar uma ocorrência — só regista "quem está a tratar disto", sem
 * nenhuma ligação a despesas ou fluxo de aprovação (fica para depois).
 */
export async function atribuirFornecedorOcorrencia(id: number, fornecedorId: number | null) {
  // Mesma guarda de atualizarEstadoOcorrencia — só admin/gestor.
  const admin = await requireAdmin()

  let fornecedorNome: string | null = null
  if (fornecedorId !== null) {
    const [f] = await db
      .select({ id: fornecedor.id, nome: fornecedor.nome })
      .from(fornecedor)
      .where(and(eq(fornecedor.id, fornecedorId), eq(fornecedor.condominioId, admin.condominioId)))
      .limit(1)
    if (!f) throw new Error('Fornecedor inválido')
    fornecedorNome = f.nome
  }

  const condicao = and(eq(ocorrencia.id, id), eq(ocorrencia.condominioId, admin.condominioId))
  const [antes] = await db
    .select({ titulo: ocorrencia.titulo, fornecedorId: ocorrencia.fornecedorId })
    .from(ocorrencia)
    .where(condicao)
    .limit(1)
  if (!antes) throw new Error('Ocorrência não encontrada')
  if (antes.fornecedorId === fornecedorId) return

  await db.update(ocorrencia).set({ fornecedorId, updatedAt: new Date() }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'ocorrencia',
    entidadeId: id,
    detalhes: `${antes.titulo}: ${fornecedorId ? `fornecedor atribuído (${fornecedorNome})` : 'fornecedor removido'}`,
    alteracoes: [{ campo: 'fornecedorId', label: 'Fornecedor', antes: antes.fornecedorId, depois: fornecedorId }],
  })

  revalidatePath('/ocorrencias')
}

export async function eliminarOcorrencia(id: number) {
  const m = await requireMembroComEscrita()
  // Admin/gestor podem eliminar qualquer uma do seu condomínio; os
  // restantes só as suas.
  const condicao = temPermissaoGestao(m)
    ? and(eq(ocorrencia.id, id), eq(ocorrencia.condominioId, m.condominioId))
    : and(
        eq(ocorrencia.id, id),
        eq(ocorrencia.condominioId, m.condominioId),
        eq(ocorrencia.userId, m.userId),
      )

  const [existente] = await db
    .select({ fotoUrl: ocorrencia.fotoUrl })
    .from(ocorrencia)
    .where(condicao)
    .limit(1)

  await db.update(ocorrencia).set({ deletedAt: new Date() }).where(condicao)

  await registarAuditoria({
    actor: m,
    acao: 'eliminar',
    entidade: 'ocorrencia',
    entidadeId: id,
  })

  await apagarFicheiro(existente?.fotoUrl)

  revalidatePath('/ocorrencias')
}
