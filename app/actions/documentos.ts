'use server'

import { db } from '@/lib/db'
import { documento } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { apagarFicheiro, guardarFicheiro } from '@/lib/storage'
import { requireAdmin, requireMembroAprovado } from '@/lib/session'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getDocumentos() {
  const m = await requireMembroAprovado()
  return db
    .select()
    .from(documento)
    .where(eq(documento.condominioId, m.condominioId))
    .orderBy(desc(documento.createdAt))
}

export async function criarDocumento(formData: FormData) {
  const admin = await requireAdmin()

  const titulo = String(formData.get('titulo') || '').trim()
  const categoria = String(formData.get('categoria') || 'ata')
  const descricao = String(formData.get('descricao') || '').trim()
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

export async function eliminarDocumento(id: number) {
  const admin = await requireAdmin()
  const condicao = and(eq(documento.id, id), eq(documento.condominioId, admin.condominioId))

  const [existente] = await db.select({ url: documento.url }).from(documento).where(condicao).limit(1)

  await db.delete(documento).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'documento',
    entidadeId: id,
  })

  await apagarFicheiro(existente?.url)

  revalidatePath('/documentos')
}
