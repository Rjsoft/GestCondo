'use server'

import { db } from '@/lib/db'
import { fornecedor, fracao, fracaoTitular, fracaoTransmissao, membro } from '@/lib/db/schema'
import { compararCampos, gerarResumoAlteracoes, registarAuditoria } from '@/lib/audit'
import {
  DECISAO_SALDO_LABEL,
  DECISOES_SALDO,
  TIPOS_TITULAR,
  excedePermilagemTotal,
  type DecisaoSaldo,
} from '@/lib/fracoes'
import { parsearFracoes, validarConjuntoFracoes } from '@/lib/fracoes-massa'
import { getMapaSaldos } from '@/app/actions/financas'
import {
  NIVEIS_GESTOR,
  PERFIS,
  requireAcessoFinanceiro,
  requireAdmin,
  requireConsultaGestao,
  temConsultaGestao,
} from '@/lib/session'
import { and, asc, desc, eq, ne, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

/** Soma da permilagem de todas as frações do condomínio, excluindo
 * opcionalmente uma (para validar uma edição contra as restantes). */
async function getSomaPermilagemOutrasFracoes(condominioId: number, excluirId?: number) {
  const condicao = excluirId
    ? and(eq(fracao.condominioId, condominioId), ne(fracao.id, excluirId))
    : eq(fracao.condominioId, condominioId)
  const [{ soma }] = await db
    .select({ soma: sql<string>`coalesce(sum(${fracao.permilagem}), 0)` })
    .from(fracao)
    .where(condicao)
  return Number(soma)
}

export async function getFracoes() {
  // Dados patrimoniais: admin, gestor, condómino ou auditor — não
  // inquilino nem fornecedor (ver lib/session.ts).
  const m = await requireAcessoFinanceiro()
  const linhas = await db
    .select()
    .from(fracao)
    .where(eq(fracao.condominioId, m.condominioId))
    // Ordenar por `identificacao` apenas: `letra` é opcional e, enquanto só
    // algumas frações a tiverem preenchida, ordenar também por ela empurra
    // as restantes (NULL) para o fim em vez de as manter na ordem de
    // construção habitual — ver achado da revisão de 2026-07-23.
    .orderBy(asc(fracao.identificacao))

  // Contactos pessoais (email/telefone do proprietário) só para quem gere
  // o condomínio ou audita — um condómino comum não precisa de ver o
  // contacto pessoal de todos os outros proprietários (SECURITY_AUDIT.md
  // S13 / minimização de dados RGPD). Feito aqui e não com um `select`
  // mais restrito na query para manter o mesmo formato de linha em todos
  // os consumidores (ex. o mapa de saldos); os dados nunca chegam ao
  // cliente de qualquer forma quando o utilizador não tem permissão.
  if (temConsultaGestao(m)) return linhas
  return linhas.map((f) => ({ ...f, contactoEmail: null, contactoTelefone: null }))
}

export async function getFracaoPorId(id: number) {
  const m = await requireAcessoFinanceiro()
  const [f] = await db
    .select()
    .from(fracao)
    .where(and(eq(fracao.id, id), eq(fracao.condominioId, m.condominioId)))
    .limit(1)
  return f ?? null
}

function lerTipoTitular(formData: FormData) {
  const valor = String(formData.get('tipoTitular') || '')
  return (TIPOS_TITULAR as readonly string[]).includes(valor)
    ? (valor as (typeof TIPOS_TITULAR)[number])
    : null
}

export async function criarFracao(formData: FormData) {
  const admin = await requireAdmin()

  const letra = String(formData.get('letra') || '').trim()
  const identificacao = String(formData.get('identificacao') || '').trim()
  const proprietario = String(formData.get('proprietario') || '').trim()
  const tipoTitular = lerTipoTitular(formData)
  const nif = String(formData.get('nif') || '').trim()
  const permilagem = String(formData.get('permilagem') || '0')
  const areaPrivativaRaw = String(formData.get('areaPrivativa') || '').trim()
  const areaComumRaw = String(formData.get('areaComum') || '').trim()
  const contactoEmail = String(formData.get('contactoEmail') || '').trim()
  const contactoTelefone = String(formData.get('contactoTelefone') || '').trim()
  const representanteLegal = String(formData.get('representanteLegal') || '').trim()
  const representanteLegalContacto = String(formData.get('representanteLegalContacto') || '').trim()
  const notas = String(formData.get('notas') || '').trim()
  const isentaElevador = formData.get('isentaElevador') === 'on'

  if (!identificacao || !proprietario) {
    throw new Error('Preencha a identificação e o proprietário')
  }

  const somaOutras = await getSomaPermilagemOutrasFracoes(admin.condominioId)
  if (excedePermilagemTotal(somaOutras, Number(permilagem) || 0)) {
    throw new Error(
      `A soma das permilagens ficaria em ${(somaOutras + (Number(permilagem) || 0)).toFixed(2)}‰ — acima do máximo de 1000‰`,
    )
  }

  const [nova] = await db
    .insert(fracao)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      letra: letra || null,
      identificacao,
      proprietario,
      tipoTitular,
      nif: nif || null,
      permilagem,
      areaPrivativa: areaPrivativaRaw || null,
      areaComum: areaComumRaw || null,
      contactoEmail: contactoEmail || null,
      contactoTelefone: contactoTelefone || null,
      representanteLegal: representanteLegal || null,
      representanteLegalContacto: representanteLegalContacto || null,
      notas: notas || null,
      isentaElevador,
    })
    .returning({ id: fracao.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'fracao',
    entidadeId: nova.id,
    detalhes: `${identificacao} — ${proprietario}`,
  })

  revalidatePath('/fracoes')
  revalidatePath('/')
}

/**
 * Cria várias frações de uma vez a partir de texto colado (uma fração por
 * linha) — ver `lib/fracoes-massa.ts` para o formato aceite e
 * `FUNCTIONAL_GAPS.md` secção 11 para o motivo. Resolve a fricção de dar
 * entrada de um condomínio novo, onde criar 40 frações uma a uma no diálogo
 * "Nova fração" era o passo mais penoso do primeiro dia.
 *
 * O cliente já valida e mostra uma pré-visualização antes de chamar isto,
 * mas **toda a validação é repetida aqui** — o cliente nunca é fonte de
 * verdade, e entre a pré-visualização e a confirmação as frações existentes
 * podem ter mudado.
 *
 * Tudo ou nada: uma transação. Ficar a meio deixaria o condomínio com uma
 * permilagem incoerente e obrigaria a apagar frações à mão.
 */
export async function criarFracoesEmMassa(texto: string) {
  const admin = await requireAdmin()

  const { linhas, erros } = parsearFracoes(texto)
  if (erros.length > 0) {
    throw new Error(
      `Há ${erros.length} linha(s) por corrigir. Reveja a pré-visualização antes de confirmar.`,
    )
  }
  if (linhas.length === 0) {
    throw new Error('Não há nenhuma fração para criar.')
  }

  const existentes = await db
    .select({ identificacao: fracao.identificacao })
    .from(fracao)
    .where(eq(fracao.condominioId, admin.condominioId))

  const somaExistente = await getSomaPermilagemOutrasFracoes(admin.condominioId)

  const errosConjunto = validarConjuntoFracoes(
    linhas,
    existentes.map((e) => e.identificacao),
    somaExistente,
  )
  if (errosConjunto.length > 0) {
    throw new Error(errosConjunto[0])
  }

  const criadas = await db.transaction(async (tx) => {
    return tx
      .insert(fracao)
      .values(
        linhas.map((l) => ({
          condominioId: admin.condominioId,
          userId: admin.userId,
          identificacao: l.identificacao,
          proprietario: l.proprietario,
          nif: l.nif,
          permilagem: String(l.permilagem),
        })),
      )
      .returning({ id: fracao.id, identificacao: fracao.identificacao, proprietario: fracao.proprietario })
  })

  // Uma entrada de auditoria por fração, e não só um total agregado — é mais
  // rastreável do que a limitação T2 descrita em
  // `docs/audit/DOCUMENT_TRACEABILITY_AUDIT.md`, e mantém o mesmo formato de
  // `detalhes` usado por `criarFracao`, para o histórico ficar homogéneo.
  for (const c of criadas) {
    await registarAuditoria({
      actor: admin,
      acao: 'criar',
      entidade: 'fracao',
      entidadeId: c.id,
      detalhes: `${c.identificacao} — ${c.proprietario} (criação em massa de ${criadas.length} frações)`,
    })
  }

  revalidatePath('/fracoes')
  revalidatePath('/')

  return { criadas: criadas.length }
}

export async function atualizarFracao(formData: FormData) {
  const admin = await requireAdmin()

  const id = Number(formData.get('id'))
  const letra = String(formData.get('letra') || '').trim()
  const identificacao = String(formData.get('identificacao') || '').trim()
  const proprietario = String(formData.get('proprietario') || '').trim()
  const tipoTitular = lerTipoTitular(formData)
  const nif = String(formData.get('nif') || '').trim()
  const permilagem = String(formData.get('permilagem') || '0')
  const areaPrivativaRaw = String(formData.get('areaPrivativa') || '').trim()
  const areaComumRaw = String(formData.get('areaComum') || '').trim()
  const contactoEmail = String(formData.get('contactoEmail') || '').trim()
  const contactoTelefone = String(formData.get('contactoTelefone') || '').trim()
  const representanteLegal = String(formData.get('representanteLegal') || '').trim()
  const representanteLegalContacto = String(formData.get('representanteLegalContacto') || '').trim()
  const notas = String(formData.get('notas') || '').trim()

  if (!identificacao || !proprietario) {
    throw new Error('Preencha a identificação e o proprietário')
  }

  const somaOutras = await getSomaPermilagemOutrasFracoes(admin.condominioId, id)
  if (excedePermilagemTotal(somaOutras, Number(permilagem) || 0)) {
    throw new Error(
      `A soma das permilagens ficaria em ${(somaOutras + (Number(permilagem) || 0)).toFixed(2)}‰ — acima do máximo de 1000‰`,
    )
  }

  // Estado completo antes do update — importante sobretudo para o
  // proprietário: sem isto perdia-se o registo de quem era o proprietário
  // antes de uma venda/sucessão, relevante para apurar responsabilidade por
  // dívidas (FUNCTIONAL_GAPS.md, "Histórico de titularidade"). Reaproveita
  // o audit_log já existente, sem tabela nova.
  const condicao = and(eq(fracao.id, id), eq(fracao.condominioId, admin.condominioId))
  const [antes] = await db.select().from(fracao).where(condicao).limit(1)
  if (!antes) throw new Error('Fração não encontrada')

  const novosValores = {
    letra: letra || null,
    identificacao,
    proprietario,
    tipoTitular,
    nif: nif || null,
    permilagem,
    areaPrivativa: areaPrivativaRaw || null,
    areaComum: areaComumRaw || null,
    contactoEmail: contactoEmail || null,
    contactoTelefone: contactoTelefone || null,
    representanteLegal: representanteLegal || null,
    representanteLegalContacto: representanteLegalContacto || null,
    notas: notas || null,
  }

  await db.update(fracao).set(novosValores).where(condicao)

  const alteracoes = compararCampos(antes, novosValores, {
    letra: 'Letra',
    identificacao: 'Identificação',
    proprietario: 'Proprietário',
    tipoTitular: 'Tipo de titular',
    nif: 'NIF',
    permilagem: 'Permilagem',
    areaPrivativa: 'Área privativa',
    areaComum: 'Área comum',
    contactoEmail: 'Email',
    contactoTelefone: 'Telefone',
    representanteLegal: 'Representante legal',
    representanteLegalContacto: 'Contacto do representante legal',
    notas: 'Notas',
  })
  if (alteracoes.length > 0) {
    await registarAuditoria({
      actor: admin,
      acao: 'atualizar',
      entidade: 'fracao',
      entidadeId: id,
      detalhes: `${identificacao}: ${gerarResumoAlteracoes(alteracoes)}`,
      alteracoes,
    })
  }

  revalidatePath('/fracoes')
  revalidatePath('/')
}

export async function alternarIsencaoElevador(id: number, isento: boolean) {
  const admin = await requireAdmin()
  const condicao = and(eq(fracao.id, id), eq(fracao.condominioId, admin.condominioId))
  const [antes] = await db.select({ identificacao: fracao.identificacao, isentaElevador: fracao.isentaElevador }).from(fracao).where(condicao).limit(1)
  if (!antes) throw new Error('Fração não encontrada')
  if (antes.isentaElevador === isento) return

  await db.update(fracao).set({ isentaElevador: isento }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'fracao',
    entidadeId: id,
    detalhes: `${antes.identificacao}: ${isento ? 'marcada como isenta de elevador' : 'deixou de estar isenta de elevador'}`,
    alteracoes: [{ campo: 'isentaElevador', label: 'Isenção de elevador', antes: antes.isentaElevador, depois: isento }],
  })

  revalidatePath('/fracoes')
  revalidatePath('/financas')
}

/**
 * Regista a transmissão de uma fração (venda, doação, sucessão), amarrando
 * num só passo o que antes ficava disperso: vendedor/comprador, data da
 * escritura, decisão sobre o saldo em dívida (snapshot, não uma alteração
 * automática de movimentos — a dívida é da fração, não de uma "pessoa"
 * registada em `movimento`). Atualiza `fracao.proprietario`/`nif`,
 * reaproveitando o mesmo diff de auditoria já usado em `atualizarFracao`
 * ("Histórico de titularidade"). Não mexe em `membro` nem em movimentos —
 * gerir o acesso à app (remover a conta antiga, ligar a do novo titular) e
 * emitir a declaração de dívida, se necessário, continuam passos manuais
 * separados (ver /condominos e /financas/declaracao-divida).
 */
export async function registarTransmissaoFracao(fracaoId: number, formData: FormData) {
  const admin = await requireAdmin()
  const condicao = and(eq(fracao.id, fracaoId), eq(fracao.condominioId, admin.condominioId))

  const [antes] = await db
    .select({ proprietario: fracao.proprietario, nif: fracao.nif })
    .from(fracao)
    .where(condicao)
    .limit(1)
  if (!antes) throw new Error('Fração não encontrada')

  const compradorNome = String(formData.get('compradorNome') || '').trim()
  const compradorNif = String(formData.get('compradorNif') || '').trim()
  const dataEscrituraStr = String(formData.get('dataEscritura') || '').trim()
  const decisaoSaldo = String(formData.get('decisaoSaldo') || '')
  const notas = String(formData.get('notas') || '').trim()

  if (!compradorNome) throw new Error('Indique o nome do novo titular')
  if (!dataEscrituraStr) throw new Error('Indique a data da escritura')
  if (!(DECISOES_SALDO as readonly string[]).includes(decisaoSaldo)) {
    throw new Error('Indique a decisão sobre o saldo em dívida')
  }

  const saldos = await getMapaSaldos()
  const saldoAtual = saldos.find((s) => s.fracaoId === fracaoId)?.emDivida ?? 0

  await db.insert(fracaoTransmissao).values({
    fracaoId,
    vendedorNome: antes.proprietario,
    vendedorNif: antes.nif,
    compradorNome,
    compradorNif: compradorNif || null,
    dataEscritura: new Date(dataEscrituraStr),
    saldoNaData: saldoAtual.toFixed(2),
    decisaoSaldo,
    notas: notas || null,
    userId: admin.userId,
    autorNome: admin.nome,
  })

  const novosValores = { proprietario: compradorNome, nif: compradorNif || null }
  await db.update(fracao).set(novosValores).where(condicao)

  const alteracoes = compararCampos(antes, novosValores, { proprietario: 'Proprietário', nif: 'NIF' })
  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'fracao',
    entidadeId: fracaoId,
    detalhes: `Transmissão registada: ${antes.proprietario} → ${compradorNome}, escritura em ${dataEscrituraStr}, saldo à data: ${saldoAtual.toFixed(2)} € (${DECISAO_SALDO_LABEL[decisaoSaldo as DecisaoSaldo]})`,
    alteracoes,
  })

  revalidatePath('/fracoes')
}

/** Contagem de transmissões por fração, para o botão "N transmissões anteriores" na listagem. */
export async function getContagemTransmissoesPorFracao() {
  const m = await requireAcessoFinanceiro()
  const linhas = await db
    .select({ fracaoId: fracaoTransmissao.fracaoId })
    .from(fracaoTransmissao)
    .innerJoin(fracao, eq(fracaoTransmissao.fracaoId, fracao.id))
    .where(eq(fracao.condominioId, m.condominioId))

  const contagem: Record<number, number> = {}
  for (const l of linhas) contagem[l.fracaoId] = (contagem[l.fracaoId] ?? 0) + 1
  return contagem
}

/** Histórico de transmissões de uma fração, mais recente primeiro. */
export async function getTransmissoesFracao(fracaoId: number) {
  const m = await requireAcessoFinanceiro()
  const [f] = await db
    .select({ id: fracao.id })
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, m.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração não encontrada')

  return db
    .select()
    .from(fracaoTransmissao)
    .where(eq(fracaoTransmissao.fracaoId, fracaoId))
    .orderBy(desc(fracaoTransmissao.createdAt))
}

export async function eliminarFracao(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(fracao)
    .where(and(eq(fracao.id, id), eq(fracao.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'fracao',
    entidadeId: id,
  })

  revalidatePath('/fracoes')
  revalidatePath('/')
}

// --- Membros / condóminos --------------------------------------------------

export async function getMembros() {
  // Consulta de gestão: admin, gestor ou auditor.
  const m = await requireConsultaGestao()
  return db
    .select()
    .from(membro)
    .where(eq(membro.condominioId, m.condominioId))
    .orderBy(desc(membro.createdAt))
}

export async function atualizarPerfilMembro(id: number, perfil: string) {
  const admin = await requireAdmin()
  if (!PERFIS.includes(perfil as (typeof PERFIS)[number])) {
    throw new Error('Perfil inválido')
  }
  const condicao = and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId))
  const [antes] = await db.select({ nome: membro.nome, perfil: membro.perfil }).from(membro).where(condicao).limit(1)
  if (!antes) throw new Error('Membro não encontrado')
  if (antes.perfil === perfil) return

  await db.update(membro).set({ perfil }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'membro',
    entidadeId: id,
    detalhes: `${antes.nome}: Perfil alterado de "${antes.perfil}" para "${perfil}"`,
    alteracoes: [{ campo: 'perfil', label: 'Perfil', antes: antes.perfil, depois: perfil }],
  })

  revalidatePath('/condominos')
}

/** Achado F03 — só relevante para `perfil: 'gestor'`; ignorado nos
 * restantes (mas não bloqueado: evita um erro estranho se a UI mudar o
 * perfil e o nível na mesma operação numa ordem imprevisível). */
export async function atualizarNivelGestorMembro(id: number, nivelGestor: string) {
  const admin = await requireAdmin()
  if (!NIVEIS_GESTOR.includes(nivelGestor as (typeof NIVEIS_GESTOR)[number])) {
    throw new Error('Nível inválido')
  }
  const condicao = and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId))
  const [antes] = await db
    .select({ nome: membro.nome, perfil: membro.perfil, nivelGestor: membro.nivelGestor })
    .from(membro)
    .where(condicao)
    .limit(1)
  if (!antes) throw new Error('Membro não encontrado')
  if (antes.nivelGestor === nivelGestor) return

  await db.update(membro).set({ nivelGestor }).where(condicao)

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'membro',
    entidadeId: id,
    detalhes: `${antes.nome}: Nível de gestor alterado de "${antes.nivelGestor}" para "${nivelGestor}"`,
    alteracoes: [{ campo: 'nivelGestor', label: 'Nível', antes: antes.nivelGestor, depois: nivelGestor }],
  })

  revalidatePath('/condominos')
}

export async function aprovarMembro(id: number) {
  const admin = await requireAdmin()
  await db
    .update(membro)
    .set({ estado: 'aprovado' })
    .where(and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'aprovar',
    entidade: 'membro',
    entidadeId: id,
  })

  revalidatePath('/condominos')
}

export async function rejeitarMembro(id: number) {
  const admin = await requireAdmin()
  await db
    .delete(membro)
    .where(and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'rejeitar',
    entidade: 'membro',
    entidadeId: id,
  })

  revalidatePath('/condominos')
}

/**
 * Remove a conta de um condómino/inquilino já aprovado — distinto de
 * `rejeitarMembro`, que só se usa em pedidos pendentes. Necessário, por
 * exemplo, quando o proprietário de uma fração falece: o herdeiro cria
 * conta nova e liga-a à fração, e esta ação retira a conta antiga (que,
 * até aqui, só podia ser editada, nunca eliminada — FUNCTIONAL_GAPS.md,
 * "Sucessão do titular (óbito)"). Não apaga a fração nem o seu histórico
 * financeiro, só a conta de acesso.
 */
export async function removerMembro(id: number) {
  const admin = await requireAdmin()
  if (id === admin.id) {
    throw new Error('Não pode remover a sua própria conta por aqui')
  }

  const [alvo] = await db
    .select({ nome: membro.nome, email: membro.email })
    .from(membro)
    .where(and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId)))
    .limit(1)
  if (!alvo) throw new Error('Membro não encontrado')

  await db
    .delete(membro)
    .where(and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId)))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'membro',
    entidadeId: id,
    detalhes: `${alvo.nome} (${alvo.email})`,
  })

  revalidatePath('/condominos')
  revalidatePath('/fracoes')
}

export async function atualizarMembro(formData: FormData) {
  const admin = await requireAdmin()
  const id = Number(formData.get('id'))
  const nome = String(formData.get('nome') || '').trim()
  const fracaoIdRaw = String(formData.get('fracaoId') || '').trim()
  const fornecedorIdRaw = String(formData.get('fornecedorId') || '').trim()
  const telefone = String(formData.get('telefone') || '').trim()

  if (!id || !nome) throw new Error('Dados inválidos')

  let fracaoId: number | null = null
  if (fracaoIdRaw) {
    // Confirma que a fração pertence ao mesmo condomínio do admin, para
    // nunca se poder ligar um membro a uma fração de outro condomínio.
    const [f] = await db
      .select({ id: fracao.id })
      .from(fracao)
      .where(and(eq(fracao.id, Number(fracaoIdRaw)), eq(fracao.condominioId, admin.condominioId)))
      .limit(1)
    if (!f) throw new Error('Fração inválida')
    fracaoId = f.id
  }

  let fornecedorId: number | null = null
  if (fornecedorIdRaw) {
    // Mesma confirmação de isolamento que fracaoId, acima — liga o login
    // (perfil "fornecedor") à ficha de fornecedor, para o portal do
    // fornecedor saber que ocorrências/orçamentos lhe pertencem.
    const [f] = await db
      .select({ id: fornecedor.id })
      .from(fornecedor)
      .where(and(eq(fornecedor.id, Number(fornecedorIdRaw)), eq(fornecedor.condominioId, admin.condominioId)))
      .limit(1)
    if (!f) throw new Error('Fornecedor inválido')
    fornecedorId = f.id
  }

  const condicao = and(eq(membro.id, id), eq(membro.condominioId, admin.condominioId))
  const [antes] = await db.select().from(membro).where(condicao).limit(1)
  if (!antes) throw new Error('Membro não encontrado')

  const novosValores = { nome, fracaoId, fornecedorId, telefone: telefone || null }
  await db.update(membro).set(novosValores).where(condicao)

  const alteracoes = compararCampos(antes, novosValores, {
    nome: 'Nome',
    fracaoId: 'Fração',
    fornecedorId: 'Fornecedor associado',
    telefone: 'Telefone',
  })
  if (alteracoes.length > 0) {
    await registarAuditoria({
      actor: admin,
      acao: 'atualizar',
      entidade: 'membro',
      entidadeId: id,
      detalhes: `${antes.nome}: ${gerarResumoAlteracoes(alteracoes)}`,
      alteracoes,
    })
  }

  revalidatePath('/condominos')
}

/**
 * Associa uma SEGUNDA (ou mais) fração a uma conta já aprovada no mesmo
 * condomínio (achado F04 — condómino ou senhorio com várias frações no
 * mesmo condomínio, docs/audit/USABILITY_FINDINGS.md). Cria sempre uma
 * linha `membro` NOVA, distinta da(s) já existente(s) para o mesmo
 * `userId` — nunca reaproveita nem sobrescreve uma linha existente (isso é
 * o que `atualizarMembro` já faz, para trocar a fração de UMA linha).
 * A nova linha herda o perfil da linha de origem ("condomino" ou
 * "inquilino" — os dois únicos perfis com sentido ligados a uma fração);
 * bloqueado para admin/gestor/fornecedor/auditor, que não têm fração.
 */
export async function associarFracaoAdicional(formData: FormData) {
  const admin = await requireAdmin()
  const membroOrigemId = Number(formData.get('membroOrigemId'))
  const fracaoId = Number(formData.get('fracaoId'))
  if (!membroOrigemId || !fracaoId) throw new Error('Dados inválidos')

  const [origem] = await db
    .select()
    .from(membro)
    .where(
      and(
        eq(membro.id, membroOrigemId),
        eq(membro.condominioId, admin.condominioId),
        eq(membro.estado, 'aprovado'),
      ),
    )
    .limit(1)
  if (!origem) throw new Error('Membro não encontrado')
  if (origem.perfil !== 'condomino' && origem.perfil !== 'inquilino') {
    throw new Error('Só é possível associar frações extra a condóminos ou inquilinos')
  }

  const [fracaoValida] = await db
    .select({ id: fracao.id, identificacao: fracao.identificacao })
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, admin.condominioId)))
    .limit(1)
  if (!fracaoValida) throw new Error('Fração inválida')

  // Verificação prévia por conveniência (mensagem clara); o índice único
  // parcial membro_user_condominio_fracao_idx é a garantia real contra
  // corrida (duas escritas concorrentes para a mesma conta+fração).
  const [jaAssociada] = await db
    .select({ id: membro.id })
    .from(membro)
    .where(
      and(
        eq(membro.userId, origem.userId),
        eq(membro.condominioId, admin.condominioId),
        eq(membro.fracaoId, fracaoId),
      ),
    )
    .limit(1)
  if (jaAssociada) throw new Error('Esta conta já está associada a esta fração')

  const [novoMembro] = await db
    .insert(membro)
    .values({
      condominioId: admin.condominioId,
      userId: origem.userId,
      nome: origem.nome,
      email: origem.email,
      perfil: origem.perfil,
      estado: 'aprovado',
      fracaoId,
    })
    .returning()

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'membro',
    entidadeId: novoMembro.id,
    detalhes: `${origem.nome}: associado à fração ${fracaoValida.identificacao} (conta já existente)`,
  })

  revalidatePath('/condominos')
}

/**
 * Titulares adicionais de uma fração (heranças indivisas, vários donos) —
 * lista opcional que complementa `fracao.proprietario`, para identificar
 * cada um individualmente (nome + NIF) em documentos formais. Uma fração
 * sem nenhuma linha aqui não é afetada — ver `lib/db/schema.ts:fracaoTitular`.
 */
export async function getTitularesFracao(fracaoId: number) {
  const m = await requireAcessoFinanceiro()
  const [f] = await db
    .select({ id: fracao.id })
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, m.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração não encontrada')

  return db
    .select()
    .from(fracaoTitular)
    .where(eq(fracaoTitular.fracaoId, fracaoId))
    .orderBy(asc(fracaoTitular.createdAt))
}

export async function adicionarTitular(
  fracaoId: number,
  dados: { nome: string; nif?: string; tipoTitular?: string; contactoEmail?: string; contactoTelefone?: string },
) {
  const admin = await requireAdmin()
  const nome = dados.nome.trim()
  if (!nome) throw new Error('Indique o nome do titular')

  const [f] = await db
    .select({ id: fracao.id, identificacao: fracao.identificacao })
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, admin.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração não encontrada')

  const tipoTitular = (TIPOS_TITULAR as readonly string[]).includes(dados.tipoTitular ?? '')
    ? (dados.tipoTitular as (typeof TIPOS_TITULAR)[number])
    : 'proprietario'

  const [novo] = await db
    .insert(fracaoTitular)
    .values({
      fracaoId,
      nome,
      nif: dados.nif?.trim() || null,
      tipoTitular,
      contactoEmail: dados.contactoEmail?.trim() || null,
      contactoTelefone: dados.contactoTelefone?.trim() || null,
    })
    .returning()

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'fracao',
    entidadeId: fracaoId,
    detalhes: `Titular adicionado à fração ${f.identificacao}: ${nome}${dados.nif ? ` (NIF ${dados.nif})` : ''}`,
  })

  revalidatePath('/fracoes')
  return novo
}

export async function removerTitular(titularId: number) {
  const admin = await requireAdmin()

  const [t] = await db
    .select({
      id: fracaoTitular.id,
      nome: fracaoTitular.nome,
      fracaoId: fracaoTitular.fracaoId,
      condominioId: fracao.condominioId,
      identificacao: fracao.identificacao,
    })
    .from(fracaoTitular)
    .innerJoin(fracao, eq(fracao.id, fracaoTitular.fracaoId))
    .where(eq(fracaoTitular.id, titularId))
    .limit(1)
  if (!t || t.condominioId !== admin.condominioId) throw new Error('Titular não encontrado')

  await db.delete(fracaoTitular).where(eq(fracaoTitular.id, titularId))

  await registarAuditoria({
    actor: admin,
    acao: 'eliminar',
    entidade: 'fracao',
    entidadeId: t.fracaoId,
    detalhes: `Titular removido da fração ${t.identificacao}: ${t.nome}`,
  })

  revalidatePath('/fracoes')
}
