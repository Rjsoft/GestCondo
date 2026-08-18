'use server'

import { createHash } from 'node:crypto'
import JSZip from 'jszip'
import { get } from '@vercel/blob'
import { db } from '@/lib/db'
import { confirmacaoLeitura, documento, documentoVersao } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { apagarFicheiro, guardarFicheiro } from '@/lib/storage'
import { requireAdmin, requireMembroAprovado, requireOperacionalOuAdmin, temConsultaGestao } from '@/lib/session'
import { confirmarLeitura, getConfirmacoesLeitura } from '@/lib/confirmacao-leitura'
import { and, count, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 20

export async function getDocumentos({
  page = 1,
  search = '',
  mostrarArquivados = false,
}: { page?: number; search?: string; mostrarArquivados?: boolean } = {}) {
  const m = await requireMembroAprovado()
  // Documentos confidenciais só são devolvidos a quem já gere/audita o
  // condomínio — filtrado aqui, nunca só na UI, mesmo critério de
  // minimização já usado para IBAN/contactos pessoais.
  const base = temConsultaGestao(m)
    ? and(
        eq(documento.condominioId, m.condominioId),
        isNull(documento.deletedAt),
        eq(documento.arquivado, mostrarArquivados),
      )
    : and(
        eq(documento.condominioId, m.condominioId),
        isNull(documento.deletedAt),
        eq(documento.confidencial, false),
        eq(documento.arquivado, mostrarArquivados),
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
  const [confirmacoes, versoes] = await Promise.all([
    documentoIds.length
      ? db
          .select({ entidadeId: confirmacaoLeitura.entidadeId, membroId: confirmacaoLeitura.membroId })
          .from(confirmacaoLeitura)
          .where(
            and(
              eq(confirmacaoLeitura.condominioId, m.condominioId),
              eq(confirmacaoLeitura.entidade, 'documento'),
              inArray(confirmacaoLeitura.entidadeId, documentoIds),
            ),
          )
      : Promise.resolve([]),
    documentoIds.length
      ? db
          .select({ documentoId: documentoVersao.documentoId })
          .from(documentoVersao)
          .where(inArray(documentoVersao.documentoId, documentoIds))
      : Promise.resolve([]),
  ])

  const documentos = documentosPagina.map((d) => ({
    ...d,
    totalConfirmacoes: confirmacoes.filter((c) => c.entidadeId === d.id).length,
    jaConfirmei: confirmacoes.some((c) => c.entidadeId === d.id && c.membroId === m.id),
    totalVersoes: versoes.filter((v) => v.documentoId === d.id).length,
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
  // F03: um colaborador operacional pode carregar documentos.
  const admin = await requireOperacionalOuAdmin()

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

/**
 * Marca ou desmarca um documento como arquivado (FUNCTIONAL_GAPS.md,
 * secção 6, "arquivo morto") — distinto de eliminarDocumento: o documento
 * continua a existir e a poder ser consultado/exportado, só sai da
 * listagem principal por já não ser relevante no dia a dia.
 */
export async function alternarArquivoDocumento(id: number, arquivado: boolean) {
  const admin = await requireAdmin()
  const condicao = and(eq(documento.id, id), eq(documento.condominioId, admin.condominioId))
  const [antes] = await db.select({ titulo: documento.titulo, arquivado: documento.arquivado }).from(documento).where(condicao).limit(1)
  if (!antes) throw new Error('Documento não encontrado')
  if (antes.arquivado === arquivado) return

  await db.update(documento).set({ arquivado }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'documento',
    entidadeId: id,
    detalhes: arquivado ? `${antes.titulo}: arquivado` : `${antes.titulo}: desarquivado`,
    alteracoes: [{ campo: 'arquivado', label: 'Arquivado', antes: antes.arquivado, depois: arquivado }],
  })

  revalidatePath('/documentos')
}

export async function eliminarDocumento(id: number) {
  const admin = await requireAdmin()
  const condicao = and(eq(documento.id, id), eq(documento.condominioId, admin.condominioId))

  const [existente] = await db.select({ url: documento.url }).from(documento).where(condicao).limit(1)
  const versoes = await db
    .select({ url: documentoVersao.url })
    .from(documentoVersao)
    .where(eq(documentoVersao.documentoId, id))

  await db.update(documento).set({ deletedAt: new Date() }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'documento',
    entidadeId: id,
  })

  // As linhas de documentoVersao ficam (auditoria/histórico), só os
  // ficheiros são removidos do armazenamento — mesmo critério já usado para
  // o ficheiro atual do documento.
  await apagarFicheiro(existente?.url)
  await Promise.all(versoes.map((v) => apagarFicheiro(v.url)))

  revalidatePath('/documentos')
}

/**
 * Substitui o ficheiro/link de um documento, arquivando o estado anterior em
 * documentoVersao antes de o sobrescrever — resolve "substituir um
 * documento perde a versão anterior" (FUNCTIONAL_GAPS.md, "Versionamento").
 * Mesma validação de ficheiro/link de criarDocumento; o ficheiro anterior
 * não é apagado do armazenamento (fica acessível através da versão
 * arquivada) — só é removido quando o documento em si é eliminado.
 */
export async function substituirFicheiroDocumento(id: number, formData: FormData) {
  const admin = await requireAdmin()
  const condicao = and(eq(documento.id, id), eq(documento.condominioId, admin.condominioId))

  const [atual] = await db
    .select({ titulo: documento.titulo, url: documento.url, nomeFicheiro: documento.nomeFicheiro })
    .from(documento)
    .where(condicao)
    .limit(1)
  if (!atual) throw new Error('Documento não encontrado')

  const motivo = String(formData.get('motivo') || '').trim()
  let url = String(formData.get('url') || '').trim()
  let nomeFicheiro: string | null = null

  const ficheiro = formData.get('ficheiro')
  if (ficheiro instanceof File && ficheiro.size > 0) {
    const guardado = await guardarFicheiro(ficheiro, 'documentos')
    url = guardado.url
    nomeFicheiro = guardado.nomeFicheiro
  } else if (url && !/^https?:\/\//i.test(url)) {
    throw new Error('O link deve começar por http:// ou https://')
  }

  if (!url) {
    throw new Error('Selecione um ficheiro ou cole um link para o novo documento')
  }

  await db.insert(documentoVersao).values({
    documentoId: id,
    userId: admin.userId,
    autorNome: admin.nome,
    titulo: atual.titulo,
    url: atual.url,
    nomeFicheiro: atual.nomeFicheiro,
    motivo: motivo || null,
  })

  await db.update(documento).set({ url, nomeFicheiro }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'documento',
    entidadeId: id,
    detalhes: `${atual.titulo}: ficheiro substituído${motivo ? ` — motivo: ${motivo}` : ''}`,
    alteracoes: [
      {
        campo: 'nomeFicheiro',
        label: 'Ficheiro',
        antes: atual.nomeFicheiro ?? atual.url ?? null,
        depois: nomeFicheiro ?? url,
      },
    ],
  })

  revalidatePath('/documentos')
}

/**
 * Lista de versões anteriores de um documento, mais recente primeiro —
 * mesma regra de confidencialidade do documento atual (getDocumentos): quem
 * não vê o documento por ser confidencial, também não vê o seu histórico.
 */
export async function getVersoesDocumento(id: number) {
  const m = await requireMembroAprovado()
  const condicao = temConsultaGestao(m)
    ? and(eq(documento.id, id), eq(documento.condominioId, m.condominioId))
    : and(eq(documento.id, id), eq(documento.condominioId, m.condominioId), eq(documento.confidencial, false))
  const [d] = await db.select({ id: documento.id }).from(documento).where(condicao).limit(1)
  if (!d) throw new Error('Documento não encontrado')

  return db
    .select()
    .from(documentoVersao)
    .where(eq(documentoVersao.documentoId, id))
    .orderBy(desc(documentoVersao.createdAt))
}

type EntradaManifesto = {
  id: number
  titulo: string
  categoria: string
  nomeFicheiro: string | null
  criadoEm: Date
  confidencial: boolean
  arquivado: boolean
  hashSha256: string | null
  incluido: boolean
  nota: string | null
}

/**
 * Exportação integral do arquivo documental (FUNCTIONAL_GAPS.md, secção 6):
 * um .zip com o conteúdo real de cada documento carregado (não só os dados
 * estruturados, ao contrário de exportarCondominio() em
 * app/actions/condominio.ts) e um manifesto.json com um hash sha256 de
 * cada ficheiro, para o destinatário poder confirmar mais tarde que o
 * ficheiro que tem não foi alterado desde a exportação. Só admin — inclui
 * o conteúdo de documentos confidenciais, exige a barreira mais alta.
 * Documentos sem ficheiro real no Blob (link externo colado à mão, ou sem
 * url) entram no manifesto com uma nota, mas sem ficheiro no zip — não há
 * bytes fidedignos para incluir. deletedAt fica sempre de fora.
 */
export async function exportarArquivoDocumentos() {
  const admin = await requireAdmin()

  const documentos = await db
    .select()
    .from(documento)
    .where(and(eq(documento.condominioId, admin.condominioId), isNull(documento.deletedAt)))
    .orderBy(desc(documento.createdAt))

  const zip = new JSZip()
  const manifesto: EntradaManifesto[] = []

  for (const d of documentos) {
    const entrada: EntradaManifesto = {
      id: d.id,
      titulo: d.titulo,
      categoria: d.categoria,
      nomeFicheiro: d.nomeFicheiro,
      criadoEm: d.createdAt,
      confidencial: d.confidencial,
      arquivado: d.arquivado,
      hashSha256: null,
      incluido: false,
      nota: null,
    }

    if (d.url?.includes('.blob.vercel-storage.com')) {
      const blob = await get(d.url, {
        access: 'private',
        token: process.env.BLOB_PRIVADO_READ_WRITE_TOKEN,
      }).catch(() => null)

      if (blob) {
        const bytes = Buffer.from(await new Response(blob.stream).arrayBuffer())
        entrada.hashSha256 = createHash('sha256').update(bytes).digest('hex')
        entrada.incluido = true
        zip.file(`documentos/${d.id}-${d.nomeFicheiro ?? d.titulo}`, bytes)
      } else {
        entrada.nota = 'Falha ao obter o ficheiro do armazenamento'
      }
    } else if (d.url) {
      entrada.nota = `Link externo, não incluído no ficheiro: ${d.url}`
    } else {
      entrada.nota = 'Sem ficheiro associado'
    }

    manifesto.push(entrada)
  }

  zip.file('manifesto.json', JSON.stringify(manifesto, null, 2))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'condominio',
    entidadeId: admin.condominioId,
    detalhes: `Exportação integral do arquivo documental (${documentos.length} documento(s))`,
  })

  const base64 = await zip.generateAsync({ type: 'base64' })
  return {
    base64,
    total: documentos.length,
    totalIncluidos: manifesto.filter((m) => m.incluido).length,
  }
}
