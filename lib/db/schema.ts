import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  numeric,
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

// --- App tables ------------------------------------------------------------
// A single-condominium model. Every authenticated user is a member of the
// condominium. The `perfil` column on `membro` distinguishes administrators
// from ordinary residents (condóminos). Rows are scoped by `userId` where
// they represent private/per-user data; shared condominium data is readable
// by all members and writable by administrators (enforced in server actions).

// Perfil do utilizador dentro do condomínio: "admin" | "condomino"
// Estado de aprovação: "pendente" | "aprovado". Novos registos (exceto o
// primeiro utilizador, que é admin+aprovado automaticamente) entram como
// "pendente" e só veem dados do condomínio depois de um admin os aprovar
// (ver lib/session.ts:getMembroAtual). O default "aprovado" ao nível da
// coluna é para que uma migração desta coluna não bloqueie membros já
// existentes; só os novos registos são inseridos explicitamente como
// "pendente".
export const membro = pgTable("membro", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  perfil: text("perfil").notNull().default("condomino"),
  estado: text("estado").notNull().default("aprovado"),
  fracao: text("fracao"), // identificação da fração, ex: "2ºEsq"
  telefone: text("telefone"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Frações do condomínio
export const fracao = pgTable("fracao", {
  id: serial("id").primaryKey(),
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
})

// Movimentos financeiros: quotas (receita) e despesas
export const movimento = pgTable("movimento", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  tipo: text("tipo").notNull(), // "receita" | "despesa"
  categoria: text("categoria").notNull(), // ex: "Quota", "Limpeza", "Elevador"
  descricao: text("descricao").notNull(),
  valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
  fracaoId: integer("fracaoId"), // opcional: quota associada a uma fração
  data: timestamp("data").notNull().defaultNow(),
  pago: boolean("pago").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Avisos / comunicados
export const aviso = pgTable("aviso", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  autorNome: text("autorNome").notNull(),
  titulo: text("titulo").notNull(),
  conteudo: text("conteudo").notNull(),
  prioridade: text("prioridade").notNull().default("normal"), // "normal" | "importante" | "urgente"
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Ocorrências / pedidos de manutenção
export const ocorrencia = pgTable("ocorrencia", {
  id: serial("id").primaryKey(),
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
})

// Documentos e atas
export const documento = pgTable("documento", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  titulo: text("titulo").notNull(),
  categoria: text("categoria").notNull().default("ata"), // "ata" | "regulamento" | "orcamento" | "outro"
  descricao: text("descricao"),
  url: text("url"), // link para o ficheiro
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})
