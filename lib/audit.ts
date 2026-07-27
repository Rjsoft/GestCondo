import { db } from '@/lib/db'
import { auditLog, membro, user } from '@/lib/db/schema'
import type { MembroSessao } from '@/lib/perfis'
import { eq } from 'drizzle-orm'

export type AcaoAuditoria =
  | 'criar'
  | 'atualizar'
  | 'eliminar'
  | 'aprovar'
  | 'rejeitar'
  | 'login'
  | 'login_falhado'
  | 'pedido_reset_password'

export type EntidadeAuditoria =
  | 'movimento'
  | 'aviso'
  | 'documento'
  | 'fracao'
  | 'membro'
  | 'ocorrencia'
  | 'orcamento'
  | 'seguro'
  | 'assembleia'
  | 'extratoBancario'
  | 'condominio'
  | 'fornecedor'
  | 'exercicioFinanceiro'
  | 'contaFinanceira'
  | 'documentoFornecedor'
  | 'contactoEmergencia'
  | 'patrimonio'
  | 'mensagem'
  | 'orcamentoObra'

/** Um campo que mudou entre o estado anterior e o novo, para o histórico de
 * alterações mostrar "campo: de X para Y" em vez de só "algo mudou". */
export type CampoAlterado = { campo: string; label: string; antes: unknown; depois: unknown }

/** Normaliza um valor para comparação: números guardados como texto pela BD
 * (colunas `numeric`, ex. "100.00") não podem ser comparados como string
 * contra o valor tal como chega do formulário (ex. "100"), senão qualquer
 * edição sem mudança real de valor apareceria como uma alteração falsa. */
function normalizarParaComparar(valor: unknown): unknown {
  if (valor instanceof Date) return valor.getTime()
  if (valor == null) return null
  if (typeof valor === 'boolean') return valor
  if (typeof valor === 'number') return valor
  const texto = String(valor).trim()
  if (texto === '') return null
  const numero = Number(texto)
  return Number.isNaN(numero) ? texto : numero
}

/**
 * Compara campo a campo o estado antes/depois de uma entidade, devolvendo só
 * os que realmente mudaram. `labels` mapeia o nome técnico de cada campo
 * editável para um rótulo em português — só os campos presentes em `labels`
 * são comparados, o que evita ter de excluir explicitamente campos técnicos
 * (id, userId, timestamps, URLs de anexo) que nunca fazem sentido no diff.
 */
export function compararCampos<T extends Record<string, unknown>>(
  antes: T,
  depois: Partial<T>,
  labels: Partial<Record<keyof T, string>>,
): CampoAlterado[] {
  const alteracoes: CampoAlterado[] = []
  for (const campo of Object.keys(labels) as (keyof T)[]) {
    const label = labels[campo]
    if (!label) continue
    const valorAntes = antes[campo] ?? null
    const valorDepois = campo in depois ? (depois[campo] ?? null) : valorAntes
    if (normalizarParaComparar(valorAntes) !== normalizarParaComparar(valorDepois)) {
      alteracoes.push({ campo: String(campo), label, antes: valorAntes, depois: valorDepois })
    }
  }
  return alteracoes
}

/** Resumo automático em texto livre a partir do diff estruturado, usado como
 * `detalhes` (continua a ser o resumo curto e pesquisável em /auditoria). */
export function gerarResumoAlteracoes(alteracoes: CampoAlterado[]): string {
  return alteracoes.map((a) => a.label).join(', ')
}

/**
 * Escreve uma linha no registo de auditoria. Chamar depois de a operação na
 * BD ter sido concluída com sucesso, nunca antes. Nunca lança — uma falha a
 * registar auditoria não deve impedir a operação principal de ter sucesso,
 * mas é reportada na consola do servidor para não passar despercebida.
 */
export async function registarAuditoria(params: {
  actor: MembroSessao
  acao: AcaoAuditoria
  entidade: EntidadeAuditoria
  entidadeId: number
  detalhes?: string
  alteracoes?: CampoAlterado[]
}) {
  const { actor, acao, entidade, entidadeId, detalhes, alteracoes } = params
  try {
    await db.insert(auditLog).values({
      condominioId: actor.condominioId,
      actorUserId: actor.userId,
      actorNome: actor.nome,
      acao,
      entidade,
      entidadeId,
      detalhes,
      alteracoes,
    })
  } catch (e) {
    console.error('[audit] Falha ao registar auditoria:', e)
  }
}

const DETALHES_AUTENTICACAO: Record<'login' | 'login_falhado' | 'pedido_reset_password', string> = {
  login: 'Sessão iniciada',
  login_falhado: 'Tentativa de login com credenciais inválidas',
  pedido_reset_password: 'Pedido de reposição de palavra-passe',
}

/**
 * Regista login, falha de login ou pedido de reposição de password
 * (achado AUDIT-01 da auditoria jurídica — hoje só nos logs efémeros da
 * Vercel, sem retenção pesquisável). Chamado a partir do hook `after` do
 * better-auth (lib/auth.ts), fora do fluxo de uma sessão autenticada — por
 * isso recebe `userId` (login com sucesso, já sabemos quem é) OU `email`
 * (login falhado/pedido de reset, só temos o que foi escrito no
 * formulário), nunca um `MembroSessao` já resolvido.
 *
 * `audit_log.condominioId` é obrigatório (é um registo por condomínio,
 * não por conta) — por isso só é possível registar quando a conta já tem
 * pelo menos um `membro` associado a um condomínio. Tentativas contra um
 * email que não corresponde a nenhuma conta real não ficam registadas:
 * não há condomínio a que atribuir o evento, e não há nenhum acesso real
 * em risco (decisão deliberada, não uma omissão).
 */
export async function registarEventoAutenticacao(
  acao: 'login' | 'login_falhado' | 'pedido_reset_password',
  identificacao: { userId: string } | { email: string },
) {
  try {
    const linhas =
      'userId' in identificacao
        ? await db.select().from(membro).where(eq(membro.userId, identificacao.userId))
        : (
            await db
              .select({ membro })
              .from(membro)
              .innerJoin(user, eq(membro.userId, user.id))
              .where(eq(user.email, identificacao.email))
          ).map((linha) => linha.membro)

    for (const m of linhas) {
      await registarAuditoria({
        actor: {
          id: m.id,
          condominioId: m.condominioId,
          userId: m.userId,
          nome: m.nome,
          email: m.email,
          perfil: m.perfil as MembroSessao['perfil'],
          estado: m.estado as MembroSessao['estado'],
          fracaoId: m.fracaoId,
          isSuperAdmin: false,
          isOperadorPlataforma: false,
          condominioSuspenso: false,
        },
        acao,
        entidade: 'membro',
        entidadeId: m.id,
        detalhes: DETALHES_AUTENTICACAO[acao],
      })
    }
  } catch (e) {
    console.error('[audit] Falha ao registar evento de autenticação:', e)
  }
}
