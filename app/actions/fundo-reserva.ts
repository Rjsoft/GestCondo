'use server'

import { db } from '@/lib/db'
import { exercicioFinanceiro, fundoReservaReposicao, movimento } from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { validarAssembleiaPonto } from '@/app/actions/financas'
import { requireAcessoFinanceiro, requireAdmin } from '@/lib/session'
import { and, desc, eq, gte, inArray, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/**
 * Retiradas do fundo de reserva (despesas com destino "reserva"), com
 * indicação de qual delas já está ligada a uma deliberação de assembleia
 * que a autorizou — FUNCTIONAL_GAPS.md, secção 1.
 */
export async function getRetiradasFundoReserva() {
  const m = await requireAcessoFinanceiro()
  return db
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        eq(movimento.tipo, 'despesa'),
        eq(movimento.destino, 'reserva'),
        isNull(movimento.deletedAt),
      ),
    )
    .orderBy(desc(movimento.data))
}

/**
 * Saldo do fundo de reserva discriminado por exercício financeiro — só
 * agrupa os movimentos com destino "reserva" já usados em
 * getSaldoFundoReserva() (app/actions/financas.ts), sem tabela nova.
 * Movimentos sem exercício associado (lançados antes de a associação ter
 * sido feita, ou nunca associados) ficam agrupados à parte, mesmo critério
 * já usado em prepararFechoExercicio() (app/actions/exercicios.ts).
 */
export async function getSaldoFundoReservaPorExercicio() {
  const m = await requireAcessoFinanceiro()
  const [exercicios, movimentosReserva] = await Promise.all([
    db
      .select()
      .from(exercicioFinanceiro)
      .where(eq(exercicioFinanceiro.condominioId, m.condominioId))
      .orderBy(desc(exercicioFinanceiro.dataInicio)),
    db
      .select()
      .from(movimento)
      .where(
        and(
          eq(movimento.condominioId, m.condominioId),
          eq(movimento.destino, 'reserva'),
          isNull(movimento.deletedAt),
        ),
      ),
  ])

  const calcularSaldo = (movs: (typeof movimentosReserva)[number][]) => {
    const receitas = movs.filter((mv) => mv.tipo === 'receita').reduce((s, mv) => s + Number(mv.valor), 0)
    const despesas = movs.filter((mv) => mv.tipo === 'despesa').reduce((s, mv) => s + Number(mv.valor), 0)
    return { receitas, despesas, saldo: receitas - despesas }
  }

  const porExercicio: { exercicioId: number | null; designacao: string; receitas: number; despesas: number; saldo: number }[] =
    exercicios.map((ex) => ({
      exercicioId: ex.id,
      designacao: ex.designacao,
      ...calcularSaldo(movimentosReserva.filter((mv) => mv.exercicioId === ex.id)),
    }))

  const semExercicio = movimentosReserva.filter((mv) => !mv.exercicioId)
  if (semExercicio.length > 0) {
    porExercicio.push({
      exercicioId: null,
      designacao: 'Sem exercício associado',
      ...calcularSaldo(semExercicio),
    })
  }

  return porExercicio
}

async function getPlanoAtivo(condominioId: number) {
  const [plano] = await db
    .select()
    .from(fundoReservaReposicao)
    .where(and(eq(fundoReservaReposicao.condominioId, condominioId), eq(fundoReservaReposicao.estado, 'em_curso')))
    .limit(1)
  return plano ?? null
}

async function calcularValorReposto(condominioId: number, dataInicio: Date) {
  const receitas = await db
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, condominioId),
        eq(movimento.tipo, 'receita'),
        eq(movimento.destino, 'reserva'),
        isNull(movimento.deletedAt),
        gte(movimento.data, dataInicio),
      ),
    )
  return receitas.reduce((s, mv) => s + Number(mv.valor), 0)
}

/**
 * Plano de reposição em curso, com o valor já reposto calculado em tempo
 * real a partir das receitas reais do fundo de reserva lançadas desde o
 * início do plano — nunca guardado, para nunca poder divergir de
 * `movimento` (mesmo princípio do plano prestacional de cobrança).
 */
export async function getPlanoReposicaoAtual() {
  const m = await requireAcessoFinanceiro()
  const plano = await getPlanoAtivo(m.condominioId)
  if (!plano) return null

  const valorReposto = await calcularValorReposto(m.condominioId, plano.dataInicio)
  return { ...plano, valorReposto }
}

export async function getHistoricoPlanosReposicao() {
  const m = await requireAcessoFinanceiro()
  return db
    .select()
    .from(fundoReservaReposicao)
    .where(
      and(eq(fundoReservaReposicao.condominioId, m.condominioId), inArray(fundoReservaReposicao.estado, ['concluido', 'cancelado'])),
    )
    .orderBy(desc(fundoReservaReposicao.createdAt))
}

export async function criarPlanoReposicao(dados: {
  descricao: string
  valorAReposicao: number
  dataLimite?: Date
  assembleiaPontoId?: number
  notas?: string
}) {
  const admin = await requireAdmin()

  const descricao = dados.descricao.trim()
  if (!descricao) throw new Error('Indique a descrição do plano de reposição')
  if (!(dados.valorAReposicao > 0)) throw new Error('O valor a repor tem de ser positivo')

  const existente = await getPlanoAtivo(admin.condominioId)
  if (existente) {
    throw new Error(
      'Já existe um plano de reposição em curso para este condomínio — conclua ou cancele esse plano antes de criar outro.',
    )
  }

  if (dados.assembleiaPontoId) {
    await validarAssembleiaPonto(admin.condominioId, dados.assembleiaPontoId)
  }

  const [novo] = await db
    .insert(fundoReservaReposicao)
    .values({
      condominioId: admin.condominioId,
      descricao,
      valorAReposicao: dados.valorAReposicao.toFixed(2),
      dataInicio: new Date(),
      dataLimite: dados.dataLimite ?? null,
      assembleiaPontoId: dados.assembleiaPontoId ?? null,
      notas: dados.notas?.trim() || null,
      userId: admin.userId,
    })
    .returning()

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'fundoReservaReposicao',
    entidadeId: novo.id,
    detalhes: `Plano de reposição do fundo de reserva: ${descricao} (${dados.valorAReposicao.toFixed(2)} €)`,
  })

  revalidatePath('/financas')
  return novo
}

async function getPlanoOuFalha(id: number, condominioId: number) {
  const [plano] = await db
    .select()
    .from(fundoReservaReposicao)
    .where(and(eq(fundoReservaReposicao.id, id), eq(fundoReservaReposicao.condominioId, condominioId)))
    .limit(1)
  if (!plano) throw new Error('Plano de reposição não encontrado')
  if (plano.estado !== 'em_curso') throw new Error('Este plano já não está em curso')
  return plano
}

export async function concluirPlanoReposicao(id: number) {
  const admin = await requireAdmin()
  const plano = await getPlanoOuFalha(id, admin.condominioId)

  const valorReposto = await calcularValorReposto(admin.condominioId, plano.dataInicio)

  await db
    .update(fundoReservaReposicao)
    .set({ estado: 'concluido', valorRepostoFinal: valorReposto.toFixed(2) })
    .where(eq(fundoReservaReposicao.id, id))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'fundoReservaReposicao',
    entidadeId: id,
    detalhes: `Plano de reposição concluído: ${plano.descricao} (${valorReposto.toFixed(2)} € repostos de ${Number(plano.valorAReposicao).toFixed(2)} €)`,
  })

  revalidatePath('/financas')
}

export async function cancelarPlanoReposicao(id: number, motivo: string) {
  const admin = await requireAdmin()
  const motivoLimpo = motivo.trim()
  if (!motivoLimpo) throw new Error('Indique o motivo do cancelamento')

  const plano = await getPlanoOuFalha(id, admin.condominioId)
  const valorReposto = await calcularValorReposto(admin.condominioId, plano.dataInicio)

  await db
    .update(fundoReservaReposicao)
    .set({
      estado: 'cancelado',
      valorRepostoFinal: valorReposto.toFixed(2),
      notas: [plano.notas, `Cancelado: ${motivoLimpo}`].filter(Boolean).join(' | '),
    })
    .where(eq(fundoReservaReposicao.id, id))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'fundoReservaReposicao',
    entidadeId: id,
    detalhes: `Plano de reposição cancelado: ${plano.descricao} — ${motivoLimpo}`,
  })

  revalidatePath('/financas')
}
