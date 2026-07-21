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
    // Ligação real à fração (substituiu, em 2026-07-07, um campo de texto
    // livre sem qualquer validação). Um "condomino" com fracaoId=X é o
    // proprietário de X; um "inquilino" com fracaoId=X é o arrendatário de
    // X — a mesma fração pode ter várias linhas membro associadas (ex.
    // proprietário e inquilino em simultâneo, cada um com a sua conta).
    fracaoId: integer("fracaoId").references(() => fracao.id, {
      onDelete: "set null",
    }),
    telefone: text("telefone"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    // Um utilizador só pode ter uma linha membro por condomínio (evita a
    // corrida de duplicação descrita em SECURITY_AUDIT.md S10).
    uniqueIndex("membro_user_condominio_idx").on(t.userId, t.condominioId),
    index("membro_condominio_idx").on(t.condominioId),
    index("membro_fracao_idx").on(t.fracaoId),
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
    // Frações sem uso do elevador (tipicamente o rés-do-chão) podem ser
    // isentas dessa parcela do orçamento — art. 1424º CC permite repartição
    // diferente da permilagem para despesas sem utilidade para certas
    // frações. Ver orcamento.valorAnualElevador e lib/rateio.ts.
    isentaElevador: boolean("isentaElevador").notNull().default(false),
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
    // "geral" (despesas correntes/quotas normais) ou "reserva" (fundo comum
    // de reserva, obrigatório por lei — DL 268/94). Um movimento pertence
    // inteiramente a um dos dois; se uma quota tiver de ser dividida entre
    // os dois fundos, regista-se como duas linhas separadas (sem cálculo
    // automático de percentagem — ver FUNCTIONAL_GAPS.md).
    destino: text("destino").notNull().default("geral"),
    // Preenchido só nas quotas criadas por gerarQuotasOrcamento (lib/rateio.ts
    // + app/actions/orcamentos.ts) — permite verificar se um orçamento já
    // gerou quotas (bloqueia gerar em duplicado) sem inferir por texto de
    // categoria/data. `set null` em vez de cascade: eliminar o orçamento
    // nunca pode apagar um movimento financeiro (obrigação de retenção).
    orcamentoId: integer("orcamentoId").references(() => orcamento.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    deletedAt: timestamp("deletedAt"),
  },
  (t) => [
    index("movimento_condominio_idx").on(t.condominioId),
    index("movimento_orcamento_idx").on(t.orcamentoId),
  ],
)

// Orçamento anual aprovado do condomínio. Por agora um valor global por
// ano (sem rubricas discriminadas) — ver FUNCTIONAL_GAPS.md para o que
// falta (orçamento previsto vs. executado). Gera quotas mensais por fração
// via app/actions/orcamentos.ts:gerarQuotasOrcamento + lib/rateio.ts.
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
    // Parcela do valorAnual que é custo do elevador — opcional, rateada só
    // pelas frações não isentas (fracao.isentaElevador), separadamente do
    // resto (rateado por permilagem entre todas). Null/0 = sem parcela de
    // elevador distinta; comporta-se como antes desta funcionalidade.
    valorAnualElevador: numeric("valorAnualElevador", { precision: 12, scale: 2 }),
    notas: text("notas"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("orcamento_condominio_idx").on(t.condominioId),
    uniqueIndex("orcamento_condominio_ano_idx").on(t.condominioId, t.ano),
  ],
)

// Apólices de seguro do condomínio. O seguro contra incêndio/multirriscos
// do edifício é obrigatório por lei (art. 1429º Código Civil) — antes só
// podia ser registado como texto livre num "documento"; agora é uma
// entidade própria com datas de validade, para se poder alertar quando
// está a expirar.
export const seguro = pgTable(
  "seguro",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    seguradora: text("seguradora").notNull(),
    apolice: text("apolice").notNull(),
    tipo: text("tipo").notNull().default("multirriscos"), // "multirriscos" | "incendio" | "outro"
    dataInicio: timestamp("dataInicio").notNull(),
    dataFim: timestamp("dataFim").notNull(),
    valorPremio: numeric("valorPremio", { precision: 12, scale: 2 }),
    notas: text("notas"),
    // Anexo da apólice em PDF (Vercel Blob, ver lib/storage.ts). Nome
    // distinto de `apolice`, que é o número da apólice, não o ficheiro.
    anexoUrl: text("anexoUrl"),
    anexoNomeFicheiro: text("anexoNomeFicheiro"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("seguro_condominio_idx").on(t.condominioId)],
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
    // Foto da avaria (Vercel Blob, ver lib/storage.ts). Uma só por
    // ocorrência — várias fotos ficaria para uma tabela própria, não feito
    // nesta fase (ver FUNCTIONAL_GAPS.md).
    fotoUrl: text("fotoUrl"),
    fotoNomeFicheiro: text("fotoNomeFicheiro"),
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
    // Aceita tanto um link externo colado à mão como o URL de um ficheiro
    // carregado para o Vercel Blob (ver lib/storage.ts) — `nomeFicheiro`
    // guarda o nome original só no segundo caso, para não mostrar ao
    // utilizador um nome aleatório gerado pelo armazenamento.
    url: text("url"), // link para o ficheiro
    nomeFicheiro: text("nomeFicheiro"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("documento_condominio_idx").on(t.condominioId)],
)

// Assembleias: convocatória, ordem de trabalhos, presenças/procurações e
// votação por permilagem. `estado` governa o ciclo de vida: "convocada"
// (agendada) → "realizada" (aconteceu, ata em rascunho, ainda editável) →
// "aprovada" (ata fechada — todas as tabelas abaixo tornam-se imutáveis,
// ver app/actions/assembleias.ts) ou "cancelada" (só a partir de
// "convocada"). Sem motor de regras legais de maioria: a app calcula e
// mostra o quórum/votação por permilagem, mas quem qualifica se uma
// deliberação foi aprovada nos termos do Código Civil é o administrador.
export const assembleia = pgTable(
  "assembleia",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    tipo: text("tipo").notNull().default("ordinaria"), // "ordinaria" | "extraordinaria"
    local: text("local").notNull(),
    dataPrimeiraConvocatoria: timestamp("dataPrimeiraConvocatoria").notNull(),
    dataSegundaConvocatoria: timestamp("dataSegundaConvocatoria"),
    estado: text("estado").notNull().default("convocada"), // "convocada" | "realizada" | "aprovada" | "cancelada"
    textoAta: text("textoAta"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("assembleia_condominio_idx").on(t.condominioId)],
)

// Ordem de trabalhos de uma assembleia — cada ponto é também onde fica
// registada a deliberação (resultado) depois de discutido/votado.
export const assembleiaPonto = pgTable(
  "assembleia_ponto",
  {
    id: serial("id").primaryKey(),
    assembleiaId: integer("assembleiaId")
      .notNull()
      .references(() => assembleia.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull(),
    titulo: text("titulo").notNull(),
    descricao: text("descricao"),
    resultado: text("resultado"), // "aprovado" | "reprovado" | "adiado", null até decidido
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("assembleia_ponto_assembleia_idx").on(t.assembleiaId)],
)

// Presença/representação por fração numa assembleia — a unidade de
// quórum/voto é a fração (via a sua permilagem), não a pessoa.
export const assembleiaPresenca = pgTable(
  "assembleia_presenca",
  {
    id: serial("id").primaryKey(),
    assembleiaId: integer("assembleiaId")
      .notNull()
      .references(() => assembleia.id, { onDelete: "cascade" }),
    fracaoId: integer("fracaoId")
      .notNull()
      .references(() => fracao.id, { onDelete: "cascade" }),
    tipo: text("tipo").notNull().default("presencial"), // "presencial" | "procuracao"
    representante: text("representante"), // nome de quem está fisicamente presente
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("assembleia_presenca_assembleia_idx").on(t.assembleiaId),
    uniqueIndex("assembleia_presenca_fracao_idx").on(t.assembleiaId, t.fracaoId),
  ],
)

// Voto de uma fração num ponto da ordem de trabalhos.
export const assembleiaVoto = pgTable(
  "assembleia_voto",
  {
    id: serial("id").primaryKey(),
    pontoId: integer("pontoId")
      .notNull()
      .references(() => assembleiaPonto.id, { onDelete: "cascade" }),
    fracaoId: integer("fracaoId")
      .notNull()
      .references(() => fracao.id, { onDelete: "cascade" }),
    voto: text("voto").notNull(), // "favor" | "contra" | "abstencao"
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("assembleia_voto_ponto_idx").on(t.pontoId),
    uniqueIndex("assembleia_voto_ponto_fracao_idx").on(t.pontoId, t.fracaoId),
  ],
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
