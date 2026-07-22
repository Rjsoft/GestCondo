import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { db } from '@/lib/db'
import { documento, ocorrencia, seguro } from '@/lib/db/schema'
import { requireMembroAprovado } from '@/lib/session'
import { and, eq } from 'drizzle-orm'

/**
 * Serve ficheiros do Vercel Blob (documentos, fotos de ocorrências,
 * apólices de seguro — ver lib/storage.ts). Só serve um ficheiro se
 * pertencer a um dos três registos (documento/ocorrência/seguro) do
 * condomínio do membro autenticado — mesmo nível de controlo de acesso
 * (por página, não por ficheiro individual) que já existia antes desta
 * mudança, mas agora sem o URL do Blob poder ser acedido diretamente.
 *
 * Ficheiros carregados antes de 2026-07-22 continuam no store público
 * antigo (`gestcondo-ficheiros-publico`) — para esses, `get()` com o
 * token do store privado não encontra o blob, e a rota faz redirect
 * direto ao URL (que continua público, sem alteração retroativa).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return new NextResponse('Pedido inválido', { status: 400 })
  }

  let membro
  try {
    membro = await requireMembroAprovado()
  } catch {
    return new NextResponse('Não autenticado', { status: 401 })
  }

  const [[doc], [ocor], [seg]] = await Promise.all([
    db
      .select({ id: documento.id })
      .from(documento)
      .where(and(eq(documento.url, url), eq(documento.condominioId, membro.condominioId)))
      .limit(1),
    db
      .select({ id: ocorrencia.id })
      .from(ocorrencia)
      .where(and(eq(ocorrencia.fotoUrl, url), eq(ocorrencia.condominioId, membro.condominioId)))
      .limit(1),
    db
      .select({ id: seguro.id })
      .from(seguro)
      .where(and(eq(seguro.anexoUrl, url), eq(seguro.condominioId, membro.condominioId)))
      .limit(1),
  ])

  if (!doc && !ocor && !seg) {
    return new NextResponse('Ficheiro não encontrado', { status: 404 })
  }

  const blob = await get(url, {
    access: 'private',
    token: process.env.BLOB_PRIVADO_READ_WRITE_TOKEN,
  }).catch(() => null)

  if (blob && blob.statusCode === 200) {
    return new NextResponse(blob.stream, {
      headers: {
        'content-type': blob.blob.contentType,
        'content-disposition': blob.blob.contentDisposition,
      },
    })
  }

  // Ficheiro do store público antigo (carregado antes de 2026-07-22) —
  // continua acessível diretamente, sem alteração retroativa.
  return NextResponse.redirect(url)
}
