'use server'

import { db } from '@/lib/db'
import { confirmacaoLeitura, documento } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { apagarFicheiro, guardarFicheiro } from '@/lib/storage'
import { requireAdmin, requireMembroAprovado, temConsultaGestao } from '@/lib/session'
import { confirmarLeitura, getConfirmacoesLeitura } from '@/lib/confirmacao-leitura'
import { and, count, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 20

export async function getDocumentos({ page = 1, search = '' }: { page?: number; search?: string } = {}) {
  const m = await requireMembroAprovado()
  // Documentos confidenciais só são devolvidos a quem já gere/audita o
  // condomínio — filtrado aqui, nunca só na UI, mesmo critério de
  // minimização já usado para IBAN/contactos pessoais.
  const base = temConsultaGestao(m)
    ? and(eq(documento.condominioId, m.condominioId), isNull(documento.deletedAt))
    : and(
        eq(documento.condominioId, m.condominioId),
        isNull(documento.deletedAt),
        eq(documento.confidencial, false),
      )
  const condicao = search
    ? and(
        base,
        or(
          sql`unaccent(${documento.titulo}) ilike unaccent(${`%${search}%`})`,
          sql`unaccent(${documento.descricao}) ilike unaccent(${`%${search}%`})`,
        ),
      )
    : base

  const [documentosPagina, [{ total }]] = await Promise.all([
    db
      .select()
      .from(documento)
      .where(condicao)
      .orderBy(desc(documento.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(documento).where(condicao),
  ])

  const documentoIds = documentosPagina.map((d) => d.id)
  const confirmacoes = documentoIds.length
    ? await db
        .select({ entidadeId: confirmacaoLeitura.entidadeId, membroId: confirmacaoLeitura.membroId })
        .from(confirmacaoLeitura)
        .where(
          and(
            eq(confirmacaoLeitura.condominioId, m.condominioId),
            eq(confirmacaoLeitura.entidade, 'documento'),
            inArray(confirmacaoLeitura.entidadeId, documentoIds),
          ),
        )
    : []

  const documentos = documentosPagina.map((d) => ({
    ...d,
    totalConfirmacoes: confirmacoes.filter((c) => c.entidadeId === d.id).length,
    jaConfirmei: confirmacoes.some((c) => c.entidadeId === d.id && c.membroId === m.id),
  }))

  return { documentos, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

/** Regista que o membro autenticado confirma ter lido este documento. */
export async function confirmarLeituraDocumento(id: number) {
  const m = await requireMembroAprovado()
  const [d] = await db
    .select({ id: documento.id })
    .from(documento)
    .where(and(eq(documento.id, id), eq(documento.condominioId, m.condominioId), isNull(documento.deletedAt)))
    .limit(1)
  if (!d) throw new Error('Documento não encontrado')

  await confirmarLeitura({
    condominioId: m.condominioId,
    membroId: m.id,
    entidade: 'documento',
    entidadeId: id,
  })

  await registarAuditoria({
    actor: m,
    acao: 'atualizar',
    entidade: 'documento',
    entidadeId: id,
    detalhes: 'Confirmação de leitura',
  })

  revalidatePath('/documentos')
}

/**
 * Lista de quem já confirmou a leitura — visível a qualquer membro aprovado,
 * mesmo critério já usado para avisos/assembleias.
 */
export async function getConfirmacoesLeituraDocumento(id: number) {
  const m = await requireMembroAprovado()
  return getConfirmacoesLeitura(m.condominioId, 'documento', id)
}

export async function criarDocumento(formData: FormData) {
  const admin = await requireAdmin()

  const titulo = String(formData.get('titulo') || '').trim()
  const categoria = String(formData.get('categoria') || 'ata')
  const descricao = String(formData.get('descricao') || '').trim()
  const confidencial = formData.get('confidencial') === 'on'
  let url = String(formData.get('url') || '').trim()
  let nomeFicheiro: string | null = null

  if (!titulo) {
    throw new Error('Preencha o título do documento')
  }

  const ficheiro = formData.get('ficheiro')
  if (ficheiro instanceof File && ficheiro.size > 0) {
    // Um ficheiro carregado tem prioridade sobre um link colado à mão.
    const guardado = await guardarFicheiro(ficheiro, 'documentos')
    url = guardado.url
    nomeFicheiro = guardado.nomeFicheiro
  } else if (url && !/^https?:\/\//i.test(url)) {
    throw new Error('O link deve começar por http:// ou https://')
  }

  const [novo] = await db
    .insert(documento)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      titulo,
      categoria,
      descricao: descricao || null,
      url: url || null,
      nomeFicheiro,
      confidencial,
    })
    .returning({ id: documento.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'documento',
    entidadeId: novo.id,
    detalhes: titulo,
  })

  revalidatePath('/documentos')
}

/**
 * Marca ou desmarca um documento como confidencial — só admin/gestor, com
 * efeito imediato na visibilidade (ver getDocumentos()).
 */
export async function alternarConfidencialidadeDocumento(id: number, confidencial: boolean) {
  const admin = await requireAdmin()
  const condicao = and(eq(documento.id, id), eq(documento.condominioId, admin.condominioId))
  const [antes] = await db.select({ titulo: documento.titulo, confidencial: documento.confidencial }).from(documento).where(condicao).limit(1)
  if (!antes) throw new Error('Documento não encontrado')
  if (antes.confidencial === confidencial) return

  await db.update(documento).set({ confidencial }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'documento',
    entidadeId: id,
    detalhes: confidencial ? `${antes.titulo}: marcado como confidencial` : `${antes.titulo}: tornado público`,
    alteracoes: [{ campo: 'confidencial', label: 'Confidencial', antes: antes.confidencial, depois: confidencial }],
  })

  revalidatePath('/documentos')
}

export async function eliminarDocumento(id: number) {
  const admin = await requireAdmin()
  const condicao = and(eq(documento.id, id), eq(documento.condominioId, admin.condominioId))

  const [existente] = await db.select({ url: documento.url }).from(documento).where(condicao).limit(1)

  await db.update(documento).set({ deletedAt: new Date() }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'documento',
    entidadeId: id,
  })

  await apagarFicheiro(existente?.url)

  revalidatePath('/documentos')
}
