'use server'

import { db } from '@/lib/db'
import { assembleia, assembleiaPonto, condominio, fornecedor, fracao, lembreteCobranca, membro, movimento, orcamento } from '@/lib/db/schema'
import { compararCampos, gerarResumoAlteracoes, registarAuditoria } from '@/lib/audit'
import { calcularJurosMora } from '@/lib/juros'
import { calcularQuotasMensais, calcularRateioValor } from '@/lib/rateio'
import { ESCALOES_ANTIGUIDADE, calcularAntiguidadeDivida } from '@/lib/antiguidade-divida'
import { NIVEIS_LEMBRETE, calcularEstadoLembretes } from '@/lib/lembrete-cobranca'
import { garantirExercicioAberto } from '@/lib/contas-financeiras'
import { sendEmail } from '@/lib/email'
import { requireAcessoFinanceiro, requireAdmin, requireOperacionalOuAdmin } from '@/lib/session'
import { and, asc, count, desc, eq, getTableColumns, gte, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 20

const MOVIMENTO_LABELS = {
  categoria: 'Categoria',
  descricao: 'Descrição',
  valor: 'Valor',
  data: 'Data',
  destino: 'Destino',
  fracaoId: 'Fração',
  fornecedorId: 'Fornecedor',
  assembleiaPontoId: 'Ponto de assembleia',
  pagadorNome: 'Nome do pagador',
  pagadorNif: 'NIF do pagador',
  requerAprovacao: 'Requer aprovação',
  urgente: 'Urgente',
  justificacaoUrgencia: 'Justificação da urgência',
}

const MOVIMENTO_PAGAMENTO_LABELS = {
  pago: 'Pago',
  meioPagamento: 'Meio de pagamento',
  referenciaMb: 'Referência Multibanco',
  dataLiquidacao: 'Data de liquidação',
}

export async function getMovimentos() {
  // Dados financeiros: admin, gestor, condómino ou auditor — não
  // inquilino nem fornecedor (ver lib/session.ts).
  const m = await requireAcessoFinanceiro()
  return db
    .select({ ...getTableColumns(movimento), fornecedorNome: fornecedor.nome })
    .from(movimento)
    .leftJoin(fornecedor, eq(movimento.fornecedorId, fornecedor.id))
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        isNull(movimento.deletedAt),
      ),
    )
    .orderBy(desc(movimento.data))
}

/**
 * Totais da conta corrente do condomínio (exclui fundo de reserva, seguido
 * à parte — ver getSaldoFundoReserva). Mesmo cálculo antes feito inline em
 * app/(app)/financas/page.tsx; extraído para ser reutilizado também pelo
 * dossier de apoio à assembleia.
 */
export async function getResumoFinanceiro() {
  const movimentos = await getMovimentos()
  const movimentosGeral = movimentos.filter((m) => m.destino !== 'reserva')
  const receitas = movimentosGeral
    .filter((m) => m.tipo === 'receita')
    .reduce((s, m) => s + Number(m.valor), 0)
  const despesas = movimentosGeral
    .filter((m) => m.tipo === 'despesa')
    .reduce((s, m) => s + Number(m.valor), 0)
  return { receitas, despesas, saldo: receitas - despesas }
}

export async function getMovimentosPaginado({
  page = 1,
  search = '',
}: { page?: number; search?: string } = {}) {
  const m = await requireAcessoFinanceiro()
  const condicao = search
    ? and(
        eq(movimento.condominioId, m.condominioId),
        isNull(movimento.deletedAt),
        or(
          sql`unaccent(${movimento.categoria}) ilike unaccent(${`%${search}%`})`,
          sql`unaccent(${movimento.descricao}) ilike unaccent(${`%${search}%`})`,
        ),
      )
    : and(eq(movimento.condominioId, m.condominioId), isNull(movimento.deletedAt))

  const [movimentos, [{ total }]] = await Promise.all([
    db
      .select({ ...getTableColumns(movimento), fornecedorNome: fornecedor.nome })
      .from(movimento)
      .leftJoin(fornecedor, eq(movimento.fornecedorId, fornecedor.id))
      .where(condicao)
      .orderBy(desc(movimento.data))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(movimento).where(condicao),
  ])

  return { movimentos, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

/**
 * Saldo do fundo de reserva (movimentos com destino "reserva"). O fundo de
 * reserva é obrigatório por lei (art.º 4.º do DL n.º 268/94) e segue-se à
 * parte das contas correntes do condomínio — nunca somado às quotas normais.
 */
export async function getSaldoFundoReserva() {
  const m = await requireAcessoFinanceiro()
  const movimentosReserva = await db
    .select()
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        eq(movimento.destino, 'reserva'),
        isNull(movimento.deletedAt),
      ),
    )

  const receitas = movimentosReserva
    .filter((mv) => mv.tipo === 'receita')
    .reduce((s, mv) => s + Number(mv.valor), 0)
  const despesas = movimentosReserva
    .filter((mv) => mv.tipo === 'despesa')
    .reduce((s, mv) => s + Number(mv.valor), 0)

  return { receitas, despesas, saldo: receitas - despesas }
}

/**
 * Um único movimento (para o recibo). Devolve `null` em vez de lançar se
 * não existir ou não pertencer ao condomínio do membro atual — a página do
 * recibo trata isso como "não encontrado", não como erro.
 */
export async function getMovimentoPorId(id: number) {
  const m = await requireAcessoFinanceiro()
  const [mov] = await db
    .select()
    .from(movimento)
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, m.condominioId)))
    .limit(1)
  return mov ?? null
}

/**
 * Mapa de saldos: para cada fração, quanto foi lançado em quotas (receitas
 * ligadas a essa fração), quanto já foi pago, e quanto está em dívida.
 * Responde diretamente a "quanto deve o 2ºEsq?" — a peça financeira mais
 * pedida na auditoria (FUNCTIONAL_GAPS.md secção 3).
 */
export async function getMapaSaldos() {
  const m = await requireAcessoFinanceiro()

  const [fracoes, quotas] = await Promise.all([
    db
      .select()
      .from(fracao)
      .where(eq(fracao.condominioId, m.condominioId))
      .orderBy(asc(fracao.identificacao)),
    db
      .select()
      .from(movimento)
      .where(
        and(
          eq(movimento.condominioId, m.condominioId),
          eq(movimento.tipo, 'receita'),
          isNull(movimento.deletedAt),
        ),
      ),
  ])

  return fracoes.map((f) => {
    const quotasDaFracao = quotas.filter((q) => q.fracaoId === f.id)
    const totalLancado = quotasDaFracao.reduce((s, q) => s + Number(q.valor), 0)
    const totalPago = quotasDaFracao
      .filter((q) => q.pago)
      .reduce((s, q) => s + Number(q.valor), 0)
    return {
      fracaoId: f.id,
      identificacao: f.identificacao,
      proprietario: f.proprietario,
      totalLancado,
      totalPago,
      emDivida: totalLancado - totalPago,
    }
  })
}

/**
 * Mapa mensal de quotas: para cada fração, o que foi lançado em cada um dos
 * 12 meses do `ano` pedido (quotas, juros de mora, etc. — qualquer receita
 * ligada a essa fração cuja data caia nesse mês), com o estado de
 * pagamento agregado da célula. Layout inspirado no mapa "Quotas" usado
 * por administrações de condomínio externas (fração × mês, com total),
 * ver `Exemplo MBD.pdf` — mas aqui o valor é o realmente lançado em
 * `movimento`, não uma simulação de orçamento.
 */
export async function getMapaMensalQuotas(ano: number) {
  const m = await requireAcessoFinanceiro()

  const inicio = new Date(Date.UTC(ano, 0, 1))
  const fim = new Date(Date.UTC(ano + 1, 0, 1))

  const [fracoes, quotas] = await Promise.all([
    db
      .select()
      .from(fracao)
      .where(eq(fracao.condominioId, m.condominioId))
      .orderBy(asc(fracao.identificacao)),
    db
      .select({ ...getTableColumns(movimento), fornecedorNome: fornecedor.nome })
      .from(movimento)
      .leftJoin(fornecedor, eq(movimento.fornecedorId, fornecedor.id))
      .where(
        and(
          eq(movimento.condominioId, m.condominioId),
          eq(movimento.tipo, 'receita'),
          isNull(movimento.deletedAt),
          gte(movimento.data, inicio),
          lt(movimento.data, fim),
        ),
      ),
  ])

  return fracoes.map((f) => {
    const quotasDaFracao = quotas.filter((q) => q.fracaoId === f.id)
    const meses = Array.from({ length: 12 }, (_, mes) => {
      const movimentosDoMes = quotasDaFracao.filter((q) => q.data.getUTCMonth() === mes)
      const valor = movimentosDoMes.reduce((s, q) => s + Number(q.valor), 0)
      const todosPagos = movimentosDoMes.length > 0 && movimentosDoMes.every((q) => q.pago)
      const algunsPagos = movimentosDoMes.some((q) => q.pago)
      const estado: 'vazio' | 'pago' | 'parcial' | 'pendente' =
        movimentosDoMes.length === 0
          ? 'vazio'
          : todosPagos
            ? 'pago'
            : algunsPagos
              ? 'parcial'
              : 'pendente'
      return { mes, valor, estado, movimentos: movimentosDoMes }
    })
    const totalAno = meses.reduce((s, c) => s + c.valor, 0)
    const totalPagoAno = quotasDaFracao.filter((q) => q.pago).reduce((s, q) => s + Number(q.valor), 0)
    return {
      fracaoId: f.id,
      letra: f.letra,
      identificacao: f.identificacao,
      proprietario: f.proprietario,
      meses,
      totalAno,
      totalPagoAno,
    }
  })
}

/**
 * Declaração de encargos e dívidas de uma fração (Código Civil art. 1424º-A,
 * aditado pela Lei n.º 8/2022) — documento instrutório obrigatório da venda
 * de uma fração, a emitir pelo administrador a pedido do condómino no prazo
 * máximo de 10 dias. Devolve o encargo corrente (quota mensal atual,
 * calculada a partir do orçamento mais recente) e a lista de dívidas
 * existentes (natureza, valor, data de constituição/vencimento — usa-se a
 * própria data do lançamento como vencimento, mesma convenção de
 * getQuotasEmAtraso/lancarJurosMora).
 */
export async function getDeclaracaoDivida(fracaoId: number) {
  const m = await requireAcessoFinanceiro()

  const [f] = await db
    .select()
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, m.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração não encontrada')

  const [fracoes, [orcamentoRecente], dividas, [cond]] = await Promise.all([
    db
      .select({ id: fracao.id, permilagem: fracao.permilagem, isentaElevador: fracao.isentaElevador })
      .from(fracao)
      .where(eq(fracao.condominioId, m.condominioId)),
    db
      .select()
      .from(orcamento)
      .where(eq(orcamento.condominioId, m.condominioId))
      .orderBy(desc(orcamento.ano))
      .limit(1),
    db
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
          eq(movimento.condominioId, m.condominioId),
          eq(movimento.fracaoId, fracaoId),
          eq(movimento.tipo, 'receita'),
          eq(movimento.pago, false),
          isNull(movimento.deletedAt),
        ),
      )
      .orderBy(asc(movimento.data)),
    db
      .select({ criterioRateio: condominio.criterioRateio })
      .from(condominio)
      .where(eq(condominio.id, m.condominioId))
      .limit(1),
  ])

  let quotaMensalAtual: number | null = null
  if (orcamentoRecente) {
    const quotas = calcularQuotasMensais(
      fracoes.map((fr) => ({
        id: fr.id,
        permilagem: Number(fr.permilagem),
        isentaElevador: fr.isentaElevador,
      })),
      Number(orcamentoRecente.valorAnual),
      orcamentoRecente.valorAnualElevador ? Number(orcamentoRecente.valorAnualElevador) : 0,
      cond?.criterioRateio === 'partes_iguais' ? 'partes_iguais' : 'permilagem',
    )
    quotaMensalAtual = quotas.find((q) => q.fracaoId === fracaoId)?.valorMensal ?? null
  }

  const totalDivida = dividas.reduce((s, d) => s + Number(d.valor), 0)

  return {
    fracao: { id: f.id, identificacao: f.identificacao, proprietario: f.proprietario, nif: f.nif },
    anoOrcamento: orcamentoRecente?.ano ?? null,
    quotaMensalAtual,
    dividas,
    totalDivida,
  }
}

/**
 * Quotas (receitas ligadas a uma fração) por pagar cuja data já passou —
 * "em atraso" usa a própria data da quota como data de vencimento, sem
 * campo de vencimento próprio nem período de tolerância. Base de
 * app/actions/financas.ts:lancarJurosMora e do diálogo de pré-visualização.
 */
export async function getQuotasEmAtraso() {
  const m = await requireAcessoFinanceiro()
  return db
    .select({
      id: movimento.id,
      fracaoId: movimento.fracaoId,
      valor: movimento.valor,
      data: movimento.data,
    })
    .from(movimento)
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        eq(movimento.tipo, 'receita'),
        eq(movimento.pago, false),
        isNotNull(movimento.fracaoId),
        lt(movimento.data, new Date()),
        isNull(movimento.deletedAt),
      ),
    )
}

/**
 * Antiguidade da dívida por escalão (30/60/90/180/+365 dias), por fração —
 * agrupa as mesmas quotas em atraso de `getQuotasEmAtraso()` (quotas ainda
 * não vencidas não entram aqui, só o que já está realmente em atraso).
 * Inclui todas as frações do condomínio, mesmo sem dívida (escalões a
 * zero), para o relatório mostrar sempre a lista completa.
 */
export async function getAntiguidadeDivida() {
  const m = await requireAcessoFinanceiro()

  const [fracoes, quotasEmAtraso] = await Promise.all([
    db
      .select({ id: fracao.id, identificacao: fracao.identificacao, proprietario: fracao.proprietario })
      .from(fracao)
      .where(eq(fracao.condominioId, m.condominioId))
      .orderBy(asc(fracao.identificacao)),
    getQuotasEmAtraso(),
  ])

  const antiguidade = calcularAntiguidadeDivida(
    quotasEmAtraso
      .filter((q): q is typeof q & { fracaoId: number } => q.fracaoId != null)
      .map((q) => ({ fracaoId: q.fracaoId, valor: Number(q.valor), data: q.data })),
  )
  const porFracaoId = new Map(antiguidade.map((a) => [a.fracaoId, a]))
  const escaloesVazios = Object.fromEntries(ESCALOES_ANTIGUIDADE.map((e) => [e.chave, 0])) as Record<
    (typeof ESCALOES_ANTIGUIDADE)[number]['chave'],
    number
  >

  return fracoes.map((f) => {
    const a = porFracaoId.get(f.id)
    return {
      fracaoId: f.id,
      identificacao: f.identificacao,
      proprietario: f.proprietario,
      escaloes: a?.escaloes ?? escaloesVazios,
      total: a?.total ?? 0,
    }
  })
}

const LEMBRETE_ASSUNTO: Record<string, string> = {
  '31-60': 'Lembrete de quota em atraso',
  '61-90': '2º lembrete de quota em atraso',
}

function corpoLembreteCobranca(escalao: string, identificacao: string): string {
  if (escalao === '61-90') {
    return `<p>Exmo.(a) Sr.(a),</p>
<p>A fração <strong>${identificacao}</strong> continua com uma quota em atraso há mais de 60 dias, apesar do aviso anterior.</p>
<p>Solicitamos a regularização desta situação o mais brevemente possível. Caso a dívida se mantenha, a administração poderá avançar para uma interpelação formal para pagamento.</p>
<p>Se já procedeu ao pagamento, agradecemos que ignore esta mensagem.</p>
<p>A Administração do Condomínio</p>`
  }
  return `<p>Exmo.(a) Sr.(a),</p>
<p>Notamos que a fração <strong>${identificacao}</strong> tem uma quota em atraso há mais de 30 dias.</p>
<p>Se já procedeu ao pagamento, agradecemos que ignore esta mensagem. Caso contrário, agradecemos a regularização brevemente.</p>
<p>Qualquer dúvida, contacte a administração.</p>
<p>A Administração do Condomínio</p>`
}

/**
 * Lembretes de cobrança informais por fração — para cada fração com
 * dívida, indica a disponibilidade e o histórico de envio de cada nível
 * (lib/lembrete-cobranca.ts), a partir dos mesmos escalões de
 * getAntiguidadeDivida().
 */
export async function getLembretesCobranca() {
  const m = await requireAcessoFinanceiro()
  const linhas = await getAntiguidadeDivida()
  const fracaoIds = linhas.map((l) => l.fracaoId)

  const historico = fracaoIds.length
    ? await db
        .select({ fracaoId: lembreteCobranca.fracaoId, escalao: lembreteCobranca.escalao, dataEnvio: lembreteCobranca.dataEnvio })
        .from(lembreteCobranca)
        .where(and(eq(lembreteCobranca.condominioId, m.condominioId), inArray(lembreteCobranca.fracaoId, fracaoIds)))
    : []

  return linhas
    .filter((l) => l.total > 0)
    .map((l) => ({
      ...l,
      niveis: calcularEstadoLembretes(
        l.escaloes,
        historico.filter((h) => h.fracaoId === l.fracaoId),
      ),
    }))
}

/**
 * Envia um lembrete de cobrança informal (sem valor legal, distinto da
 * interpelação formal) por email à fração indicada, e regista o envio.
 * Destinatários: contas de membro (condómino/inquilino aprovados) ligadas
 * à fração; na ausência de qualquer conta, usa o email de contacto da
 * fração, se existir.
 */
export async function enviarLembreteCobranca(fracaoId: number, escalao: string) {
  const admin = await requireAdmin()
  const nivel = NIVEIS_LEMBRETE.find((n) => n.chave === escalao)
  if (!nivel) throw new Error('Escalão de lembrete inválido')

  const [f] = await db
    .select({ id: fracao.id, identificacao: fracao.identificacao, contactoEmail: fracao.contactoEmail })
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, admin.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração inválida')

  const contas = await db
    .select({ email: membro.email })
    .from(membro)
    .where(and(eq(membro.fracaoId, fracaoId), eq(membro.estado, 'aprovado')))
  const emails = contas.map((c) => c.email)
  if (emails.length === 0 && f.contactoEmail) emails.push(f.contactoEmail)
  if (emails.length === 0) {
    throw new Error('Esta fração não tem nenhuma conta aprovada nem email de contacto registado')
  }

  await Promise.all(
    emails.map((email) =>
      sendEmail({
        to: email,
        subject: `${LEMBRETE_ASSUNTO[escalao]} — fração ${f.identificacao}`,
        html: corpoLembreteCobranca(escalao, f.identificacao),
      }),
    ),
  )

  await db.insert(lembreteCobranca).values({
    condominioId: admin.condominioId,
    fracaoId,
    escalao,
    userId: admin.userId,
  })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'fracao',
    entidadeId: fracaoId,
    detalhes: `${nivel.label} de cobrança enviado à fração ${f.identificacao} (${emails.length} destinatário(s))`,
  })

  revalidatePath('/financas/lembretes-cobranca')
}

/**
 * Lança juros de mora sobre todas as quotas em atraso, agrupados por
 * fração (um movimento novo por fração, não um por quota). A taxa é
 * indicada pelo administrador no momento — a app não a sugere nem a
 * guarda, por depender do regulamento do condomínio ou da taxa legal em
 * vigor, que esta ferramenta não assume conhecer com autoridade.
 */
export async function lancarJurosMora(taxaAnualPercent: number) {
  const admin = await requireAdmin()

  if (!Number.isFinite(taxaAnualPercent) || taxaAnualPercent <= 0) {
    throw new Error('Indique uma taxa de juro anual válida')
  }

  const quotasEmAtraso = await getQuotasEmAtraso()
  if (quotasEmAtraso.length === 0) {
    throw new Error('Não há quotas em atraso')
  }

  const jurosPorFracao = calcularJurosMora(
    quotasEmAtraso.map((q) => ({
      fracaoId: q.fracaoId!,
      valor: Number(q.valor),
      data: q.data,
    })),
    taxaAnualPercent,
  )

  const aLancar = jurosPorFracao.filter((f) => f.valorJuros > 0)
  if (aLancar.length === 0) {
    throw new Error('Os juros calculados são todos zero — nada a lançar')
  }

  // Os juros são sempre lançados com data de hoje (ver defaultNow() em
  // movimento.data, abaixo) — basta uma verificação, não uma por fração.
  await garantirExercicioAberto(admin.condominioId, new Date())

  for (const f of aLancar) {
    const [novo] = await db
      .insert(movimento)
      .values({
        condominioId: admin.condominioId,
        userId: admin.userId,
        tipo: 'receita',
        categoria: 'Juros de mora',
        descricao: `Juros de mora — taxa ${taxaAnualPercent}% ao ano, ${f.quotas.length} quota(s) em atraso`,
        valor: f.valorJuros.toFixed(2),
        fracaoId: f.fracaoId,
        pago: false,
        destino: 'geral',
      })
      .returning({ id: movimento.id })

    await registarAuditoria({
      actor: admin,
      acao: 'criar',
      entidade: 'movimento',
      entidadeId: novo.id,
      detalhes: `Juros de mora lançados: ${f.valorJuros.toFixed(2)} € (taxa ${taxaAnualPercent}%/ano, ${f.quotas.length} quota(s))`,
    })
  }

  revalidatePath('/financas')

  return {
    quantidade: aLancar.length,
    total: aLancar.reduce((s, f) => s + f.valorJuros, 0),
  }
}

/**
 * Divide uma despesa comum extraordinária (ex: pintura da fachada) pelas
 * frações, pelo critério de rateio do condomínio (lib/rateio.ts:
 * calcularRateioValor — permilagem por omissão, ou partes iguais se
 * `condominio.criterioRateio` assim o definir), gerando um movimento de
 * receita (dívida) por fração — mesmo padrão de lancarJurosMora, mas o
 * valor a dividir é indicado pelo admin em vez de calculado a partir de
 * quotas em atraso. Não lança a despesa em si (pagamento ao fornecedor);
 * isso continua a fazer-se à parte, como hoje.
 */
export async function ratearDespesaComum(formData: FormData) {
  const admin = await requireAdmin()

  const categoria = String(formData.get('categoria') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const valorTotal = Number(formData.get('valorTotal') || '0')
  const dataStr = String(formData.get('data') || '').trim()
  const isentarElevador = formData.get('isentarElevador') === 'true'
  const assembleiaPontoIdRaw = String(formData.get('assembleiaPontoId') || '').trim()
  const assembleiaPontoId = assembleiaPontoIdRaw ? Number(assembleiaPontoIdRaw) : null

  if (!categoria || !descricao) throw new Error('Preencha a categoria e a descrição')
  if (!valorTotal || valorTotal <= 0) throw new Error('Indique um valor total válido')
  if (assembleiaPontoId) {
    await validarAssembleiaPonto(admin.condominioId, assembleiaPontoId)
  }

  const [fracoes, [cond]] = await Promise.all([
    db
      .select({ id: fracao.id, permilagem: fracao.permilagem, isentaElevador: fracao.isentaElevador })
      .from(fracao)
      .where(eq(fracao.condominioId, admin.condominioId)),
    db
      .select({ criterioRateio: condominio.criterioRateio })
      .from(condominio)
      .where(eq(condominio.id, admin.condominioId))
      .limit(1),
  ])

  const rateio = calcularRateioValor(
    fracoes.map((f) => ({ id: f.id, permilagem: Number(f.permilagem), isentaElevador: f.isentaElevador })),
    valorTotal,
    isentarElevador,
    cond?.criterioRateio === 'partes_iguais' ? 'partes_iguais' : 'permilagem',
  )

  const dataMovimento = dataStr ? new Date(dataStr) : new Date()
  await garantirExercicioAberto(admin.condominioId, dataMovimento)

  for (const f of rateio) {
    const [novo] = await db
      .insert(movimento)
      .values({
        condominioId: admin.condominioId,
        userId: admin.userId,
        tipo: 'receita',
        categoria,
        descricao,
        valor: f.valor.toFixed(2),
        fracaoId: f.fracaoId,
        pago: false,
        destino: 'geral',
        assembleiaPontoId,
        data: dataMovimento,
      })
      .returning({ id: movimento.id })

    await registarAuditoria({
      actor: admin,
      acao: 'criar',
      entidade: 'movimento',
      entidadeId: novo.id,
      detalhes: `${categoria}: ${descricao} — rateio de ${valorTotal.toFixed(2)} € (${f.valor.toFixed(2)} €)${assembleiaPontoId ? ' [quota extraordinária]' : ''}`,
    })
  }

  revalidatePath('/financas')
  revalidatePath('/')

  return { quantidade: rateio.length, total: rateio.reduce((s, f) => s + f.valor, 0) }
}

// Pontos de assembleia elegíveis para originar uma quota extraordinária
// (G05): só de assembleias com ata já aprovada, e só pontos já aprovados —
// para popular o seletor no diálogo de novo/editar movimento.
export async function getPontosAprovadosParaQuota() {
  const m = await requireAcessoFinanceiro()
  return db
    .select({
      id: assembleiaPonto.id,
      titulo: assembleiaPonto.titulo,
      assembleiaData: assembleia.dataPrimeiraConvocatoria,
    })
    .from(assembleiaPonto)
    .innerJoin(assembleia, eq(assembleiaPonto.assembleiaId, assembleia.id))
    .where(
      and(
        eq(assembleia.condominioId, m.condominioId),
        eq(assembleia.estado, 'aprovada'),
        eq(assembleiaPonto.resultado, 'aprovado'),
      ),
    )
    .orderBy(desc(assembleia.dataPrimeiraConvocatoria))
}

/**
 * Despesas ainda pendentes de aprovação formal (marcadas `requerAprovacao`
 * mas sem ponto de assembleia ligado) ou urgentes (art. 1427º CC, com
 * justificação) — usada tanto no dossier de apoio à assembleia como para
 * um aviso na lista de despesas. Nunca bloqueia nada, só torna visível.
 */
export async function getDespesasParaRatificar() {
  const m = await requireAcessoFinanceiro()
  return db
    .select({ ...getTableColumns(movimento), fornecedorNome: fornecedor.nome })
    .from(movimento)
    .leftJoin(fornecedor, eq(movimento.fornecedorId, fornecedor.id))
    .where(
      and(
        eq(movimento.condominioId, m.condominioId),
        eq(movimento.tipo, 'despesa'),
        isNull(movimento.deletedAt),
        or(
          and(eq(movimento.requerAprovacao, true), isNull(movimento.assembleiaPontoId)),
          eq(movimento.urgente, true),
        ),
      ),
    )
    .orderBy(desc(movimento.data))
}

// Confirma que um ponto de assembleia pode originar uma quota extraordinária
// (G05): tem de pertencer a uma assembleia do próprio condomínio, com ata já
// aprovada (imutável), e o ponto em si tem de ter sido aprovado — nunca
// ligar uma quota a uma deliberação ainda pendente ou reprovada. Isolamento
// multi-tenant garantido aqui, não ao nível da BD (assembleiaPonto não tem
// condominioId próprio nem FK composta — ver comentário em lib/db/schema.ts).
async function validarAssembleiaPonto(condominioId: number, assembleiaPontoId: number) {
  const [ponto] = await db
    .select({ id: assembleiaPonto.id })
    .from(assembleiaPonto)
    .innerJoin(assembleia, eq(assembleiaPonto.assembleiaId, assembleia.id))
    .where(
      and(
        eq(assembleiaPonto.id, assembleiaPontoId),
        eq(assembleia.condominioId, condominioId),
        eq(assembleia.estado, 'aprovada'),
        eq(assembleiaPonto.resultado, 'aprovado'),
      ),
    )
    .limit(1)
  if (!ponto) {
    throw new Error(
      'Deliberação de assembleia inválida — tem de ser um ponto aprovado de uma assembleia com ata já aprovada, do seu condomínio',
    )
  }
}

export async function criarMovimento(formData: FormData) {
  // F03: um colaborador operacional pode lançar despesas/receitas.
  const admin = await requireOperacionalOuAdmin()

  const tipo = String(formData.get('tipo') || 'despesa')
  const categoria = String(formData.get('categoria') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const valor = String(formData.get('valor') || '0')
  const dataStr = String(formData.get('data') || '')
  const pago = formData.get('pago') === 'on' || formData.get('pago') === 'true'
  const fracaoIdRaw = String(formData.get('fracaoId') || '').trim()
  const fracaoId = fracaoIdRaw ? Number(fracaoIdRaw) : null
  const fornecedorIdRaw = String(formData.get('fornecedorId') || '').trim()
  const fornecedorId = fornecedorIdRaw ? Number(fornecedorIdRaw) : null
  const assembleiaPontoIdRaw = String(formData.get('assembleiaPontoId') || '').trim()
  const assembleiaPontoId = assembleiaPontoIdRaw ? Number(assembleiaPontoIdRaw) : null
  const destino = String(formData.get('destino') || 'geral')
  const meioPagamentoRaw = String(formData.get('meioPagamento') || '').trim()
  const referenciaMbRaw = String(formData.get('referenciaMb') || '').trim()
  const dataLiquidacaoRaw = String(formData.get('dataLiquidacao') || '').trim()
  const pagadorNome = String(formData.get('pagadorNome') || '').trim()
  const pagadorNif = String(formData.get('pagadorNif') || '').trim()
  const requerAprovacao = tipo === 'despesa' && formData.get('requerAprovacao') === 'on'
  const urgente = tipo === 'despesa' && formData.get('urgente') === 'on'
  const justificacaoUrgencia = String(formData.get('justificacaoUrgencia') || '').trim()

  if (!categoria || !descricao || !valor) {
    throw new Error('Preencha todos os campos obrigatórios')
  }
  // Uma quota (receita) tem de estar ligada a uma fração para se poder
  // calcular a dívida por fração (ver getMapaSaldos); despesas são gerais
  // do condomínio e não precisam de fração.
  if (tipo === 'receita' && !fracaoId) {
    throw new Error('Selecione a fração a que esta quota diz respeito')
  }
  if (destino !== 'geral' && destino !== 'reserva') {
    throw new Error('Destino inválido')
  }
  if (urgente && !justificacaoUrgencia) {
    throw new Error('Indique a justificação da obra urgente')
  }
  // Quota extraordinária (receita) ou despesa aprovada em assembleia —
  // mesmo ponto, mesma validação para os dois tipos.
  if (assembleiaPontoId) {
    await validarAssembleiaPonto(admin.condominioId, assembleiaPontoId)
  }
  const dataMovimento = dataStr ? new Date(dataStr) : new Date()
  await garantirExercicioAberto(admin.condominioId, dataMovimento)

  const [novo] = await db
    .insert(movimento)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      tipo,
      categoria,
      descricao,
      valor,
      pago,
      fracaoId: tipo === 'receita' ? fracaoId : null,
      fornecedorId: tipo === 'despesa' ? fornecedorId : null,
      assembleiaPontoId,
      // Só faz sentido numa receita — é o pagador da quota, não da despesa.
      pagadorNome: tipo === 'receita' && pagadorNome ? pagadorNome : null,
      pagadorNif: tipo === 'receita' && pagadorNif ? pagadorNif : null,
      requerAprovacao,
      urgente,
      justificacaoUrgencia: urgente ? justificacaoUrgencia : null,
      destino,
      // Detalhe do pagamento só faz sentido quando o movimento já nasce pago.
      meioPagamento: pago && meioPagamentoRaw ? meioPagamentoRaw : null,
      referenciaMb: pago && referenciaMbRaw ? referenciaMbRaw : null,
      dataLiquidacao: pago && dataLiquidacaoRaw ? new Date(dataLiquidacaoRaw) : null,
      data: dataMovimento,
    })
    .returning({ id: movimento.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'movimento',
    entidadeId: novo.id,
    detalhes: `${tipo}: ${categoria} — ${descricao} (${valor} €)${destino === 'reserva' ? ' [fundo de reserva]' : ''}${tipo === 'receita' && assembleiaPontoId ? ' [quota extraordinária]' : ''}${tipo === 'despesa' && assembleiaPontoId ? ' [aprovada em assembleia]' : ''}${urgente ? ' [urgente]' : ''}`,
  })

  revalidatePath('/financas')
  revalidatePath('/')
}

/**
 * Corrige os dados de um movimento já lançado (valor, categoria, descrição,
 * data, destino, fração/fornecedor). O tipo (receita/despesa) não é
 * editável aqui — mudar de tipo tem implicações demasiado grandes (fração
 * vs. fornecedor, cálculo de dívida) para ser um simples campo de edição;
 * quem se enganar no tipo deve eliminar e lançar de novo. O estado
 * pago/pendente e o detalhe do pagamento continuam a ser geridos por
 * `alternarPago`/`marcarComoPago`, não por aqui.
 */
export async function atualizarMovimento(formData: FormData) {
  // F03: um colaborador operacional pode corrigir uma despesa/receita já lançada.
  const admin = await requireOperacionalOuAdmin()

  const id = Number(formData.get('id'))
  const categoria = String(formData.get('categoria') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  const valor = String(formData.get('valor') || '0')
  const dataStr = String(formData.get('data') || '')
  const fracaoIdRaw = String(formData.get('fracaoId') || '').trim()
  const fracaoId = fracaoIdRaw ? Number(fracaoIdRaw) : null
  const fornecedorIdRaw = String(formData.get('fornecedorId') || '').trim()
  const fornecedorId = fornecedorIdRaw ? Number(fornecedorIdRaw) : null
  const assembleiaPontoIdRaw = String(formData.get('assembleiaPontoId') || '').trim()
  const assembleiaPontoId = assembleiaPontoIdRaw ? Number(assembleiaPontoIdRaw) : null
  const destino = String(formData.get('destino') || 'geral')
  const pagadorNome = String(formData.get('pagadorNome') || '').trim()
  const pagadorNif = String(formData.get('pagadorNif') || '').trim()
  const requerAprovacaoRaw = formData.get('requerAprovacao') === 'on'
  const urgente = formData.get('urgente') === 'on'
  const justificacaoUrgencia = String(formData.get('justificacaoUrgencia') || '').trim()
  const updatedAtEsperadoStr = String(formData.get('updatedAtEsperado') || '')

  if (!categoria || !descricao || !valor || !dataStr) {
    throw new Error('Preencha todos os campos obrigatórios')
  }
  if (destino !== 'geral' && destino !== 'reserva') {
    throw new Error('Destino inválido')
  }
  if (urgente && !justificacaoUrgencia) {
    throw new Error('Indique a justificação da obra urgente')
  }

  const [atual] = await db
    .select()
    .from(movimento)
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))
    .limit(1)
  if (!atual) throw new Error('Movimento não encontrado')

  // Controlo otimista de concorrência (achado F08) — deteta que outra
  // pessoa alterou este movimento entretanto (ex. duas pessoas a editar a
  // mesma despesa ao mesmo tempo), em vez de a última escrita ganhar em
  // silêncio sem avisar quem perdeu a sua alteração.
  if (updatedAtEsperadoStr) {
    const updatedAtEsperado = new Date(updatedAtEsperadoStr)
    if (atual.updatedAt.getTime() !== updatedAtEsperado.getTime()) {
      throw new Error(
        'Este movimento foi alterado por outra pessoa entretanto. Feche este diálogo e abra-o novamente para ver a versão mais recente antes de corrigir.',
      )
    }
  }

  if (atual.tipo === 'receita' && !fracaoId) {
    throw new Error('Selecione a fração a que esta quota diz respeito')
  }
  if (assembleiaPontoId) {
    await validarAssembleiaPonto(admin.condominioId, assembleiaPontoId)
  }

  const novaData = new Date(dataStr)
  await garantirExercicioAberto(admin.condominioId, atual.data)
  await garantirExercicioAberto(admin.condominioId, novaData)
  const requerAprovacao = atual.tipo === 'despesa' && requerAprovacaoRaw

  const novosValores = {
    categoria,
    descricao,
    valor,
    data: novaData,
    destino,
    fracaoId: atual.tipo === 'receita' ? fracaoId : null,
    fornecedorId: atual.tipo === 'despesa' ? fornecedorId : null,
    assembleiaPontoId,
    pagadorNome: atual.tipo === 'receita' && pagadorNome ? pagadorNome : null,
    pagadorNif: atual.tipo === 'receita' && pagadorNif ? pagadorNif : null,
    requerAprovacao,
    urgente: atual.tipo === 'despesa' && urgente,
    justificacaoUrgencia: atual.tipo === 'despesa' && urgente ? justificacaoUrgencia : null,
    updatedAt: new Date(),
  }

  await db
    .update(movimento)
    .set(novosValores)
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))

  const alteracoes = compararCampos(atual, novosValores, MOVIMENTO_LABELS)
  if (alteracoes.length > 0) {
    await registarAuditoria({
      actor: admin,
      acao: 'atualizar',
      entidade: 'movimento',
      entidadeId: id,
      detalhes: `${atual.categoria} — ${atual.descricao}: ${gerarResumoAlteracoes(alteracoes)}`,
      alteracoes,
    })
  }

  revalidatePath('/financas')
}

export async function eliminarMovimento(id: number) {
  const admin = await requireAdmin()

  const [atual] = await db
    .select()
    .from(movimento)
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))
    .limit(1)
  if (!atual) throw new Error('Movimento não encontrado')
  await garantirExercicioAberto(admin.condominioId, atual.data)

  // Soft-delete: registos financeiros têm obrigação legal de retenção —
  // nunca eliminar fisicamente (ver comentário em lib/db/schema.ts).
  await db
    .update(movimento)
    .set({ deletedAt: new Date() })
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'movimento',
    entidadeId: id,
  })

  revalidatePath('/financas')
  revalidatePath('/')
}

/**
 * Marca um movimento como pendente novamente — limpa o detalhe do
 * pagamento (meio, referência, data de liquidação), que deixa de fazer
 * sentido enquanto o movimento não voltar a ser pago.
 */
export async function alternarPago(id: number, pago: boolean) {
  // F03: um colaborador operacional pode marcar um movimento como pago/pendente.
  const admin = await requireOperacionalOuAdmin()

  const [atual] = await db
    .select()
    .from(movimento)
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))
    .limit(1)
  if (!atual) throw new Error('Movimento não encontrado')
  await garantirExercicioAberto(admin.condominioId, atual.data)

  const novosValores = pago
    ? { pago }
    : { pago, meioPagamento: null, referenciaMb: null, dataLiquidacao: null }

  await db
    .update(movimento)
    .set(novosValores)
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))

  const alteracoes = compararCampos(atual, novosValores, MOVIMENTO_PAGAMENTO_LABELS)
  if (alteracoes.length > 0) {
    await registarAuditoria({
      actor: admin,
      acao: 'atualizar',
      entidade: 'movimento',
      entidadeId: id,
      detalhes: pago ? 'Marcado como pago' : 'Marcado como pendente',
      alteracoes,
    })
  }

  revalidatePath('/financas')
}

/**
 * Marca um movimento como pago já com o detalhe do pagamento (meio,
 * referência multibanco, data de liquidação) — usado no diálogo de
 * "Marcar como pago" em vez do toggle simples de `alternarPago`.
 */
export async function marcarComoPago(
  id: number,
  detalhe: { meioPagamento?: string; referenciaMb?: string; dataLiquidacao?: string },
) {
  // F03: um colaborador operacional pode registar o detalhe de um pagamento.
  const admin = await requireOperacionalOuAdmin()

  const [atual] = await db
    .select()
    .from(movimento)
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))
    .limit(1)
  if (!atual) throw new Error('Movimento não encontrado')
  await garantirExercicioAberto(admin.condominioId, atual.data)

  const novosValores = {
    pago: true,
    meioPagamento: detalhe.meioPagamento || null,
    referenciaMb: detalhe.referenciaMb || null,
    dataLiquidacao: detalhe.dataLiquidacao ? new Date(detalhe.dataLiquidacao) : null,
  }

  await db
    .update(movimento)
    .set(novosValores)
    .where(and(eq(movimento.id, id), eq(movimento.condominioId, admin.condominioId)))

  const alteracoes = compararCampos(atual, novosValores, MOVIMENTO_PAGAMENTO_LABELS)
  if (alteracoes.length > 0) {
    await registarAuditoria({
      actor: admin,
      acao: 'atualizar',
      entidade: 'movimento',
      entidadeId: id,
      detalhes: `Marcado como pago${detalhe.meioPagamento ? ` (${detalhe.meioPagamento})` : ''}`,
      alteracoes,
    })
  }

  revalidatePath('/financas')
}
