'use server'

import { db } from '@/lib/db'
import { membro, ocorrencia } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { apagarFicheiro, guardarFicheiro } from '@/lib/storage'
import {
  requireAdmin,
  requireMembroComEscrita,
  temConsultaGestao,
  temPermissaoGestao,
} from '@/lib/session'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getOcorrencias() {
  const m = await requireMembroComEscrita()
  // Admin/gestor/auditor veem todas as do seu condomínio; os restantes
  // (condómino, inquilino, fornecedor) veem só as suas.
  if (temConsultaGestao(m)) {
    return db
      .select()
      .from(ocorrencia)
      .where(eq(ocorrencia.condominioId, m.condominioId))
      .orderBy(desc(ocorrencia.createdAt))
  }
  return db
    .select()
    .from(ocorrencia)
    .where(
      and(
        eq(ocorrencia.condominioId, m.condominioId),
        eq(ocorrencia.userId, m.userId),
      ),
    )
    .orderBy(desc(ocorrencia.createdAt))
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

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'ocorrencia',
    entidadeId: id,
    detalhes: `Estado alterado para "${estado}"`,
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

  await db.delete(ocorrencia).where(condicao)

  await registarAuditoria({
    actor: m,
    acao: 'eliminar',
    entidade: 'ocorrencia',
    entidadeId: id,
  })

  await apagarFicheiro(existente?.fotoUrl)

  revalidatePath('/ocorrencias')
}
