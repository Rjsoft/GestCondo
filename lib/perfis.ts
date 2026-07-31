// Tipos e lógica pura de papéis/permissões — sem NENHUMA dependência de
// base de dados ou do better-auth, para poder ser importado tanto em
// Server Components/actions como em Client Components (ex.
// components/app-shell.tsx, components/condominos/perfil-select.tsx).
// `lib/session.ts` importa e reexporta tudo isto para o código de
// servidor; código cliente deve importar diretamente daqui.

/**
 * Papéis de um `membro` dentro de UM condomínio (ver lib/db/schema.ts):
 * - admin: administrador do condomínio (eleito em assembleia ou residente).
 * - gestor: empresa de administração profissional. Tem dois níveis
 *   (`MembroSessao.nivelGestor`, achado F03): "completo" (mesmos poderes
 *   que "admin" nesse condomínio) ou "operacional" (só as ações listadas
 *   em `temPermissaoOperacional` abaixo — lançar despesas, carregar
 *   documentos, tratar ocorrências; sem acesso a condóminos, fornecedores,
 *   frações, assembleias nem dados do condomínio). Novo `membro` com
 *   `perfil='gestor'` nasce "completo" por omissão.
 * - condomino: proprietário de uma fração.
 * - inquilino: arrendatário — sem acesso a dados financeiros/patrimoniais.
 * - fornecedor: prestador de serviço externo — acesso mínimo hoje; o fluxo
 *   de atribuição de ocorrências/orçamentos a um fornecedor é trabalho
 *   futuro (ver FUNCTIONAL_GAPS.md).
 * - auditor: consulta total (vê tudo o que admin/gestor veem), zero poder
 *   de escrita.
 *
 * "Super Admin" (`user.superAdmin`) é ortogonal a este enum: é um operador
 * da plataforma, não um papel dentro de um condomínio específico. Ver
 * `MembroSessao.isSuperAdmin` abaixo.
 */
export type Perfil =
  | 'admin'
  | 'gestor'
  | 'condomino'
  | 'inquilino'
  | 'fornecedor'
  | 'auditor'

export const PERFIS: Perfil[] = [
  'admin',
  'gestor',
  'condomino',
  'inquilino',
  'fornecedor',
  'auditor',
]

export const PERFIL_LABEL: Record<Perfil, string> = {
  admin: 'Administrador',
  gestor: 'Empresa gestora',
  condomino: 'Condómino',
  inquilino: 'Inquilino',
  fornecedor: 'Fornecedor',
  auditor: 'Auditor',
}

/** Só relevante para `perfil: 'gestor'` — ver comentário em `Perfil` acima. */
export type NivelGestor = 'completo' | 'operacional'

export const NIVEIS_GESTOR: NivelGestor[] = ['completo', 'operacional']

export const NIVEL_GESTOR_LABEL: Record<NivelGestor, string> = {
  completo: 'Completo',
  operacional: 'Operacional (só despesas, documentos e ocorrências)',
}

// Administram o condomínio (podem escrever em qualquer módulo). Exportado
// para reutilização na UI (ex. visibilidade de itens de navegação).
export const PERFIS_GESTAO: Perfil[] = ['admin', 'gestor']
// Podem consultar dados de gestão (ex. lista de condóminos) sem poder
// escrever — inclui os que gerem mais o auditor.
export const PERFIS_CONSULTA_GESTAO: Perfil[] = ['admin', 'gestor', 'auditor']
// Podem ver dados financeiros/patrimoniais (movimentos, frações). Exclui
// inquilino e fornecedor, que não têm responsabilidade sobre quotas.
export const PERFIS_ACESSO_FINANCEIRO: Perfil[] = [
  'admin',
  'gestor',
  'condomino',
  'auditor',
]

export type EstadoMembro = 'pendente' | 'aprovado'

export type MembroSessao = {
  id: number
  condominioId: number
  userId: string
  nome: string
  email: string
  perfil: Perfil
  /** Só relevante quando `perfil === 'gestor'` (achado F03) — ver `Perfil`. */
  nivelGestor: NivelGestor
  estado: EstadoMembro
  /** Fração de que este membro é proprietário (perfil condomino) ou
   * arrendatário (perfil inquilino). `null` se ainda não associado. */
  fracaoId: number | null
  /** Ficha de fornecedor (tabela `fornecedor`) que este login representa,
   * quando `perfil: 'fornecedor'`. `null` até o admin associar — sem isto,
   * o portal do fornecedor (ocorrências/orçamentos atribuídos) fica vazio. */
  fornecedorId: number | null
  /** Super Admin (empresa gestora multi-condomínio, futuro) — ver comentário acima de `Perfil`. */
  isSuperAdmin: boolean
  /** Operador da plataforma (RJCSI) — controla /plataforma e a subscrição
   * de qualquer condomínio. Distinto de `isSuperAdmin`, ver lib/db/schema.ts. */
  isOperadorPlataforma: boolean
  /** Estado de subscrição do condomínio deste membro — "suspenso" bloqueia
   * o acesso (ver requireMembroAprovado/requireAdmin), exceto para
   * isOperadorPlataforma. */
  condominioSuspenso: boolean
}

/** Tem poderes de administração COMPLETA do condomínio (admin, gestor de
 * nível "completo", ou super admin) — achado F03: exclui deliberadamente
 * um gestor de nível "operacional", que só tem os poderes mais restritos
 * de `temPermissaoOperacional` abaixo. */
export function temPermissaoGestao(m: MembroSessao): boolean {
  if (m.isSuperAdmin) return true
  if (m.perfil === 'admin') return true
  return m.perfil === 'gestor' && m.nivelGestor === 'completo'
}

/** Tem poderes operacionais (achado F03, docs/audit/USABILITY_FINDINGS.md):
 * administração completa, OU um gestor de nível "operacional" — usar só
 * nas poucas ações que um colaborador júnior deve poder fazer sozinho
 * (lançar/editar despesas, marcar como pago, carregar documentos, tratar
 * ocorrências). Nunca usar para condóminos, fornecedores, frações,
 * assembleias, dados do condomínio, permissões ou eliminações — isso
 * continua a exigir `temPermissaoGestao`. */
export function temPermissaoOperacional(m: MembroSessao): boolean {
  return m.isSuperAdmin || PERFIS_GESTAO.includes(m.perfil)
}

/** Pode consultar dados de gestão (admin, gestor, auditor, ou super admin). */
export function temConsultaGestao(m: MembroSessao): boolean {
  return m.isSuperAdmin || PERFIS_CONSULTA_GESTAO.includes(m.perfil)
}

/** Pode ver dados financeiros/patrimoniais do condomínio. */
export function temAcessoFinanceiro(m: MembroSessao): boolean {
  return m.isSuperAdmin || PERFIS_ACESSO_FINANCEIRO.includes(m.perfil)
}

/** Auditor tem acesso de consulta apenas — nunca pode escrever. */
export function podeEscrever(m: MembroSessao): boolean {
  return m.isSuperAdmin || m.perfil !== 'auditor'
}
