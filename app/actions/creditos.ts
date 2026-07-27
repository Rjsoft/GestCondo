'use server'

import { db } from '@/lib/db'
import { fracao, fracaoCredito, movimento } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { garantirExercicioAberto } from '@/lib/contas-financeiras'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Saldo de crédito disponível de uma fração — soma das entradas do
 * livro-razão (nunca um valor guardado à parte, mesmo princípio de
 * getSaldoFundoReserva). Positivo = crédito por aplicar/devolver.
 */
async function calcularSaldoCredito(fracaoId: number): Promise<number> {
  const linhas = await db
    .select({ valor: fracaoCredito.valor })
    .from(fracaoCredito)
    .where(eq(fracaoCredito.fracaoId, fracaoId))
  return linhas.reduce((s, l) => s + Number(l.valor), 0)
}

/** Saldo de crédito de todas as frações do condomínio. */
export async function getSaldosCredito() {
  const m = await requireAcessoFinanceiro()
  const fracoes = await db
    .select({ id: fracao.id, identificacao: fracao.identificacao, proprietario: fracao.proprietario })
    .from(fracao)
    .where(eq(fracao.condominioId, m.condominioId))
    .orderBy(asc(fracao.identificacao))

  const saldos = await Promise.all(
    fracoes.map(async (f) => ({ ...f, saldo: await calcularSaldoCredito(f.id) })),
  )
  return saldos
}

/** Histórico do livro-razão de crédito de uma fração, mais recente primeiro. */
export async function getHistoricoCreditoFracao(fracaoId: number) {
  const m = await requireAcessoFinanceiro()
  const [f] = await db
    .select({ id: fracao.id })
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, m.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração não encontrada')

  return db
    .select()
    .from(fracaoCredito)
    .where(eq(fracaoCredito.fracaoId, fracaoId))
    .orderBy(desc(fracaoCredito.createdAt))
}

/** Quotas pendentes (receita, por pagar) de uma fração — para aplicar crédito. */
export async function getQuotasPendentesFracao(fracaoId: number) {
  const m = await requireAcessoFinanceiro()
  return db
    .select({
      id: movimento.id,
      categoria: movimento.categoria,
      descricao: movimento.descricao,
      valor: movimento.valor,
      data: movimento.data,
    })
    .from(movimento)
    .where(
      and(
        eq(movimento.fracaoId, fracaoId),
        eq(movimento.condominioId, m.condominioId),
        eq(movimento.tipo, 'receita'),
        eq(movimento.pago, false),
        isNull(movimento.deletedAt),
      ),
    )
    .orderBy(asc(movimento.data))
}

export async function registarAdiantamentoFracao(formData: FormData) {
  const admin = await requireAdmin()

  const fracaoId = Number(formData.get('fracaoId'))
  const valor = String(formData.get('valor') || '').trim()
  const dataStr = String(formData.get('data') || '').trim()
  const notas = String(formData.get('notas') || '').trim()

  if (!valor || Number(valor) <= 0) throw new Error('Indique um valor válido')
  if (!dataStr) throw new Error('Indique a data do adiantamento')

  const [f] = await db
    .select({ identificacao: fracao.identificacao })
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, admin.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração não encontrada')

  const [novo] = await db
    .insert(fracaoCredito)
    .values({
      fracaoId,
      tipo: 'adiantamento',
      valor,
      data: new Date(dataStr),
      notas: notas || null,
      userId: admin.userId,
      autorNome: admin.nome,
    })
    .returning({ id: fracaoCredito.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'fracaoCredito',
    entidadeId: novo.id,
    detalhes: `${f.identificacao}: adiantamento de ${valor} €${notas ? ` — ${notas}` : ''}`,
  })

  revalidatePath('/financas')
}

/**
 * Aplica crédito disponível a uma quota pendente específica — sempre o
 * valor exato da quota, nunca parcial (movimento não suporta pagamento
 * parcial, e essa semântica não é introduzida aqui). Marca a quota como
 * paga, tal como marcarComoPago() em app/actions/financas.ts.
 */
export async function aplicarCreditoQuota(fracaoId: number, movimentoId: number) {
  const admin = await requireAdmin()

  const [f] = await db
    .select({ identificacao: fracao.identificacao })
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, admin.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração não encontrada')

  const [quota] = await db
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.id, movimentoId),
        eq(movimento.fracaoId, fracaoId),
        eq(movimento.condominioId, admin.condominioId),
        eq(movimento.tipo, 'receita'),
        eq(movimento.pago, false),
        isNull(movimento.deletedAt),
      ),
    )
    .limit(1)
  if (!quota) throw new Error('Quota pendente não encontrada')

  const saldoDisponivel = await calcularSaldoCredito(fracaoId)
  const valorQuota = Number(quota.valor)
  if (saldoDisponivel < valorQuota) {
    throw new Error(
      `Crédito insuficiente: disponível ${saldoDisponivel.toFixed(2)} €, quota ${valorQuota.toFixed(2)} €`,
    )
  }

  await garantirExercicioAberto(admin.condominioId, quota.data)

  await db
    .update(movimento)
    .set({ pago: true, meioPagamento: 'Crédito adiantado', dataLiquidacao: new Date() })
    .where(eq(movimento.id, movimentoId))

  const [novo] = await db
    .insert(fracaoCredito)
    .values({
      fracaoId,
      tipo: 'aplicacao',
      valor: (-valorQuota).toFixed(2),
      movimentoId,
      userId: admin.userId,
      autorNome: admin.nome,
    })
    .returning({ id: fracaoCredito.id })

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'fracaoCredito',
    entidadeId: novo.id,
    detalhes: `${f.identificacao}: crédito aplicado à quota "${quota.categoria} — ${quota.descricao}" (${valorQuota.toFixed(2)} €)`,
  })

  revalidatePath('/financas')
}

export async function devolverCreditoFracao(formData: FormData) {
  const admin = await requireAdmin()

  const fracaoId = Number(formData.get('fracaoId'))
  const valor = String(formData.get('valor') || '').trim()
  const dataStr = String(formData.get('data') || '').trim()
  const notas = String(formData.get('notas') || '').trim()

  if (!valor || Number(valor) <= 0) throw new Error('Indique um valor válido')
  if (!dataStr) throw new Error('Indique a data da devolução')

  const [f] = await db
    .select({ identificacao: fracao.identificacao })
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, admin.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração não encontrada')

  const saldoDisponivel = await calcularSaldoCredito(fracaoId)
  if (Number(valor) > saldoDisponivel) {
    throw new Error(`Só há ${saldoDisponivel.toFixed(2)} € disponíveis para devolver`)
  }

  const [novo] = await db
    .insert(fracaoCredito)
    .values({
      fracaoId,
      tipo: 'devolucao',
      valor: (-Number(valor)).toFixed(2),
      data: new Date(dataStr),
      notas: notas || null,
      userId: admin.userId,
      autorNome: admin.nome,
    })
    .returning({ id: fracaoCredito.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'fracaoCredito',
    entidadeId: novo.id,
    detalhes: `${f.identificacao}: devolução de ${valor} €${notas ? ` — ${notas}` : ''}`,
  })

  revalidatePath('/financas')
}
