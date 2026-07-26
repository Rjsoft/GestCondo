'use server'

import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import {
  condominio,
  membro,
  fracao,
  fornecedor,
  orcamento,
  orcamentoRubrica,
  exercicioFinanceiro,
  contaFinanceira,
  saldoInicialConta,
  assembleia,
  assembleiaPonto,
  assembleiaPresenca,
  assembleiaVoto,
  movimento,
  extratoBancario,
  documentoFornecedor,
  pagamentoDocumentoFornecedor,
  seguro,
  seguroFracao,
  aviso,
  ocorrencia,
  documento,
} from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAdmin, getSession } from '@/lib/session'
import type { MembroSessao } from '@/lib/perfis'
import { paraData, paraDataOuNula, remapear, remapearOpcional } from '@/lib/importacao-condominio'
import { eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const VERSAO_FORMATO_EXPORTACAO = 1

// Sem 0/O/1/I — evita confusão ao ler/escrever o código à mão.
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function gerarCodigoConvite() {
  const bytes = randomBytes(8)
  let codigo = ''
  for (let i = 0; i < 8; i++) {
    codigo += ALFABETO_CODIGO[bytes[i] % ALFABETO_CODIGO.length]
  }
  return codigo
}

export async function atualizarCondominio(formData: FormData) {
  const admin = await requireAdmin()

  const nome = String(formData.get('nome') || '').trim()
  const morada = String(formData.get('morada') || '').trim()
  const nif = String(formData.get('nif') || '').trim()

  if (!nome) {
    throw new Error('Preencha o nome do condomínio')
  }

  await db
    .update(condominio)
    .set({ nome, morada: morada || null, nif: nif || null })
    .where(eq(condominio.id, admin.condominioId))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'condominio',
    entidadeId: admin.condominioId,
    detalhes: 'Dados do condomínio atualizados (nome/morada/NIF)',
  })

  revalidatePath('/condominio')
  revalidatePath('/')
  revalidatePath('/os-meus-dados')
}

/**
 * Gera (ou substitui) o código de convite do condomínio. Só o admin pode
 * gerar — regenerar invalida imediatamente o código anterior.
 */
export async function regenerarCodigoConvite() {
  const admin = await requireAdmin()

  const codigo = gerarCodigoConvite()
  await db.update(condominio).set({ codigoConvite: codigo }).where(eq(condominio.id, admin.condominioId))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'condominio',
    entidadeId: admin.condominioId,
    detalhes: 'Código de convite regenerado',
  })

  revalidatePath('/condominio')
  return codigo
}

/**
 * Onboarding (parte 1 de 2, ver app/onboarding): cria um condomínio novo
 * para uma conta autenticada que ainda não tem `membro` nenhum. O criador
 * fica admin, aprovado automaticamente — como acontecia com o "primeiro
 * condomínio do sistema" no comportamento antigo, mas agora disponível a
 * qualquer conta nova, não só à literal primeira alguma vez criada.
 */
export async function criarCondominio(formData: FormData) {
  const session = await getSession()
  if (!session?.user) throw new Error('Não autorizado')

  const [existente] = await db.select().from(membro).where(eq(membro.userId, session.user.id)).limit(1)
  if (existente) {
    throw new Error('A sua conta já está associada a um condomínio')
  }

  const nome = String(formData.get('nome') || '').trim()
  if (!nome) {
    throw new Error('Preencha o nome do condomínio')
  }

  const novoMembro = await db.transaction(async (tx) => {
    const [c] = await tx
      .insert(condominio)
      .values({ nome, codigoConvite: gerarCodigoConvite() })
      .returning({ id: condominio.id })

    const [m] = await tx
      .insert(membro)
      .values({
        condominioId: c.id,
        userId: session.user.id,
        nome: session.user.name || session.user.email,
        email: session.user.email,
        perfil: 'admin',
        estado: 'aprovado',
      })
      .returning()

    return m
  })

  const actor: MembroSessao = {
    id: novoMembro.id,
    condominioId: novoMembro.condominioId,
    userId: novoMembro.userId,
    nome: novoMembro.nome,
    email: novoMembro.email,
    perfil: 'admin',
    estado: 'aprovado',
    fracaoId: novoMembro.fracaoId,
    isSuperAdmin: false,
    isOperadorPlataforma: false,
    condominioSuspenso: false,
  }
  await registarAuditoria({
    actor,
    acao: 'criar',
    entidade: 'condominio',
    entidadeId: novoMembro.condominioId,
    detalhes: 'Condomínio criado via onboarding',
  })

  revalidatePath('/')
}

/**
 * Onboarding (parte 2 de 2): junta uma conta autenticada, sem `membro`
 * ainda, ao condomínio dono do código de convite indicado. Continua
 * "pendente" tal como qualquer registo novo — o código só decide a que
 * condomínio se junta, não o nível de acesso.
 */
export async function entrarComCodigo(formData: FormData) {
  const session = await getSession()
  if (!session?.user) throw new Error('Não autorizado')

  const [existente] = await db.select().from(membro).where(eq(membro.userId, session.user.id)).limit(1)
  if (existente) {
    throw new Error('A sua conta já está associada a um condomínio')
  }

  const codigo = String(formData.get('codigo') || '').trim().toUpperCase()
  if (!codigo) {
    throw new Error('Introduza o código de convite')
  }

  const [c] = await db.select().from(condominio).where(eq(condominio.codigoConvite, codigo)).limit(1)
  if (!c) {
    throw new Error('Código de convite inválido')
  }

  const [novoMembro] = await db
    .insert(membro)
    .values({
      condominioId: c.id,
      userId: session.user.id,
      nome: session.user.name || session.user.email,
      email: session.user.email,
      perfil: 'condomino',
      estado: 'pendente',
    })
    .returning()

  await registarAuditoria({
    actor: {
      id: novoMembro.id,
      condominioId: novoMembro.condominioId,
      userId: novoMembro.userId,
      nome: novoMembro.nome,
      email: novoMembro.email,
      perfil: 'condomino',
      estado: 'pendente',
      fracaoId: novoMembro.fracaoId,
      isSuperAdmin: false,
      isOperadorPlataforma: false,
      condominioSuspenso: false,
    },
    acao: 'criar',
    entidade: 'membro',
    entidadeId: novoMembro.id,
    detalhes: 'Registo via código de convite',
  })

  revalidatePath('/')
}

/**
 * Exporta todos os dados do condomínio do administrador autenticado para um
 * único objeto JSON — pensado para round-trip com `importarCondominio`
 * (onboarding), como backup/portabilidade. Não inclui:
 * - o conteúdo binário de anexos (documentos, fotos, apólices) — só o nome
 *   e a referência; o ficheiro em si fica por recarregar manualmente após
 *   uma eventual importação.
 * - `membro` (a lista de condóminos/inquilinos com conta): os `userId`
 *   originais pertencem a contas de autenticação que não devem ser ligadas
 *   a um condomínio novo sem o consentimento de cada pessoa — ver
 *   `importarCondominio`.
 * - `audit_log`: fabricar o histórico de auditoria de outro condomínio
 *   contradiria o que esse registo representa.
 */
export async function exportarCondominio() {
  const admin = await requireAdmin()
  const condominioId = admin.condominioId

  const [
    condominioAtual,
    fracoes,
    fornecedores,
    orcamentos,
    exercicios,
    contas,
    assembleias,
    seguros,
    avisos,
    ocorrencias,
    documentos,
  ] = await Promise.all([
    db.select().from(condominio).where(eq(condominio.id, condominioId)).limit(1),
    db.select().from(fracao).where(eq(fracao.condominioId, condominioId)),
    db.select().from(fornecedor).where(eq(fornecedor.condominioId, condominioId)),
    db.select().from(orcamento).where(eq(orcamento.condominioId, condominioId)),
    db.select().from(exercicioFinanceiro).where(eq(exercicioFinanceiro.condominioId, condominioId)),
    db.select().from(contaFinanceira).where(eq(contaFinanceira.condominioId, condominioId)),
    db.select().from(assembleia).where(eq(assembleia.condominioId, condominioId)),
    db.select().from(seguro).where(eq(seguro.condominioId, condominioId)),
    db.select().from(aviso).where(eq(aviso.condominioId, condominioId)),
    db.select().from(ocorrencia).where(eq(ocorrencia.condominioId, condominioId)),
    db.select().from(documento).where(eq(documento.condominioId, condominioId)),
  ])

  const orcamentoIds = orcamentos.map((o) => o.id)
  const seguroIds = seguros.map((s) => s.id)
  const assembleiaIds = assembleias.map((a) => a.id)

  const [orcamentoRubricas, seguroFracoes, assembleiaPontos] = await Promise.all([
    orcamentoIds.length
      ? db.select().from(orcamentoRubrica).where(inArray(orcamentoRubrica.orcamentoId, orcamentoIds))
      : Promise.resolve([]),
    seguroIds.length
      ? db.select().from(seguroFracao).where(inArray(seguroFracao.seguroId, seguroIds))
      : Promise.resolve([]),
    assembleiaIds.length
      ? db.select().from(assembleiaPonto).where(inArray(assembleiaPonto.assembleiaId, assembleiaIds))
      : Promise.resolve([]),
  ])

  const pontoIds = assembleiaPontos.map((p) => p.id)

  const [assembleiaPresencas, assembleiaVotos, saldosIniciais, movimentos] = await Promise.all([
    assembleiaIds.length
      ? db.select().from(assembleiaPresenca).where(inArray(assembleiaPresenca.assembleiaId, assembleiaIds))
      : Promise.resolve([]),
    pontoIds.length
      ? db.select().from(assembleiaVoto).where(inArray(assembleiaVoto.pontoId, pontoIds))
      : Promise.resolve([]),
    db.select().from(saldoInicialConta).where(eq(saldoInicialConta.condominioId, condominioId)),
    db.select().from(movimento).where(eq(movimento.condominioId, condominioId)),
  ])

  const documentosFornecedor = await db
    .select()
    .from(documentoFornecedor)
    .where(eq(documentoFornecedor.condominioId, condominioId))

  const [extratos, pagamentosDocumentoFornecedor] = await Promise.all([
    db.select().from(extratoBancario).where(eq(extratoBancario.condominioId, condominioId)),
    db
      .select()
      .from(pagamentoDocumentoFornecedor)
      .where(eq(pagamentoDocumentoFornecedor.condominioId, condominioId)),
  ])

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'condominio',
    entidadeId: condominioId,
    detalhes: 'Exportação completa dos dados do condomínio',
  })

  return {
    versaoFormato: VERSAO_FORMATO_EXPORTACAO,
    exportadoEm: new Date().toISOString(),
    condominio: condominioAtual[0]
      ? {
          nome: condominioAtual[0].nome,
          morada: condominioAtual[0].morada,
          nif: condominioAtual[0].nif,
        }
      : null,
    dados: {
      fracoes,
      fornecedores,
      orcamentos,
      orcamentoRubricas,
      exercicios,
      contas,
      saldosIniciais,
      assembleias,
      assembleiaPontos,
      assembleiaPresencas,
      assembleiaVotos,
      movimentos,
      extratos,
      documentosFornecedor,
      pagamentosDocumentoFornecedor,
      seguros,
      seguroFracoes,
      avisos,
      ocorrencias,
      documentos,
    },
  }
}

type DadosExportacao = {
  fracoes: (typeof fracao.$inferSelect)[]
  fornecedores: (typeof fornecedor.$inferSelect)[]
  orcamentos: (typeof orcamento.$inferSelect)[]
  orcamentoRubricas: (typeof orcamentoRubrica.$inferSelect)[]
  exercicios: (typeof exercicioFinanceiro.$inferSelect)[]
  contas: (typeof contaFinanceira.$inferSelect)[]
  saldosIniciais: (typeof saldoInicialConta.$inferSelect)[]
  assembleias: (typeof assembleia.$inferSelect)[]
  assembleiaPontos: (typeof assembleiaPonto.$inferSelect)[]
  assembleiaPresencas: (typeof assembleiaPresenca.$inferSelect)[]
  assembleiaVotos: (typeof assembleiaVoto.$inferSelect)[]
  movimentos: (typeof movimento.$inferSelect)[]
  extratos: (typeof extratoBancario.$inferSelect)[]
  documentosFornecedor: (typeof documentoFornecedor.$inferSelect)[]
  pagamentosDocumentoFornecedor: (typeof pagamentoDocumentoFornecedor.$inferSelect)[]
  seguros: (typeof seguro.$inferSelect)[]
  seguroFracoes: (typeof seguroFracao.$inferSelect)[]
  avisos: (typeof aviso.$inferSelect)[]
  ocorrencias: (typeof ocorrencia.$inferSelect)[]
  documentos: (typeof documento.$inferSelect)[]
}

/**
 * Cria um condomínio NOVO a partir de um ficheiro produzido por
 * `exportarCondominio` — parte do onboarding (mesma família de
 * `criarCondominio`/`entrarComCodigo`), nunca escreve sobre um condomínio
 * já existente. Quem importa fica como único administrador do condomínio
 * novo — os restantes condóminos/inquilinos da exportação NÃO são
 * recriados como membros com conta (ver nota em `exportarCondominio`);
 * ficam por convidar de novo através do código de convite.
 */
export async function importarCondominio(formData: FormData) {
  const session = await getSession()
  if (!session?.user) throw new Error('Não autorizado')

  const [existente] = await db.select().from(membro).where(eq(membro.userId, session.user.id)).limit(1)
  if (existente) {
    throw new Error('A sua conta já está associada a um condomínio')
  }

  const ficheiro = formData.get('ficheiro')
  if (!(ficheiro instanceof File) || ficheiro.size === 0) {
    throw new Error('Selecione um ficheiro de exportação')
  }

  let conteudo: unknown
  try {
    conteudo = JSON.parse(await ficheiro.text())
  } catch {
    throw new Error('O ficheiro selecionado não é um JSON válido')
  }

  const exportacao = conteudo as {
    versaoFormato?: number
    exportadoEm?: string
    condominio?: { nome?: string; morada?: string | null; nif?: string | null } | null
    dados?: DadosExportacao
  }

  if (exportacao.versaoFormato !== VERSAO_FORMATO_EXPORTACAO || !exportacao.dados) {
    throw new Error('Este ficheiro não é reconhecido como uma exportação válida do GestCondo')
  }

  const d = exportacao.dados
  const nome = String(formData.get('nome') || exportacao.condominio?.nome || '').trim()
  if (!nome) throw new Error('Preencha o nome do condomínio')

  const novoMembro = await db.transaction(async (tx) => {
    const [c] = await tx
      .insert(condominio)
      .values({
        nome,
        morada: exportacao.condominio?.morada ?? null,
        nif: exportacao.condominio?.nif ?? null,
        codigoConvite: gerarCodigoConvite(),
      })
      .returning({ id: condominio.id })
    const condominioId = c.id

    const mapaFracao = new Map<number, number>()
    if (d.fracoes.length) {
      const inseridas = await tx
        .insert(fracao)
        .values(
          d.fracoes.map((f) => ({
            condominioId,
            userId: f.userId,
            letra: f.letra,
            identificacao: f.identificacao,
            proprietario: f.proprietario,
            tipoTitular: f.tipoTitular,
            nif: f.nif,
            permilagem: f.permilagem,
            contactoEmail: f.contactoEmail,
            contactoTelefone: f.contactoTelefone,
            notas: f.notas,
            isentaElevador: f.isentaElevador,
            createdAt: paraData(f.createdAt),
          })),
        )
        .returning({ id: fracao.id })
      d.fracoes.forEach((f, i) => mapaFracao.set(f.id, inseridas[i].id))
    }

    const mapaFornecedor = new Map<number, number>()
    if (d.fornecedores.length) {
      const inseridos = await tx
        .insert(fornecedor)
        .values(
          d.fornecedores.map((f) => ({
            condominioId,
            userId: f.userId,
            nome: f.nome,
            nif: f.nif,
            categoria: f.categoria,
            contactoEmail: f.contactoEmail,
            contactoTelefone: f.contactoTelefone,
            notas: f.notas,
            createdAt: paraData(f.createdAt),
          })),
        )
        .returning({ id: fornecedor.id })
      d.fornecedores.forEach((f, i) => mapaFornecedor.set(f.id, inseridos[i].id))
    }

    const mapaOrcamento = new Map<number, number>()
    if (d.orcamentos.length) {
      const inseridos = await tx
        .insert(orcamento)
        .values(
          d.orcamentos.map((o) => ({
            condominioId,
            userId: o.userId,
            ano: o.ano,
            valorAnual: o.valorAnual,
            valorAnualElevador: o.valorAnualElevador,
            notas: o.notas,
            createdAt: paraData(o.createdAt),
          })),
        )
        .returning({ id: orcamento.id })
      d.orcamentos.forEach((o, i) => mapaOrcamento.set(o.id, inseridos[i].id))
    }

    if (d.orcamentoRubricas.length) {
      await tx.insert(orcamentoRubrica).values(
        d.orcamentoRubricas.map((r) => ({
          orcamentoId: remapear(mapaOrcamento, r.orcamentoId),
          categoria: r.categoria,
          valorOrcamentado: r.valorOrcamentado,
          createdAt: paraData(r.createdAt),
        })),
      )
    }

    const mapaExercicio = new Map<number, number>()
    if (d.exercicios.length) {
      const inseridos = await tx
        .insert(exercicioFinanceiro)
        .values(
          d.exercicios.map((e) => ({
            condominioId,
            designacao: e.designacao,
            anoPrincipal: e.anoPrincipal,
            dataInicio: paraData(e.dataInicio),
            dataFim: paraData(e.dataFim),
            estado: e.estado,
            fechadoEm: paraDataOuNula(e.fechadoEm),
            fechadoPorUserId: e.fechadoPorUserId,
            createdAt: paraData(e.createdAt),
            updatedAt: paraData(e.updatedAt),
          })),
        )
        .returning({ id: exercicioFinanceiro.id })
      d.exercicios.forEach((e, i) => mapaExercicio.set(e.id, inseridos[i].id))
    }

    const mapaConta = new Map<number, number>()
    if (d.contas.length) {
      const inseridas = await tx
        .insert(contaFinanceira)
        .values(
          d.contas.map((c2) => ({
            condominioId,
            nome: c2.nome,
            banco: c2.banco,
            iban: c2.iban,
            tipo: c2.tipo,
            moeda: c2.moeda,
            estado: c2.estado,
            dataAbertura: paraDataOuNula(c2.dataAbertura),
            dataEncerramento: paraDataOuNula(c2.dataEncerramento),
            notaTransitoria: c2.notaTransitoria,
            createdAt: paraData(c2.createdAt),
            updatedAt: paraData(c2.updatedAt),
          })),
        )
        .returning({ id: contaFinanceira.id })
      d.contas.forEach((c2, i) => mapaConta.set(c2.id, inseridas[i].id))
    }

    if (d.saldosIniciais.length) {
      await tx.insert(saldoInicialConta).values(
        d.saldosIniciais.map((s) => ({
          condominioId,
          contaFinanceiraId: remapear(mapaConta, s.contaFinanceiraId),
          exercicioId: remapear(mapaExercicio, s.exercicioId),
          valor: s.valor,
          origem: s.origem,
          definidoPorUserId: s.definidoPorUserId,
          createdAt: paraData(s.createdAt),
          updatedAt: paraData(s.updatedAt),
        })),
      )
    }

    const mapaAssembleia = new Map<number, number>()
    if (d.assembleias.length) {
      const inseridas = await tx
        .insert(assembleia)
        .values(
          d.assembleias.map((a) => ({
            condominioId,
            userId: a.userId,
            tipo: a.tipo,
            local: a.local,
            dataPrimeiraConvocatoria: paraData(a.dataPrimeiraConvocatoria),
            dataSegundaConvocatoria: paraDataOuNula(a.dataSegundaConvocatoria),
            estado: a.estado,
            textoAta: a.textoAta,
            // Número do livro de atas: facto histórico, preservado tal como
            // foi atribuído no condomínio de origem (sem risco de colisão —
            // a unicidade é por condominioId, e este é sempre novo).
            numero: a.numero,
            createdAt: paraData(a.createdAt),
          })),
        )
        .returning({ id: assembleia.id })
      d.assembleias.forEach((a, i) => mapaAssembleia.set(a.id, inseridas[i].id))
    }

    const mapaPonto = new Map<number, number>()
    if (d.assembleiaPontos.length) {
      const inseridos = await tx
        .insert(assembleiaPonto)
        .values(
          d.assembleiaPontos.map((p) => ({
            assembleiaId: remapear(mapaAssembleia, p.assembleiaId),
            ordem: p.ordem,
            titulo: p.titulo,
            descricao: p.descricao,
            exigeUnanimidade: p.exigeUnanimidade,
            resultado: p.resultado,
            createdAt: paraData(p.createdAt),
          })),
        )
        .returning({ id: assembleiaPonto.id })
      d.assembleiaPontos.forEach((p, i) => mapaPonto.set(p.id, inseridos[i].id))
    }

    if (d.assembleiaPresencas.length) {
      await tx.insert(assembleiaPresenca).values(
        d.assembleiaPresencas.map((p) => ({
          assembleiaId: remapear(mapaAssembleia, p.assembleiaId),
          fracaoId: remapear(mapaFracao, p.fracaoId),
          tipo: p.tipo,
          representante: p.representante,
          createdAt: paraData(p.createdAt),
        })),
      )
    }

    if (d.assembleiaVotos.length) {
      await tx.insert(assembleiaVoto).values(
        d.assembleiaVotos.map((v) => ({
          pontoId: remapear(mapaPonto, v.pontoId),
          fracaoId: remapear(mapaFracao, v.fracaoId),
          voto: v.voto,
          createdAt: paraData(v.createdAt),
        })),
      )
    }

    // Nota: NÃO chama garantirExercicioAberto() aqui, ao contrário de toda a
    // outra escrita em `movimento` na aplicação — deliberado, não esquecido.
    // Essa guarda existe para impedir alterar retroativamente um exercício
    // já fechado de um condomínio EM USO; aqui está a reconstituir-se, de
    // raiz, o histórico completo de um condomínio novo a partir de um
    // ficheiro de exportação — os próprios exercícios fechados fazem parte
    // desse histórico e têm de poder ser recriados tal como estavam.
    // Bloquear isto tornaria impossível importar qualquer condomínio com
    // mais de um exercício encerrado.
    const mapaMovimento = new Map<number, number>()
    if (d.movimentos.length) {
      const inseridos = await tx
        .insert(movimento)
        .values(
          d.movimentos.map((m) => ({
            condominioId,
            userId: m.userId,
            tipo: m.tipo,
            categoria: m.categoria,
            descricao: m.descricao,
            valor: m.valor,
            fracaoId: remapearOpcional(mapaFracao, m.fracaoId),
            data: paraData(m.data),
            pago: m.pago,
            meioPagamento: m.meioPagamento,
            referenciaMb: m.referenciaMb,
            dataLiquidacao: paraDataOuNula(m.dataLiquidacao),
            destino: m.destino,
            orcamentoId: remapearOpcional(mapaOrcamento, m.orcamentoId),
            fornecedorId: remapearOpcional(mapaFornecedor, m.fornecedorId),
            assembleiaPontoId: remapearOpcional(mapaPonto, m.assembleiaPontoId),
            exercicioId: remapearOpcional(mapaExercicio, m.exercicioId),
            contaFinanceiraId: remapearOpcional(mapaConta, m.contaFinanceiraId),
            createdAt: paraData(m.createdAt),
            deletedAt: paraDataOuNula(m.deletedAt),
          })),
        )
        .returning({ id: movimento.id })
      d.movimentos.forEach((m, i) => mapaMovimento.set(m.id, inseridos[i].id))
    }

    if (d.extratos.length) {
      await tx.insert(extratoBancario).values(
        d.extratos.map((e) => ({
          condominioId,
          userId: e.userId,
          data: paraData(e.data),
          descricao: e.descricao,
          valor: e.valor,
          conciliadoMovimentoId: remapearOpcional(mapaMovimento, e.conciliadoMovimentoId),
          ignorado: e.ignorado,
          contaFinanceiraId: remapearOpcional(mapaConta, e.contaFinanceiraId),
          createdAt: paraData(e.createdAt),
        })),
      )
    }

    const mapaDocFornecedor = new Map<number, number>()
    if (d.documentosFornecedor.length) {
      const inseridos = await tx
        .insert(documentoFornecedor)
        .values(
          d.documentosFornecedor.map((doc) => ({
            condominioId,
            userId: doc.userId,
            fornecedorId: remapearOpcional(mapaFornecedor, doc.fornecedorId),
            // numeroLancamento: sequência técnica própria (serial global, não
            // por condomínio) — deixa-se o Postgres atribuir uma nova, tal
            // como em qualquer documento criado normalmente, para nunca
            // colidir com números já usados por outro condomínio.
            numeroDocumento: doc.numeroDocumento,
            categoria: doc.categoria,
            dataEmissao: paraData(doc.dataEmissao),
            dataVencimento: paraDataOuNula(doc.dataVencimento),
            valor: doc.valor,
            anexoUrl: doc.anexoUrl,
            anexoNomeFicheiro: doc.anexoNomeFicheiro,
            createdAt: paraData(doc.createdAt),
            deletedAt: paraDataOuNula(doc.deletedAt),
          })),
        )
        .returning({ id: documentoFornecedor.id })
      d.documentosFornecedor.forEach((doc, i) => mapaDocFornecedor.set(doc.id, inseridos[i].id))
    }

    if (d.pagamentosDocumentoFornecedor.length) {
      await tx.insert(pagamentoDocumentoFornecedor).values(
        d.pagamentosDocumentoFornecedor.map((p) => ({
          condominioId,
          documentoFornecedorId: remapear(mapaDocFornecedor, p.documentoFornecedorId),
          valor: p.valor,
          dataPagamento: paraData(p.dataPagamento),
          movimentoId: remapearOpcional(mapaMovimento, p.movimentoId),
          userId: p.userId,
          createdAt: paraData(p.createdAt),
        })),
      )
    }

    const mapaSeguro = new Map<number, number>()
    if (d.seguros.length) {
      const inseridos = await tx
        .insert(seguro)
        .values(
          d.seguros.map((s) => ({
            condominioId,
            userId: s.userId,
            seguradora: s.seguradora,
            apolice: s.apolice,
            tipo: s.tipo,
            dataInicio: paraData(s.dataInicio),
            dataFim: paraData(s.dataFim),
            valorPremio: s.valorPremio,
            capitalSeguro: s.capitalSeguro,
            notas: s.notas,
            anexoUrl: s.anexoUrl,
            anexoNomeFicheiro: s.anexoNomeFicheiro,
            createdAt: paraData(s.createdAt),
            deletedAt: paraDataOuNula(s.deletedAt),
          })),
        )
        .returning({ id: seguro.id })
      d.seguros.forEach((s, i) => mapaSeguro.set(s.id, inseridos[i].id))
    }

    if (d.seguroFracoes.length) {
      await tx.insert(seguroFracao).values(
        d.seguroFracoes.map((sf) => ({
          seguroId: remapear(mapaSeguro, sf.seguroId),
          fracaoId: remapear(mapaFracao, sf.fracaoId),
          createdAt: paraData(sf.createdAt),
        })),
      )
    }

    if (d.avisos.length) {
      await tx.insert(aviso).values(
        d.avisos.map((a) => ({
          condominioId,
          userId: a.userId,
          autorNome: a.autorNome,
          titulo: a.titulo,
          conteudo: a.conteudo,
          prioridade: a.prioridade,
          createdAt: paraData(a.createdAt),
          deletedAt: paraDataOuNula(a.deletedAt),
        })),
      )
    }

    if (d.ocorrencias.length) {
      await tx.insert(ocorrencia).values(
        d.ocorrencias.map((o) => ({
          condominioId,
          userId: o.userId,
          reporterNome: o.reporterNome,
          titulo: o.titulo,
          descricao: o.descricao,
          local: o.local,
          categoria: o.categoria,
          estado: o.estado,
          prioridade: o.prioridade,
          fotoUrl: o.fotoUrl,
          fotoNomeFicheiro: o.fotoNomeFicheiro,
          createdAt: paraData(o.createdAt),
          updatedAt: paraData(o.updatedAt),
          deletedAt: paraDataOuNula(o.deletedAt),
        })),
      )
    }

    if (d.documentos.length) {
      await tx.insert(documento).values(
        d.documentos.map((doc) => ({
          condominioId,
          userId: doc.userId,
          titulo: doc.titulo,
          categoria: doc.categoria,
          descricao: doc.descricao,
          url: doc.url,
          nomeFicheiro: doc.nomeFicheiro,
          createdAt: paraData(doc.createdAt),
          deletedAt: paraDataOuNula(doc.deletedAt),
        })),
      )
    }

    const [m] = await tx
      .insert(membro)
      .values({
        condominioId,
        userId: session.user.id,
        nome: session.user.name || session.user.email,
        email: session.user.email,
        perfil: 'admin',
        estado: 'aprovado',
      })
      .returning()

    return m
  })

  const actor: MembroSessao = {
    id: novoMembro.id,
    condominioId: novoMembro.condominioId,
    userId: novoMembro.userId,
    nome: novoMembro.nome,
    email: novoMembro.email,
    perfil: 'admin',
    estado: 'aprovado',
    fracaoId: novoMembro.fracaoId,
    isSuperAdmin: false,
    isOperadorPlataforma: false,
    condominioSuspenso: false,
  }
  await registarAuditoria({
    actor,
    acao: 'criar',
    entidade: 'condominio',
    entidadeId: novoMembro.condominioId,
    detalhes: exportacao.exportadoEm
      ? `Condomínio criado a partir de um ficheiro de importação (exportado em ${exportacao.exportadoEm})`
      : 'Condomínio criado a partir de um ficheiro de importação',
  })

  revalidatePath('/')
}
