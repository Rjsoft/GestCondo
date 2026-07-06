// Tipos e lógica pura de papéis/permissões — sem NENHUMA dependência de
// base de dados ou do better-auth, para poder ser importado tanto em
// Server Components/actions como em Client Components (ex.
// components/app-shell.tsx, components/condominos/perfil-select.tsx).
// `lib/session.ts` importa e reexporta tudo isto para o código de
// servidor; código cliente deve importar diretamente daqui.

/**
 * Papéis de um `membro` dentro de UM condomínio (ver lib/db/schema.ts):
 * - admin: administrador do condomínio (eleito em assembleia ou residente).
 * - gestor: empresa de administração profissional — mesmos poderes que
 *   "admin" nesse condomínio; distinto apenas para efeitos de rótulo e
 *   relatórios (a mesma empresa pode ser "gestor" em vários condomínios).
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
  estado: EstadoMembro
  fracao: string | null
  /** Operador da plataforma — ver comentário acima de `Perfil`. */
  isSuperAdmin: boolean
}

/** Tem poderes de administração do condomínio (admin, gestor, ou super admin). */
export function temPermissaoGestao(m: MembroSessao): boolean {
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
