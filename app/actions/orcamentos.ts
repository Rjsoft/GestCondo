'use server'

import { db } from '@/lib/db'
import { fracao, movimento, orcamento } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { calcularQuotasMensais } from '@/lib/rateio'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getOrcamentos() {
  const m = await requireAcessoFinanceiro()
  return db
    .select()
    .from(orcamento)
    .where(eq(orcamento.condominioId, m.condominioId))
    .orderBy(desc(orcamento.ano))
}

export async function criarOrcamento(formData: FormData) {
  const admin = await requireAdmin()

  const ano = Number(formData.get('ano'))
  const valorAnual = String(formData.get('valorAnual') || '0')
  const valorAnualElevadorRaw = String(formData.get('valorAnualElevador') || '').trim()
  const notas = String(formData.get('notas') || '').trim()

  if (!ano || !Number.isInteger(ano) || ano < 2000 || ano > 2200) {
    throw new Error('Indique um ano válido')
  }
  if (!valorAnual || Number.isNaN(Number(valorAnual)) || Number(valorAnual) <= 0) {
    throw new Error('Indique um valor anual válido')
  }
  if (valorAnualElevadorRaw && Number(valorAnualElevadorRaw) < 0) {
    throw new Error('O valor do elevador não pode ser negativo')
  }
  const valorAnualElevador = valorAnualElevadorRaw || null

  const [novo] = await db
    .insert(orcamento)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      ano,
      valorAnual,
      valorAnualElevador,
      notas: notas || null,
    })
    .returning({ id: orcamento.id })
    .onConflictDoUpdate({
      target: [orcamento.condominioId, orcamento.ano],
      set: { valorAnual, valorAnualElevador, notas: notas || null },
    })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'orcamento',
    entidadeId: novo.id,
    detalhes: `Ano ${ano}: ${valorAnual} €`,
  })

  revalidatePath('/financas')
}

/**
 * Gera as 12 quotas mensais de cada fração para o ano do orçamento, por
 * rateio de permilagem (ver lib/rateio.ts). Bloqueia se já existirem quotas
 * geradas a partir deste orçamento (verificado por `movimento.orcamentoId`,
 * não por inferência de texto) — para gerar de novo, o admin tem de
 * eliminar essas quotas manualmente primeiro.
 */
export async function gerarQuotasOrcamento(orcamentoId: number) {
  const admin = await requireAdmin()

  const [orc] = await db
    .select()
    .from(orcamento)
    .where(and(eq(orcamento.id, orcamentoId), eq(orcamento.condominioId, admin.condominioId)))
    .limit(1)
  if (!orc) throw new Error('Orçamento não encontrado')

  const [jaGerada] = await db
    .select({ id: movimento.id })
    .from(movimento)
    .where(eq(movimento.orcamentoId, orcamentoId))
    .limit(1)
  if (jaGerada) {
    throw new Error(
      'Já foram geradas quotas para este orçamento. Elimine-as manualmente antes de gerar de novo.',
    )
  }

  const fracoes = await db
    .select({ id: fracao.id, permilagem: fracao.permilagem, isentaElevador: fracao.isentaElevador })
    .from(fracao)
    .where(eq(fracao.condominioId, admin.condominioId))

  const quotasMensais = calcularQuotasMensais(
    fracoes.map((f) => ({
      id: f.id,
      permilagem: Number(f.permilagem),
      isentaElevador: f.isentaElevador,
    })),
    Number(orc.valorAnual),
    orc.valorAnualElevador ? Number(orc.valorAnualElevador) : 0,
  )
  const totalPermilagem = fracoes.reduce((s, f) => s + Number(f.permilagem), 0)

  const linhas = quotasMensais.flatMap(({ fracaoId, valorMensal }) =>
    Array.from({ length: 12 }, (_, mes) => ({
      condominioId: admin.condominioId,
      userId: admin.userId,
      tipo: 'receita' as const,
      categoria: 'Quota mensal',
      descricao: `Quota ${mes + 1}/${orc.ano}`,
      valor: valorMensal.toFixed(2),
      fracaoId,
      data: new Date(orc.ano, mes, 1),
      pago: false,
      destino: 'geral' as const,
      orcamentoId,
    })),
  )

  await db.insert(movimento).values(linhas)

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'orcamento',
    entidadeId: orcamentoId,
    detalhes: `Quotas mensais geradas para ${orc.ano}: ${fracoes.length} frações × 12 meses = ${linhas.length} quotas (permilagem total apurada: ${totalPermilagem.toFixed(2)}‰)`,
  })

  revalidatePath('/financas')

  return { quantidade: linhas.length }
}

export async function eliminarOrcamento(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(orcamento)
    .where(and(eq(orcamento.id, id), eq(orcamento.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'orcamento',
    entidadeId: id,
  })

  revalidatePath('/financas')
}
