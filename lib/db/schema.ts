import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  // Campo próprio da aplicação (não gerido pelo better-auth): identifica um
  // operador da plataforma ("Super Admin"), com acesso de gestão em
  // qualquer condomínio a que também pertença como `membro`. Não existe
  // ainda nenhuma UI para o ativar — é definido diretamente na base de
  // dados pelo operador da plataforma (ver lib/session.ts).
  superAdmin: boolean("superAdmin").notNull().default(false),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- Multi-tenant root -------------------------------------------------------
// Um `condominio` é um tenant isolado. TODAS as tabelas de dados abaixo têm
// `condominioId`, e TODAS as queries em app/actions/*.ts e nas páginas têm de
// filtrar por ele (ver lib/session.ts: MembroSessao.condominioId). Nunca
// fazer `db.select().from(x)`/`update`/`delete` numa tabela desta lista sem
// esse filtro — é precisamente essa omissão que causaria fuga de dados entre
// condomínios diferentes (ver SECURITY_AUDIT.md S9).
//
// NOTA IMPORTANTE (2026-07-06): ainda não existe nenhum fluxo de convite ou
// de criação de um segundo condomínio pela UI — `getMembroAtual` (lib/session.ts)
// só sabe criar o primeiro condomínio (bootstrap) e juntar novos utilizadores
// a esse único condomínio existente. O modelo de dados já é multi-tenant e
// seguro; o que falta é o fluxo de produto para gerir mais do que um
// condomínio na mesma instância (ver FUNCTIONAL_GAPS.md).
export const condominio = pgTable("condominio", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  morada: text("morada"),
  nif: text("nif"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// --- App tables --------------------------------------------------------------
// O `perfil` de `membro` (ver lib/session.ts para o tipo `Perfil` e os
// grupos de permissão) distingue os papéis de um utilizador dentro de UM
// condomínio: "admin" (administrador eleito/residente), "gestor" (empresa
// de administração profissional — mesmos poderes que "admin", rótulo
// distinto), "condomino" (proprietário), "inquilino" (arrendatário, sem
// acesso a dados financeiros), "fornecedor" (acesso mínimo, uso futuro) e
// "auditor" (consulta total, sem qualquer poder de escrita). O `estado`
// distingue contas aprovadas de pedidos pendentes (ver lib/session.ts:
// getMembroAtual/requireMembroAprovado). Um mesmo `userId` do better-auth
// pode ter uma linha `membro` por condomínio a que pertence — com um
// `perfil` diferente em cada um, se for caso disso (ex. uma empresa de
// administração é "gestor" em vários condomínios ao mesmo tempo).

export const membro = pgTable(
  "membro",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    perfil: text("perfil").notNull().default("condomino"),
    estado: text("estado").notNull().default("aprovado"),
    fracao: text("fracao"), // identificação da fração, ex: "2ºEsq"
    telefone: text("telefone"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    // Um utilizador só pode ter uma linha membro por condomínio (evita a
    // corrida de duplicação descrita em SECURITY_AUDIT.md S10).
    uniqueIndex("membro_user_condominio_idx").on(t.userId, t.condominioId),
    index("membro_condominio_idx").on(t.condominioId),
  ],
)

// Frações do condomínio
export const fracao = pgTable(
  "fracao",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(), // criador (admin)
    identificacao: text("identificacao").notNull(), // ex: "R/C Dto", "2ºEsq"
    proprietario: text("proprietario").notNull(),
    permilagem: numeric("permilagem", { precision: 8, scale: 2 })
      .notNull()
      .default("0"),
    contactoEmail: text("contactoEmail"),
    contactoTelefone: text("contactoTelefone"),
    notas: text("notas"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("fracao_condominio_idx").on(t.condominioId)],
)

// Movimentos financeiros: quotas (receita) e despesas.
// `deletedAt` implementa soft-delete: registos financeiros têm obrigação
// legal de retenção (contabilística/fiscal) independente do RGPD, pelo que
// "eliminar" um movimento (app/actions/financas.ts) marca `deletedAt` em
// vez de fazer DELETE físico. Todas as leituras filtram `deletedAt is null`.
export const movimento = pgTable(
  "movimento",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    tipo: text("tipo").notNull(), // "receita" | "despesa"
    categoria: text("categoria").notNull(), // ex: "Quota", "Limpeza", "Elevador"
    descricao: text("descricao").notNull(),
    valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
    // Opcional: quota associada a uma fração. FK real (era um integer solto).
    fracaoId: integer("fracaoId").references(() => fracao.id, {
      onDelete: "set null",
    }),
    data: timestamp("data").notNull().defaultNow(),
    pago: boolean("pago").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    deletedAt: timestamp("deletedAt"),
  },
  (t) => [index("movimento_condominio_idx").on(t.condominioId)],
)

// Orçamento anual aprovado do condomínio. Por agora um valor global por
// ano (sem rubricas discriminadas nem geração automática de quotas a
// partir dele) — ver FUNCTIONAL_GAPS.md para o que falta (rubricas,
// orçamento previsto vs. executado, geração automática de quotas mensais
// por fração a partir da permilagem).
export const orcamento = pgTable(
  "orcamento",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    ano: integer("ano").notNull(),
    valorAnual: numeric("valorAnual", { precision: 12, scale: 2 }).notNull(),
    notas: text("notas"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("orcamento_condominio_idx").on(t.condominioId),
    uniqueIndex("orcamento_condominio_ano_idx").on(t.condominioId, t.ano),
  ],
)

// Avisos / comunicados
export const aviso = pgTable(
  "aviso",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    autorNome: text("autorNome").notNull(),
    titulo: text("titulo").notNull(),
    conteudo: text("conteudo").notNull(),
    prioridade: text("prioridade").notNull().default("normal"), // "normal" | "importante" | "urgente"
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("aviso_condominio_idx").on(t.condominioId)],
)

// Ocorrências / pedidos de manutenção
export const ocorrencia = pgTable(
  "ocorrencia",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(), // quem reportou
    reporterNome: text("reporterNome").notNull(),
    titulo: text("titulo").notNull(),
    descricao: text("descricao").notNull(),
    local: text("local"), // ex: "Garagem", "Elevador", "Hall entrada"
    categoria: text("categoria").notNull().default("manutencao"),
    estado: text("estado").notNull().default("aberta"), // "aberta" | "em_curso" | "resolvida"
    prioridade: text("prioridade").notNull().default("normal"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [index("ocorrencia_condominio_idx").on(t.condominioId)],
)

// Documentos e atas
export const documento = pgTable(
  "documento",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    titulo: text("titulo").notNull(),
    categoria: text("categoria").notNull().default("ata"), // "ata" | "regulamento" | "orcamento" | "outro"
    descricao: text("descricao"),
    url: text("url"), // link para o ficheiro
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("documento_condominio_idx").on(t.condominioId)],
)

// Registo de auditoria: quem fez o quê, quando, a que entidade. Escrito
// pelas próprias server actions (ver lib/audit.ts) sempre que uma ação
// sensível é executada (criar/atualizar/eliminar dados partilhados,
// aprovar/rejeitar condóminos, etc.). Consultável por admin/gestor/auditor
// (ver app/actions/auditoria.ts). Nunca é alterado nem apagado pela
// aplicação — é ele próprio o rasto de auditoria.
export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    actorUserId: text("actorUserId").notNull(),
    actorNome: text("actorNome").notNull(),
    acao: text("acao").notNull(), // "criar" | "atualizar" | "eliminar" | "aprovar" | "rejeitar"
    entidade: text("entidade").notNull(), // "movimento" | "aviso" | "documento" | "fracao" | "membro" | "ocorrencia"
    entidadeId: integer("entidadeId").notNull(),
    detalhes: text("detalhes"), // resumo legível opcional, texto livre
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("audit_log_condominio_idx").on(t.condominioId),
    index("audit_log_entidade_idx").on(t.entidade, t.entidadeId),
  ],
)
