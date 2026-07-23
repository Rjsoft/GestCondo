'use server'

import { db } from '@/lib/db'
import { fracao, seguro, seguroFracao } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { apagarFicheiro, guardarFicheiro } from '@/lib/storage'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, desc, eq, inArray, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const TIPOS = ['multirriscos', 'incendio', 'outro']

export async function getSeguros() {
  const m = await requireAcessoFinanceiro()
  const lista = await db
    .select()
    .from(seguro)
    .where(and(eq(seguro.condominioId, m.condominioId), isNull(seguro.deletedAt)))
    .orderBy(desc(seguro.dataFim))

  if (lista.length === 0) return lista.map((s) => ({ ...s, fracoes: [] as { id: number; identificacao: string }[] }))

  // Frações cobertas por cada seguro (além do edifício) — junção
  // seguro_fracao, agrupada em memória (poucas linhas, um condomínio típico
  // tem dezenas de frações, não milhares).
  const cobertura = await db
    .select({
      seguroId: seguroFracao.seguroId,
      fracaoId: fracao.id,
      identificacao: fracao.identificacao,
    })
    .from(seguroFracao)
    .innerJoin(fracao, eq(fracao.id, seguroFracao.fracaoId))
    .where(
      inArray(
        seguroFracao.seguroId,
        lista.map((s) => s.id),
      ),
    )

  const fracoesPorSeguro = new Map<number, { id: number; identificacao: string }[]>()
  for (const c of cobertura) {
    const atual = fracoesPorSeguro.get(c.seguroId) ?? []
    atual.push({ id: c.fracaoId, identificacao: c.identificacao })
    fracoesPorSeguro.set(c.seguroId, atual)
  }

  return lista.map((s) => ({ ...s, fracoes: fracoesPorSeguro.get(s.id) ?? [] }))
}

export async function criarSeguro(formData: FormData) {
  const admin = await requireAdmin()

  const seguradora = String(formData.get('seguradora') || '').trim()
  const apolice = String(formData.get('apolice') || '').trim()
  const tipo = String(formData.get('tipo') || 'multirriscos')
  const dataInicioStr = String(formData.get('dataInicio') || '')
  const dataFimStr = String(formData.get('dataFim') || '')
  const valorPremioStr = String(formData.get('valorPremio') || '').trim()
  const capitalSeguroStr = String(formData.get('capitalSeguro') || '').trim()
  const notas = String(formData.get('notas') || '').trim()

  if (!seguradora || !apolice || !dataInicioStr || !dataFimStr) {
    throw new Error('Preencha a seguradora, a apólice e as datas de início e fim')
  }
  if (!TIPOS.includes(tipo)) throw new Error('Tipo de seguro inválido')

  const dataInicio = new Date(dataInicioStr)
  const dataFim = new Date(dataFimStr)
  if (Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataFim.getTime())) {
    throw new Error('Datas inválidas')
  }
  if (dataFim <= dataInicio) {
    throw new Error('A data de fim tem de ser posterior à data de início')
  }

  // Frações cobertas por esta apólice, além do edifício/partes comuns —
  // vazio se for só o seguro do prédio. Validadas contra o condomínio do
  // admin para não ligar a frações de outro condomínio (IDOR).
  const fracaoIds = formData
    .getAll('fracaoIds')
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0)

  let anexoUrl: string | null = null
  let anexoNomeFicheiro: string | null = null
  const anexo = formData.get('anexo')
  if (anexo instanceof File && anexo.size > 0) {
    const guardado = await guardarFicheiro(anexo, 'seguros')
    anexoUrl = guardado.url
    anexoNomeFicheiro = guardado.nomeFicheiro
  }

  const [novo] = await db
    .insert(seguro)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      seguradora,
      apolice,
      tipo,
      dataInicio,
      dataFim,
      valorPremio: valorPremioStr || null,
      capitalSeguro: capitalSeguroStr || null,
      notas: notas || null,
      anexoUrl,
      anexoNomeFicheiro,
    })
    .returning({ id: seguro.id })

  if (fracaoIds.length > 0) {
    const fracoesDoCondominio = await db
      .select({ id: fracao.id })
      .from(fracao)
      .where(and(eq(fracao.condominioId, admin.condominioId), inArray(fracao.id, fracaoIds)))
    if (fracoesDoCondominio.length > 0) {
      await db.insert(seguroFracao).values(
        fracoesDoCondominio.map((f) => ({ seguroId: novo.id, fracaoId: f.id })),
      )
    }
  }

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'seguro',
    entidadeId: novo.id,
    detalhes: `${seguradora} — apólice ${apolice}`,
  })

  revalidatePath('/financas')
}

export async function eliminarSeguro(id: number) {
  const admin = await requireAdmin()
  const condicao = and(eq(seguro.id, id), eq(seguro.condominioId, admin.condominioId))

  // Soft-delete (achado DOC-01 da auditoria jurídica 2026-07-22): o seguro
  // é prova de cumprimento de obrigação legal, nunca DELETE físico — mesmo
  // padrão de movimento.deletedAt. O anexo em Vercel Blob continua a ser
  // apagado (não tem valor probatório manter o ficheiro em si).
  const [existente] = await db.select({ anexoUrl: seguro.anexoUrl }).from(seguro).where(condicao).limit(1)

  await db.update(seguro).set({ deletedAt: new Date() }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'seguro',
    entidadeId: id,
  })

  await apagarFicheiro(existente?.anexoUrl)

  revalidatePath('/financas')
}
