'use server'

import { db } from '@/lib/db'
import {
  assembleia,
  assembleiaPonto,
  assembleiaPresenca,
  assembleiaVoto,
  fracao,
  membro,
} from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { requireAdmin, requireMembroAprovado } from '@/lib/session'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const ESTADOS_EDITAVEIS = ['convocada', 'realizada']

// Uma assembleia "aprovada" (ata fechada) ou "cancelada" já não pode ser
// alterada em nenhuma das suas tabelas associadas (pontos, presenças,
// votos) — é a garantia de imutabilidade da ata depois de aprovada.
function assertEditavel(estado: string) {
  if (!ESTADOS_EDITAVEIS.includes(estado)) {
    throw new Error('Esta assembleia já está encerrada; não pode ser alterada')
  }
}

async function getAssembleiaOuFalhar(id: number, condominioId: number) {
  const [a] = await db
    .select()
    .from(assembleia)
    .where(and(eq(assembleia.id, id), eq(assembleia.condominioId, condominioId)))
    .limit(1)
  if (!a) throw new Error('Assembleia não encontrada')
  return a
}

export async function getAssembleias() {
  const m = await requireMembroAprovado()
  return db
    .select()
    .from(assembleia)
    .where(eq(assembleia.condominioId, m.condominioId))
    .orderBy(desc(assembleia.dataPrimeiraConvocatoria))
}

/**
 * Soma da permilagem de todas as frações do condomínio — base para o
 * cálculo de quórum (permilagem presente / total).
 */
export async function getTotalPermilagem(condominioId: number) {
  const fracoes = await db
    .select({ permilagem: fracao.permilagem })
    .from(fracao)
    .where(eq(fracao.condominioId, condominioId))
  return fracoes.reduce((s, f) => s + Number(f.permilagem), 0)
}

/**
 * Detalhe completo de uma assembleia: ordem de trabalhos (com votos e
 * somas de permilagem por opção), presenças/procurações (com permilagem) e
 * o quórum (permilagem presente vs. total do condomínio). A app calcula e
 * mostra estes números; não decide se uma maioria legal foi atingida — ver
 * nota em lib/db/schema.ts.
 */
export async function getAssembleiaDetalhe(id: number) {
  const m = await requireMembroAprovado()
  const [a] = await db
    .select()
    .from(assembleia)
    .where(and(eq(assembleia.id, id), eq(assembleia.condominioId, m.condominioId)))
    .limit(1)
  if (!a) return null

  const pontos = await db
    .select()
    .from(assembleiaPonto)
    .where(eq(assembleiaPonto.assembleiaId, id))
    .orderBy(asc(assembleiaPonto.ordem))
  const pontoIds = pontos.map((p) => p.id)

  const [presencas, votos, fracoes, totalPermilagem] = await Promise.all([
    db.select().from(assembleiaPresenca).where(eq(assembleiaPresenca.assembleiaId, id)),
    pontoIds.length
      ? db.select().from(assembleiaVoto).where(inArray(assembleiaVoto.pontoId, pontoIds))
      : Promise.resolve([]),
    db.select().from(fracao).where(eq(fracao.condominioId, m.condominioId)).orderBy(asc(fracao.identificacao)),
    getTotalPermilagem(m.condominioId),
  ])

  const fracaoPorId = new Map(fracoes.map((f) => [f.id, f]))

  const presencasComFracao = presencas.map((p) => ({
    ...p,
    identificacao: fracaoPorId.get(p.fracaoId)?.identificacao ?? '—',
    permilagem: Number(fracaoPorId.get(p.fracaoId)?.permilagem ?? 0),
  }))
  const permilagemPresente = presencasComFracao.reduce((s, p) => s + p.permilagem, 0)
  const fracoesComPresenca = new Set(presencas.map((p) => p.fracaoId))

  const pontosComVotos = pontos.map((p) => {
    const votosDoPonto = votos
      .filter((v) => v.pontoId === p.id)
      .map((v) => ({
        ...v,
        identificacao: fracaoPorId.get(v.fracaoId)?.identificacao ?? '—',
        permilagem: Number(fracaoPorId.get(v.fracaoId)?.permilagem ?? 0),
      }))
    const somaPermilagem = (voto: string) =>
      votosDoPonto.filter((v) => v.voto === voto).reduce((s, v) => s + v.permilagem, 0)
    return {
      ...p,
      votos: votosDoPonto,
      permilagemFavor: somaPermilagem('favor'),
      permilagemContra: somaPermilagem('contra'),
      permilagemAbstencao: somaPermilagem('abstencao'),
    }
  })

  return {
    assembleia: a,
    pontos: pontosComVotos,
    presencas: presencasComFracao,
    fracoes: fracoes.map((f) => ({
      id: f.id,
      identificacao: f.identificacao,
      permilagem: Number(f.permilagem),
      temPresenca: fracoesComPresenca.has(f.id),
    })),
    totalPermilagem,
    permilagemPresente,
  }
}

export async function criarAssembleia(formData: FormData) {
  const admin = await requireAdmin()

  const tipo = String(formData.get('tipo') || 'ordinaria')
  const local = String(formData.get('local') || '').trim()
  const primeiraStr = String(formData.get('dataPrimeiraConvocatoria') || '')
  const segundaStr = String(formData.get('dataSegundaConvocatoria') || '').trim()

  if (!local) throw new Error('Indique o local da assembleia')
  if (!primeiraStr) throw new Error('Indique a data/hora da primeira convocatória')
  if (tipo !== 'ordinaria' && tipo !== 'extraordinaria') throw new Error('Tipo inválido')

  const dataPrimeira = new Date(primeiraStr)
  const dataSegunda = segundaStr ? new Date(segundaStr) : null

  // A 2ª convocatória tem de ser marcada para um dia distinto da 1ª (Código
  // Civil art. 1432º/6-7) — não basta "meia hora depois" no mesmo dia, por
  // mais que os condóminos presentes concordem (achado LEGAL-03 da
  // auditoria jurídica 2026-07-22, ver docs/legal/MEETINGS_AND_VOTING_MATRIX.md).
  if (dataSegunda && dataPrimeira.toDateString() === dataSegunda.toDateString()) {
    throw new Error(
      'A 2ª convocatória tem de ser marcada para um dia diferente da 1ª (art. 1432º do Código Civil)',
    )
  }

  const [nova] = await db
    .insert(assembleia)
    .values({
      condominioId: admin.condominioId,
      userId: admin.userId,
      tipo,
      local,
      dataPrimeiraConvocatoria: dataPrimeira,
      dataSegundaConvocatoria: dataSegunda,
    })
    .returning({ id: assembleia.id })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'assembleia',
    entidadeId: nova.id,
    detalhes: `${tipo === 'ordinaria' ? 'Ordinária' : 'Extraordinária'} em ${local}`,
  })

  // Notifica todos os membros aprovados do condomínio por email — a
  // convocatória é o único item da ordem de trabalhos que já existe neste
  // momento (os pontos são adicionados depois, ver adicionarPonto).
  const membrosAprovados = await db
    .select({ email: membro.email })
    .from(membro)
    .where(and(eq(membro.condominioId, admin.condominioId), eq(membro.estado, 'aprovado')))

  const dataFormatada = new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(primeiraStr))

  await Promise.all(
    membrosAprovados.map((mb) =>
      sendEmail({
        to: mb.email,
        subject: 'Convocatória de Assembleia',
        html: `<p>Foi convocada uma assembleia ${tipo === 'ordinaria' ? 'ordinária' : 'extraordinária'} para <strong>${dataFormatada}</strong>, em ${local}.</p><p>Consulte a ordem de trabalhos na aplicação GestCondo.</p>`,
      }),
    ),
  )

  revalidatePath('/assembleias')
  revalidatePath('/')
}

export async function adicionarPonto(assembleiaId: number, formData: FormData) {
  const admin = await requireAdmin()
  const a = await getAssembleiaOuFalhar(assembleiaId, admin.condominioId)
  assertEditavel(a.estado)

  const titulo = String(formData.get('titulo') || '').trim()
  const descricao = String(formData.get('descricao') || '').trim()
  if (!titulo) throw new Error('Indique o título do ponto')

  const existentes = await db
    .select({ id: assembleiaPonto.id })
    .from(assembleiaPonto)
    .where(eq(assembleiaPonto.assembleiaId, assembleiaId))

  await db.insert(assembleiaPonto).values({
    assembleiaId,
    ordem: existentes.length + 1,
    titulo,
    descricao: descricao || null,
  })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'assembleia',
    entidadeId: assembleiaId,
    detalhes: `Ponto adicionado à ordem de trabalhos: ${titulo}`,
  })

  revalidatePath(`/assembleias/${assembleiaId}`)
}

export async function registarPresenca(assembleiaId: number, formData: FormData) {
  const admin = await requireAdmin()
  const a = await getAssembleiaOuFalhar(assembleiaId, admin.condominioId)
  assertEditavel(a.estado)

  const fracaoId = Number(formData.get('fracaoId') || 0)
  const tipo = String(formData.get('tipo') || 'presencial')
  const representante = String(formData.get('representante') || '').trim()

  if (!fracaoId) throw new Error('Selecione a fração')
  if (tipo !== 'presencial' && tipo !== 'procuracao') {
    throw new Error('Tipo de presença inválido')
  }

  const [f] = await db
    .select({ id: fracao.id })
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, admin.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração inválida')

  await db
    .insert(assembleiaPresenca)
    .values({ assembleiaId, fracaoId, tipo, representante: representante || null })
    .onConflictDoUpdate({
      target: [assembleiaPresenca.assembleiaId, assembleiaPresenca.fracaoId],
      set: { tipo, representante: representante || null },
    })

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'assembleia',
    entidadeId: assembleiaId,
    detalhes: `Presença registada para a fração #${fracaoId}`,
  })

  revalidatePath(`/assembleias/${assembleiaId}`)
}

export async function registarVoto(pontoId: number, formData: FormData) {
  const admin = await requireAdmin()

  const [ponto] = await db
    .select()
    .from(assembleiaPonto)
    .where(eq(assembleiaPonto.id, pontoId))
    .limit(1)
  if (!ponto) throw new Error('Ponto não encontrado')
  const a = await getAssembleiaOuFalhar(ponto.assembleiaId, admin.condominioId)
  assertEditavel(a.estado)

  const fracaoId = Number(formData.get('fracaoId') || 0)
  const voto = String(formData.get('voto') || '')

  if (!fracaoId) throw new Error('Selecione a fração')
  if (!['favor', 'contra', 'abstencao'].includes(voto)) {
    throw new Error('Voto inválido')
  }

  const [f] = await db
    .select({ id: fracao.id })
    .from(fracao)
    .where(and(eq(fracao.id, fracaoId), eq(fracao.condominioId, admin.condominioId)))
    .limit(1)
  if (!f) throw new Error('Fração inválida')

  await db
    .insert(assembleiaVoto)
    .values({ pontoId, fracaoId, voto })
    .onConflictDoUpdate({
      target: [assembleiaVoto.pontoId, assembleiaVoto.fracaoId],
      set: { voto },
    })

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'assembleia',
    entidadeId: a.id,
    detalhes: `Voto registado no ponto "${ponto.titulo}" pela fração #${fracaoId}: ${voto}`,
  })

  revalidatePath(`/assembleias/${a.id}`)
}

export async function definirResultadoPonto(pontoId: number, resultado: string) {
  const admin = await requireAdmin()
  if (!['aprovado', 'reprovado', 'adiado'].includes(resultado)) {
    throw new Error('Resultado inválido')
  }

  const [ponto] = await db
    .select()
    .from(assembleiaPonto)
    .where(eq(assembleiaPonto.id, pontoId))
    .limit(1)
  if (!ponto) throw new Error('Ponto não encontrado')
  const a = await getAssembleiaOuFalhar(ponto.assembleiaId, admin.condominioId)
  assertEditavel(a.estado)

  await db.update(assembleiaPonto).set({ resultado }).where(eq(assembleiaPonto.id, pontoId))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'assembleia',
    entidadeId: a.id,
    detalhes: `Deliberação do ponto "${ponto.titulo}": ${resultado}`,
  })

  revalidatePath(`/assembleias/${a.id}`)
}

export async function marcarRealizada(assembleiaId: number) {
  const admin = await requireAdmin()
  const a = await getAssembleiaOuFalhar(assembleiaId, admin.condominioId)
  if (a.estado !== 'convocada') {
    throw new Error('Só é possível marcar como realizada uma assembleia convocada')
  }

  await db.update(assembleia).set({ estado: 'realizada' }).where(eq(assembleia.id, assembleiaId))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'assembleia',
    entidadeId: assembleiaId,
    detalhes: 'Assembleia marcada como realizada',
  })

  revalidatePath(`/assembleias/${assembleiaId}`)
  revalidatePath('/assembleias')
}

export async function aprovarAta(assembleiaId: number, textoAta: string) {
  const admin = await requireAdmin()
  const a = await getAssembleiaOuFalhar(assembleiaId, admin.condominioId)
  if (a.estado !== 'realizada') {
    throw new Error('A assembleia tem de estar marcada como realizada antes de aprovar a ata')
  }

  await db
    .update(assembleia)
    .set({ estado: 'aprovada', textoAta: textoAta.trim() || null })
    .where(eq(assembleia.id, assembleiaId))

  await registarAuditoria({
    actor: admin,
    acao: 'aprovar',
    entidade: 'assembleia',
    entidadeId: assembleiaId,
    detalhes: 'Ata aprovada — assembleia encerrada e imutável',
  })

  revalidatePath(`/assembleias/${assembleiaId}`)
  revalidatePath('/assembleias')
  revalidatePath(`/assembleias/ata/${assembleiaId}`)
}

export async function cancelarAssembleia(assembleiaId: number) {
  const admin = await requireAdmin()
  const a = await getAssembleiaOuFalhar(assembleiaId, admin.condominioId)
  if (a.estado !== 'convocada') {
    throw new Error('Só é possível cancelar uma assembleia ainda não realizada')
  }

  await db.update(assembleia).set({ estado: 'cancelada' }).where(eq(assembleia.id, assembleiaId))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'assembleia',
    entidadeId: assembleiaId,
    detalhes: 'Assembleia cancelada',
  })

  revalidatePath(`/assembleias/${assembleiaId}`)
  revalidatePath('/assembleias')
}
