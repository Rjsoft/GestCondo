'use server'

import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import {
  acessoConvidado,
  assembleia,
  assembleiaPonto,
  assembleiaPresenca,
  assembleiaVoto,
  condominio,
  fracao,
} from '@/lib/db/schema'
import { registarAuditoria } from '@/lib/audit'
import { requireAdmin } from '@/lib/session'
import { getTotalPermilagem } from '@/app/actions/assembleias'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

function gerarToken() {
  return randomBytes(24).toString('base64url')
}

/** Cria um link de acesso convidado a UMA ata já aprovada — achado F13.
 * Nunca permitido para uma ata em rascunho (o conteúdo ainda pode mudar). */
export async function criarAcessoConvidado(assembleiaId: number, formData: FormData) {
  const admin = await requireAdmin()

  const [a] = await db
    .select()
    .from(assembleia)
    .where(and(eq(assembleia.id, assembleiaId), eq(assembleia.condominioId, admin.condominioId)))
    .limit(1)
  if (!a) throw new Error('Assembleia não encontrada')
  if (a.estado !== 'aprovada') {
    throw new Error('Só é possível partilhar a ata depois de aprovada.')
  }

  const descricao = String(formData.get('descricao') || '').trim()
  const diasValidade = Math.min(90, Math.max(1, Number(formData.get('diasValidade')) || 30))
  const expiraEm = new Date(Date.now() + diasValidade * 24 * 60 * 60 * 1000)
  const token = gerarToken()

  await db.insert(acessoConvidado).values({
    condominioId: admin.condominioId,
    assembleiaId,
    criadoPorUserId: admin.userId,
    token,
    descricao: descricao || null,
    expiraEm,
  })

  await registarAuditoria({
    actor: admin,
    acao: 'criar',
    entidade: 'acessoConvidado',
    entidadeId: assembleiaId,
    detalhes: `Link de acesso convidado criado para a ata${descricao ? ` (${descricao})` : ''}, válido até ${expiraEm.toLocaleDateString('pt-PT')}`,
  })

  revalidatePath(`/assembleias/ata/${assembleiaId}`)
  return token
}

export async function getAcessosConvidadoDaAssembleia(assembleiaId: number) {
  const admin = await requireAdmin()
  const [a] = await db
    .select({ id: assembleia.id })
    .from(assembleia)
    .where(and(eq(assembleia.id, assembleiaId), eq(assembleia.condominioId, admin.condominioId)))
    .limit(1)
  if (!a) throw new Error('Assembleia não encontrada')

  return db
    .select()
    .from(acessoConvidado)
    .where(eq(acessoConvidado.assembleiaId, assembleiaId))
    .orderBy(desc(acessoConvidado.createdAt))
}

export async function revogarAcessoConvidado(id: number) {
  const admin = await requireAdmin()
  const [acesso] = await db
    .select()
    .from(acessoConvidado)
    .where(and(eq(acessoConvidado.id, id), eq(acessoConvidado.condominioId, admin.condominioId)))
    .limit(1)
  if (!acesso) throw new Error('Acesso não encontrado')

  await db.update(acessoConvidado).set({ revogadoEm: new Date() }).where(eq(acessoConvidado.id, id))

  await registarAuditoria({
    actor: admin,
    acao: 'atualizar',
    entidade: 'acessoConvidado',
    entidadeId: acesso.assembleiaId,
    detalhes: `Link de acesso convidado revogado${acesso.descricao ? ` (${acesso.descricao})` : ''}`,
  })

  revalidatePath(`/assembleias/ata/${acesso.assembleiaId}`)
}

/** Rota pública /partilha/[token] — sem sessão, sem requireX. Devolve
 * `null` para qualquer combinação de token inválido, revogado, expirado ou
 * ata que entretanto deixou de estar aprovada, sem distinguir a razão (não
 * dar pistas a quem tentar adivinhar tokens por tentativa e erro). */
export async function getAtaPorToken(token: string) {
  if (!token) return null

  const [acesso] = await db
    .select()
    .from(acessoConvidado)
    .where(eq(acessoConvidado.token, token))
    .limit(1)
  if (!acesso) return null
  if (acesso.revogadoEm) return null
  if (acesso.expiraEm.getTime() < Date.now()) return null

  const [a] = await db.select().from(assembleia).where(eq(assembleia.id, acesso.assembleiaId)).limit(1)
  if (!a || a.estado !== 'aprovada') return null

  const [condo] = await db.select().from(condominio).where(eq(condominio.id, acesso.condominioId)).limit(1)
  if (!condo) return null

  const pontos = await db
    .select()
    .from(assembleiaPonto)
    .where(eq(assembleiaPonto.assembleiaId, a.id))
    .orderBy(asc(assembleiaPonto.ordem))
  const pontoIds = pontos.map((p) => p.id)

  const [presencas, votos, fracoes] = await Promise.all([
    db.select().from(assembleiaPresenca).where(eq(assembleiaPresenca.assembleiaId, a.id)),
    pontoIds.length
      ? db.select().from(assembleiaVoto).where(inArray(assembleiaVoto.pontoId, pontoIds))
      : Promise.resolve([]),
    db.select().from(fracao).where(eq(fracao.condominioId, acesso.condominioId)),
  ])
  const totalPermilagem = await getTotalPermilagem(acesso.condominioId)

  const fracaoPorId = new Map(fracoes.map((f) => [f.id, f]))
  const presencasComFracao = presencas.map((p) => ({
    ...p,
    identificacao: fracaoPorId.get(p.fracaoId)?.identificacao ?? '—',
    permilagem: Number(fracaoPorId.get(p.fracaoId)?.permilagem ?? 0),
  }))
  const permilagemPresente = presencasComFracao.reduce((s, p) => s + p.permilagem, 0)

  const pontosComVotos = pontos.map((p) => {
    const votosDoPonto = votos.filter((v) => v.pontoId === p.id)
    const somaPermilagem = (voto: string) =>
      votosDoPonto
        .filter((v) => v.voto === voto)
        .reduce((s, v) => s + Number(fracaoPorId.get(v.fracaoId)?.permilagem ?? 0), 0)
    return {
      ...p,
      permilagemFavor: somaPermilagem('favor'),
      permilagemContra: somaPermilagem('contra'),
      permilagemAbstencao: somaPermilagem('abstencao'),
    }
  })

  await db
    .update(acessoConvidado)
    .set({ numeroAcessos: acesso.numeroAcessos + 1, ultimoAcessoEm: new Date() })
    .where(eq(acessoConvidado.id, acesso.id))

  return {
    condominio: condo,
    assembleia: a,
    pontos: pontosComVotos,
    presencas: presencasComFracao,
    totalPermilagem,
    permilagemPresente,
  }
}
