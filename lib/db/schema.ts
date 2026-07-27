import {
  pgTable,
  text,
  timestamp,
  date,
  boolean,
  serial,
  integer,
  numeric,
  index,
  uniqueIndex,
  unique,
  foreignKey,
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
  // "Super Admin", com acesso de gestão em qualquer condomínio a que
  // também pertença como `membro` — reservado para a futura empresa de
  // administração multi-condomínio (ROADMAP.md, Fase 5), ainda não
  // construída. Não confundir com `operadorPlataforma` abaixo. Não existe
  // ainda nenhuma UI para o ativar — é definido diretamente na base de
  // dados (ver lib/session.ts).
  superAdmin: boolean("superAdmin").notNull().default(false),
  // Operador do próprio SaaS (RJCSI) — controla /plataforma e o estado de
  // subscrição de QUALQUER condomínio, independentemente de lhe pertencer
  // como `membro`. Distinto de `superAdmin`: esse dá acesso de gestão
  // dentro de condomínios de que já se é membro; este só controla
  // suspender/reativar o acesso por falta de pagamento, em toda a
  // plataforma. Definido diretamente na base de dados (ver lib/session.ts).
  operadorPlataforma: boolean("operadorPlataforma").notNull().default(false),
  // Campo do plugin "two-factor" do better-auth.
  twoFactorEnabled: boolean("twoFactorEnabled").notNull().default(false),
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

// Tabela do plugin "two-factor" do better-auth (MFA/TOTP + códigos de
// recuperação, ativação opcional pelo próprio membro — ver lib/auth.ts).
// `verified`/`failedVerificationCount`/`lockedUntil` são geridos pelo
// próprio plugin para bloqueio temporário após tentativas falhadas.
export const twoFactor = pgTable("twoFactor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backupCodes").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  verified: boolean("verified").notNull().default(true),
  failedVerificationCount: integer("failedVerificationCount").notNull().default(0),
  lockedUntil: timestamp("lockedUntil"),
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
  // Dados formais do edifício — todos opcionais e em texto livre, tal como
  // morada/nif já são (formatos de registo predial/matricial variam por
  // concelho). Gap identificado 2026-07-22 por comparação com um template
  // de contabilidade de condomínio real.
  numeroMatricial: text("numeroMatricial"),
  conservatoriaRegistoPredial: text("conservatoriaRegistoPredial"),
  licencaHabitacao: text("licencaHabitacao"),
  projetoArquiteto: text("projetoArquiteto"),
  areaConstrucao: numeric("areaConstrucao", { precision: 10, scale: 2 }),
  // Código de convite partilhado para novos membros se juntarem a este
  // condomínio (em vez de criarem um condomínio novo) — ver lib/session.ts
  // e app/onboarding. Não determina o nível de acesso: quem entra por
  // código continua "pendente" até um admin aprovar, tal como hoje.
  codigoConvite: text("codigoConvite").unique(),
  // Controlo de acesso por subscrição — geríve em /plataforma por quem tem
  // `user.operadorPlataforma` (ver lib/session.ts). "suspenso" bloqueia o
  // acesso de qualquer membro (incluindo admin/gestor), exceto do próprio
  // operador da plataforma. Cobrança em si continua manual — isto só
  // controla o corte de acesso.
  estadoSubscricao: text("estadoSubscricao").notNull().default("ativo"), // "ativo" | "suspenso"
  // Nota livre do operador da plataforma (ex. motivo da suspensão) — nunca
  // mostrada aos membros do condomínio.
  notaSubscricao: text("notaSubscricao"),
  subscricaoAtualizadaEm: timestamp("subscricaoAtualizadaEm"),
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

// Fornecedores do condomínio (ex: elevadores, limpeza, seguros) — registo
// simples de contacto/categoria, sem ligação ainda a ocorrências, obras ou
// despesas (ver FUNCTIONAL_GAPS.md, gap "Fornecedores" P2 — versão mínima).
export const fornecedor = pgTable(
  "fornecedor",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    nome: text("nome").notNull(),
    nif: text("nif"),
    categoria: text("categoria"), // ex: "Elevadores", "Limpeza", "Seguros" — texto livre
    contactoEmail: text("contactoEmail"),
    contactoTelefone: text("contactoTelefone"),
    notas: text("notas"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("fornecedor_condominio_idx").on(t.condominioId)],
)

// Lista de referência rápida para situações de urgência (ex. porteiro,
// manutenção de elevadores, eletricista/canalizador de urgência) — distinta
// de `fornecedor` (gestão comercial/financeira): visível a qualquer membro
// aprovado, não só a quem gere (ver app/(app)/page.tsx). Eliminação direta,
// sem soft-delete — não é dado financeiro nem sujeito a retenção legal.
export const contactoEmergencia = pgTable(
  "contacto_emergencia",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    nome: text("nome").notNull(),
    telefone: text("telefone").notNull(),
    descricao: text("descricao"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("contacto_emergencia_condominio_idx").on(t.condominioId)],
)

// Registo de bens do condomínio (mobiliário, equipamento, segurança) —
// informação administrativa, não financeira: não lança movimentos nem
// altera saldos. `valorAtual` é indicado manualmente, sem fórmula
// automática de depreciação (mantido simples de propósito). Visível só a
// quem tem consulta de gestão (ver app/(app)/condominio/page.tsx), tal
// como o resto dessa página.
export const patrimonio = pgTable(
  "patrimonio",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    nome: text("nome").notNull(),
    categoria: text("categoria"), // ex: "Mobiliário", "Equipamento", "Segurança" — texto livre
    dataAquisicao: timestamp("dataAquisicao"),
    valorAquisicao: numeric("valorAquisicao", { precision: 10, scale: 2 }),
    valorAtual: numeric("valorAtual", { precision: 10, scale: 2 }),
    notas: text("notas"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("patrimonio_condominio_idx").on(t.condominioId)],
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
    // Letra/código curto da fração (ex: "A", "D"), como usado nos mapas de
    // quotas e documentação de administrações (ex. MBD Gest). Distinto de
    // `identificacao`, que descreve a localização ("R/C Dto").
    letra: text("letra"),
    identificacao: text("identificacao").notNull(), // ex: "R/C Dto", "2ºEsq"
    proprietario: text("proprietario").notNull(),
    // Qualidade do titular indicado em `proprietario`, relevante para saber
    // a quem endereçar correspondência (convocatórias, interpelações).
    tipoTitular: text("tipoTitular").$type<
      "proprietario" | "inquilino" | "usufrutuario" | "locatario" | "antigo"
    >(),
    // NIF do proprietário registado (fracao.proprietario) — útil para
    // recibos/declarações fiscais. Texto livre, sem validação de checksum,
    // pelo mesmo padrão já usado em condominio.nif.
    nif: text("nif"),
    permilagem: numeric("permilagem", { precision: 8, scale: 2 })
      .notNull()
      .default("0"),
    // Área em m², informação normalmente presente na ficha de fração —
    // distinta da permilagem (que é a quota-parte para efeitos de rateio).
    // Opcionais, texto livre sem cálculo automático (a área comum imputada
    // a cada fração é normalmente proporcional à permilagem, mas pode não
    // ser exatamente isso na prática, por isso não se deriva uma da outra).
    areaPrivativa: numeric("areaPrivativa", { precision: 8, scale: 2 }),
    areaComum: numeric("areaComum", { precision: 8, scale: 2 }),
    contactoEmail: text("contactoEmail"),
    contactoTelefone: text("contactoTelefone"),
    // Procurador/representante do proprietário (pessoa coletiva, herança
    // indivisa, etc. — comum em condomínios PT). Texto livre, um só
    // representante por fração, sem entidade própria (mesma simplicidade
    // dos restantes campos de contacto). Não usado nas minutas de
    // convocatória/procuração/interpelação — só referência administrativa.
    representanteLegal: text("representanteLegal"),
    representanteLegalContacto: text("representanteLegalContacto"),
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
    // Detalhe do pagamento — todos opcionais, preenchidos quando o movimento
    // é marcado como pago. "data" acima é a data do lançamento/vencimento;
    // dataLiquidacao é quando o pagamento efetivamente ocorreu.
    meioPagamento: text("meioPagamento"), // "transferencia" | "multibanco" | "numerario" | "cheque" | "outro"
    referenciaMb: text("referenciaMb"),
    dataLiquidacao: timestamp("dataLiquidacao"),
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
    // Opcional, só faz sentido em despesas. `set null` em vez de cascade:
    // eliminar o fornecedor nunca pode apagar o movimento financeiro.
    fornecedorId: integer("fornecedorId").references(() => fornecedor.id, {
      onDelete: "set null",
    }),
    // Opcional — liga uma quota extraordinária (tipo "receita") à deliberação
    // de assembleia que a aprovou (G05), ou uma despesa à deliberação que a
    // aprovou (ver `requerAprovacao` acima) — mesmo mecanismo para os dois
    // tipos. FK simples, não composta: ao
    // contrário de exercicio/contaFinanceira, `assembleiaPonto` não tem
    // `condominioId` próprio nem `unique(id, condominioId)` (nunca foi
    // desenhada para FKs compostas — mesmo caso de `orcamentoRubrica`). O
    // isolamento multi-tenant é garantido na server action (validação de
    // que o ponto pertence a uma assembleia do condomínio do chamador),
    // não ao nível da BD. `set null` em vez de cascade: eliminar o ponto
    // nunca pode apagar o movimento financeiro.
    assembleiaPontoId: integer("assembleiaPontoId").references(() => assembleiaPonto.id, {
      onDelete: "set null",
    }),
    // Ligação opcional ao exercício/conta financeira a que este movimento
    // pertence (ver exercicioFinanceiro/contaFinanceira mais abaixo) —
    // aditivo, não substitui `destino` (que continua a distinguir a
    // FINALIDADE geral/reserva; `contaFinanceiraId` distingue ONDE o
    // dinheiro está — as duas coisas são independentes, ver comentário em
    // contaFinanceira). Lançamentos antigos nascem sem estes campos;
    // preenchidos por ações de associação em massa, não pela migração.
    // Sem `.references()` inline: a integridade referencial exige também
    // que o `condominioId` bata certo (nunca associar a uma conta/
    // exercício doutro condomínio) — ver as duas `foreignKey()` compostas
    // abaixo, que substituem uma FK simples por uma FK em (id,condominioId).
    exercicioId: integer("exercicioId"),
    contaFinanceiraId: integer("contaFinanceiraId"),
    // Pagador do movimento, quando diferente do proprietário registado na
    // fração — ex. herança indivisa em que cada herdeiro paga a sua quota-
    // parte e precisa do seu próprio recibo com o seu NIF (para efeitos de
    // dedução de mais-valias em IRS, entre outros). Opcionais; quando
    // preenchidos, o recibo (`/financas/recibo/[id]`) mostra este nome/NIF
    // em vez do NIF único da fração — ver lib/db/schema.ts `fracao.nif`.
    pagadorNome: text("pagadorNome"),
    pagadorNif: text("pagadorNif"),
    // Aprovação de despesas / obras urgentes (FUNCTIONAL_GAPS.md, secção 4)
    // — só fazem sentido em despesa. Sem limiar em euros (o Código Civil não
    // fixa um, é uma distinção qualitativa entre conservação corrente e
    // extraordinária/inovações) e sem bloqueio: o administrador marca
    // manualmente, a app só torna visível — mesma filosofia já usada para o
    // aviso de permilagem (avisa, nunca impede lançar/pagar).
    // `requerAprovacao` combinado com `assembleiaPontoId` (abaixo) é a fonte
    // de verdade: sem ponto ligado = pendente; ponto ligado (sempre
    // `resultado='aprovado'`, ver validarAssembleiaPonto) = aprovada. Sem
    // campo de estado próprio, para nunca poder divergir da realidade.
    requerAprovacao: boolean("requerAprovacao").notNull().default(false),
    // Obra urgente (art. 1427º CC) — independente de requerAprovacao (pode
    // nunca vir a precisar de aprovação formal, ou as duas coisas ao mesmo
    // tempo). Não cria nada automaticamente; fica visível na lista de
    // despesas e no dossier de assembleia para o administrador decidir se
    // cria um ponto de ordem de trabalhos para ratificação.
    urgente: boolean("urgente").notNull().default(false),
    justificacaoUrgencia: text("justificacaoUrgencia"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    deletedAt: timestamp("deletedAt"),
  },
  (t) => [
    index("movimento_condominio_idx").on(t.condominioId),
    index("movimento_orcamento_idx").on(t.orcamentoId),
    index("movimento_fornecedor_idx").on(t.fornecedorId),
    index("movimento_assembleia_ponto_idx").on(t.assembleiaPontoId),
    index("movimento_exercicio_idx").on(t.exercicioId),
    index("movimento_conta_financeira_idx").on(t.contaFinanceiraId),
    foreignKey({
      columns: [t.exercicioId, t.condominioId],
      foreignColumns: [exercicioFinanceiro.id, exercicioFinanceiro.condominioId],
      name: "movimento_exercicio_condominio_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [t.contaFinanceiraId, t.condominioId],
      foreignColumns: [contaFinanceira.id, contaFinanceira.condominioId],
      name: "movimento_conta_financeira_condominio_fk",
    }).onDelete("set null"),
    // Necessária para pagamentoDocumentoFornecedor.movimentoId referenciar
    // (id, condominioId) em vez de só (id) — Fase A.2, ver comentário lá.
    // Sempre satisfeita automaticamente (id já é único sozinho), por isso
    // adicioná-la a uma tabela com dados reais em produção não tem risco
    // de rejeitar linhas existentes.
    unique("movimento_id_condominio_uq").on(t.id, t.condominioId),
  ],
)

// Linha importada de um extrato bancário (CSV), para conciliação com
// `movimento`. Só cobre a conta corrente (destino "geral") — o fundo de
// reserva, muitas vezes noutra conta bancária, fica de fora por agora.
// Não existe um campo "conciliado" em `movimento`: esse estado deriva-se
// de existir ou não uma linha aqui com `conciliadoMovimentoId` a apontar
// para ele (mesmo princípio de `movimento.orcamentoId`).
export const extratoBancario = pgTable(
  "extratoBancario",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    data: timestamp("data").notNull(),
    descricao: text("descricao").notNull(),
    // Assinado: positivo = entrada, negativo = saída.
    valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
    conciliadoMovimentoId: integer("conciliadoMovimentoId").references(
      () => movimento.id,
      { onDelete: "set null" },
    ),
    // Linhas sem correspondência esperada em `movimento` (ex: taxas
    // bancárias não modeladas) — marcadas para não ficarem para sempre
    // como "por conciliar".
    ignorado: boolean("ignorado").notNull().default(false),
    // Conta financeira a que este extrato pertence — opcional (extratos já
    // importados antes desta funcionalidade ficam sem conta, mostrados na
    // UI como "Conta por indicar", nunca obrigados a edição em massa).
    // Impede conciliar uma linha desta conta com um movimento de outra.
    contaFinanceiraId: integer("contaFinanceiraId"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("extrato_bancario_condominio_idx").on(t.condominioId),
    index("extrato_bancario_conta_financeira_idx").on(t.contaFinanceiraId),
    foreignKey({
      columns: [t.contaFinanceiraId, t.condominioId],
      foreignColumns: [contaFinanceira.id, contaFinanceira.condominioId],
      name: "extrato_bancario_conta_financeira_condominio_fk",
    }).onDelete("set null"),
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

// Rubrica orçamental (Fase A.2, peça 2 — G08): discrimina `orcamento.valorAnual`
// por categoria. `getBalancoOrcamento` (app/actions/orcamentos.ts) já calcula
// a despesa real por categoria; esta tabela só acrescenta o lado orçamentado.
// Sem `condominioId` próprio nem FK composta — ao contrário de
// `pagamentoDocumentoFornecedor`, uma rubrica só se relaciona com o seu
// próprio orçamento (uma única entidade pai), por isso o isolamento entre
// condomínios fica garantido validando `orcamentoId` contra o `condominioId`
// do admin na própria server action, sem precisar de reforço ao nível da BD.
// Orçamentos antigos sem rubricas continuam a mostrar só o total — não há
// migração automática de dados existentes.
export const orcamentoRubrica = pgTable(
  "orcamento_rubrica",
  {
    id: serial("id").primaryKey(),
    orcamentoId: integer("orcamentoId")
      .notNull()
      .references(() => orcamento.id, { onDelete: "cascade" }),
    categoria: text("categoria").notNull(), // mesma taxonomia de movimento.categoria
    valorOrcamentado: numeric("valorOrcamentado", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("orcamento_rubrica_orcamento_idx").on(t.orcamentoId)],
)

// Exercício financeiro: período contabilístico fechável, com saldo
// transportado por conta entre exercícios (ver saldoInicialConta abaixo).
// Distinto de `orcamento.ano` (que é só o valor orçamentado). `designacao`
// é o identificador legível (ex: "2026" ou "2025/2026") — `anoPrincipal`
// existe só para ordenação/referência, NUNCA é a base de unicidade, porque
// um exercício pode não coincidir com o ano civil.
//
// Sobreposição de datas entre exercícios do mesmo condomínio é impedida
// por uma constraint `EXCLUDE USING gist` na base de dados (extensão
// `btree_gist`), aplicada diretamente no SQL da migração — o Drizzle não
// tem um construtor nativo para `EXCLUDE`, por isso não aparece aqui em
// código; ver o ficheiro de migração correspondente e
// docs/product/MBD_GEST_GAP_ANALYSIS.md. Qualquer migração futura que
// recrie esta tabela do zero tem de reintroduzir essa constraint à mão.
// `dataInicio`/`dataFim` são inclusivas (o último dia do exercício conta
// como desse exercício).
export const exercicioFinanceiro = pgTable(
  "exercicio_financeiro",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    designacao: text("designacao").notNull(), // ex: "2026", "2025/2026"
    anoPrincipal: integer("anoPrincipal").notNull(),
    dataInicio: date("dataInicio", { mode: "date" }).notNull(),
    dataFim: date("dataFim", { mode: "date" }).notNull(),
    estado: text("estado").notNull().default("aberto"), // "aberto" | "fechado"
    fechadoEm: timestamp("fechadoEm"),
    fechadoPorUserId: text("fechadoPorUserId"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [
    index("exercicio_financeiro_condominio_idx").on(t.condominioId),
    // Necessária para as FKs compostas de movimento/saldoInicialConta
    // referenciarem (id, condominioId) em vez de só (id) — impede
    // associar um exercício de outro condomínio (ver comentário em
    // `movimento`).
    unique("exercicio_financeiro_id_condominio_uq").on(t.id, t.condominioId),
  ],
)

// Conta financeira do condomínio (à ordem, a prazo, caixa) — entidade
// própria, distinta do "balde" contabilístico `movimento.destino` (que se
// mantém inalterado nesta fase e continua a ser a fonte de verdade dos
// relatórios existentes). Uma conta financeira é ONDE o dinheiro está;
// `destino` é a FINALIDADE (gestão corrente vs. fundo de reserva) — não
// se assume que exista uma correspondência 1:1 entre os dois: uma conta
// pode, na prática, misturar valores dos dois destinos, embora não seja o
// cenário preferencial.
//
// Assume-se que a conta pertence ao condomínio, nunca a um administrador
// residente; "transitoria" é só para situações herdadas do histórico
// anterior à adoção desta funcionalidade, nunca prática normal — ver
// docs/product/MBD_GEST_GAP_ANALYSIS.md, secção 15, decisão 2.
export const contaFinanceira = pgTable(
  "conta_financeira",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    banco: text("banco"),
    // Normalizado (maiúsculas, sem espaços) e validado na server action
    // antes de gravar — nunca só na UI. Nunca devolvido a perfis sem
    // consulta de gestão (ver lib/session.ts:temConsultaGestao) nem
    // escrito por extenso no audit_log.
    iban: text("iban"),
    tipo: text("tipo").notNull(), // "ordem" | "prazo" | "caixa" | "transitoria"
    moeda: text("moeda").notNull().default("EUR"),
    estado: text("estado").notNull().default("ativa"), // "ativa" | "encerrada"
    dataAbertura: date("dataAbertura", { mode: "date" }),
    dataEncerramento: date("dataEncerramento", { mode: "date" }),
    // Obrigatório (validado na server action, não na BD) quando
    // tipo = "transitoria" — justificação da situação transitória.
    notaTransitoria: text("notaTransitoria"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [
    index("conta_financeira_condominio_idx").on(t.condominioId),
    unique("conta_financeira_id_condominio_uq").on(t.id, t.condominioId),
  ],
)

// Saldo inicial de uma conta financeira num exercício. "manual" quando
// introduzido pelo administrador (primeiro exercício de uma conta);
// "transportado" quando calculado automaticamente ao criar o exercício
// seguinte a um já fechado (saldo inicial anterior + movimentos LIQUIDADOS
// ligados a essa conta nesse exercício — ver lib/contas-financeiras.ts
// para a única função que faz este cálculo, nunca duplicada). O saldo
// "atual" de uma conta nunca é um campo persistido — é sempre saldo
// inicial + soma dos movimentos ligados, calculado em runtime.
//
// `condominioId` aqui é redundante com a relação transitiva via
// contaFinanceiraId/exercicioId, mas é a forma mais direta de a própria
// base de dados impedir (via as duas FKs compostas abaixo) que um saldo
// inicial relacione uma conta e um exercício de condomínios diferentes.
export const saldoInicialConta = pgTable(
  "saldo_inicial_conta",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    contaFinanceiraId: integer("contaFinanceiraId").notNull(),
    exercicioId: integer("exercicioId").notNull(),
    valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
    origem: text("origem").notNull(), // "manual" | "transportado"
    definidoPorUserId: text("definidoPorUserId").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("saldo_inicial_conta_conta_exercicio_idx").on(
      t.contaFinanceiraId,
      t.exercicioId,
    ),
    foreignKey({
      columns: [t.contaFinanceiraId, t.condominioId],
      foreignColumns: [contaFinanceira.id, contaFinanceira.condominioId],
      name: "saldo_inicial_conta_conta_condominio_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.exercicioId, t.condominioId],
      foreignColumns: [exercicioFinanceiro.id, exercicioFinanceiro.condominioId],
      name: "saldo_inicial_conta_exercicio_condominio_fk",
    }).onDelete("cascade"),
  ],
)

// Documento de fornecedor (fatura, recibo) — Fase A.2. Distinto de
// `movimento`: tem ciclo de vida próprio (nº de lançamento interno, nº do
// documento do próprio fornecedor, emissão/vencimento) e pode ser liquidado
// em várias tranches via `pagamentoDocumentoFornecedor` abaixo, em vez do
// `pago: boolean` binário de `movimento`. `valorPago`/`saldo` NUNCA são
// persistidos aqui — são sempre calculados a partir da soma real dos
// pagamentos (ver lib/documentos-fornecedor.ts), para nunca poderem
// divergir da verdade.
// `deletedAt`: mesma obrigação de retenção legal de `movimento` —
// soft-delete, nunca DELETE físico.
export const documentoFornecedor = pgTable(
  "documento_fornecedor",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    // `set null` em vez de cascade: eliminar o fornecedor nunca pode apagar
    // um documento financeiro já registado — mesma convenção de
    // movimento.fornecedorId.
    fornecedorId: integer("fornecedorId").references(() => fornecedor.id, {
      onDelete: "set null",
    }),
    // Sequência própria, gerada automaticamente pelo GestCondo — distinta
    // de `id` (interno/técnico) e de `numeroDocumento` (o nº da fatura do
    // próprio fornecedor, texto livre porque o formato varia por
    // fornecedor).
    numeroLancamento: serial("numeroLancamento"),
    numeroDocumento: text("numeroDocumento"),
    categoria: text("categoria").notNull(), // mesma taxonomia de movimento.categoria
    dataEmissao: timestamp("dataEmissao").notNull(),
    dataVencimento: timestamp("dataVencimento"),
    valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
    // Anexo da fatura/recibo (Vercel Blob privado) — mesmo padrão de
    // seguro.anexoUrl/anexoNomeFicheiro.
    anexoUrl: text("anexoUrl"),
    anexoNomeFicheiro: text("anexoNomeFicheiro"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    deletedAt: timestamp("deletedAt"),
  },
  (t) => [
    index("documento_fornecedor_condominio_idx").on(t.condominioId),
    index("documento_fornecedor_fornecedor_idx").on(t.fornecedorId),
    // Necessária para pagamentoDocumentoFornecedor referenciar
    // (id, condominioId) em vez de só (id) — ver comentário abaixo.
    unique("documento_fornecedor_id_condominio_uq").on(t.id, t.condominioId),
  ],
)

// Pagamento (parcial ou total) de um documento_fornecedor — Fase A.2. Podem
// existir várias linhas para o mesmo documento; valorPago/saldo do
// documento (lib/documentos-fornecedor.ts) somam estas linhas em runtime,
// nunca um campo persistido no documento. `movimentoId` liga opcionalmente
// ao lançamento real que efetivamente saiu da conta — `movimento` continua
// a ser a fonte de verdade do saldo de caixa; este pagamento é o detalhe
// do lado do fornecedor.
//
// `condominioId` aqui é redundante com a relação transitiva via
// documentoFornecedorId, mas é a forma mais direta de a própria base de
// dados impedir (via as duas FKs compostas abaixo) que um pagamento
// relacione um documento e um movimento de condomínios diferentes — mesmo
// princípio de saldoInicialConta.
export const pagamentoDocumentoFornecedor = pgTable(
  "pagamento_documento_fornecedor",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    documentoFornecedorId: integer("documentoFornecedorId").notNull(),
    valor: numeric("valor", { precision: 12, scale: 2 }).notNull(),
    dataPagamento: timestamp("dataPagamento").notNull(),
    // Opcional: um pagamento pode ser registado antes de o lançamento
    // financeiro correspondente existir em `movimento`.
    movimentoId: integer("movimentoId"),
    userId: text("userId").notNull(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("pagamento_documento_fornecedor_condominio_idx").on(t.condominioId),
    index("pagamento_documento_fornecedor_documento_idx").on(
      t.documentoFornecedorId,
    ),
    index("pagamento_documento_fornecedor_movimento_idx").on(t.movimentoId),
    foreignKey({
      columns: [t.documentoFornecedorId, t.condominioId],
      foreignColumns: [documentoFornecedor.id, documentoFornecedor.condominioId],
      name: "pagamento_documento_fornecedor_documento_condominio_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.movimentoId, t.condominioId],
      foreignColumns: [movimento.id, movimento.condominioId],
      name: "pagamento_documento_fornecedor_movimento_condominio_fk",
    }).onDelete("set null"),
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
    // Capital seguro: valor de reconstrução pelo qual o edifício está
    // seguro — distinto do prémio, obrigatório atualizar anualmente
    // (DL nº 268/94). Opcional, tal como valorPremio.
    capitalSeguro: numeric("capitalSeguro", { precision: 12, scale: 2 }),
    notas: text("notas"),
    // Anexo da apólice em PDF (Vercel Blob, ver lib/storage.ts). Nome
    // distinto de `apolice`, que é o número da apólice, não o ficheiro.
    anexoUrl: text("anexoUrl"),
    anexoNomeFicheiro: text("anexoNomeFicheiro"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    // Soft-delete (auditoria jurídica 2026-07-22, achado DOC-01): o seguro
    // é prova de cumprimento da obrigação legal de seguro do edifício
    // (DL nº 268/94) — nunca deve desaparecer sem rasto, mesmo passado o
    // prazo de validade. Mesmo padrão de `movimento.deletedAt`.
    deletedAt: timestamp("deletedAt"),
  },
  (t) => [index("seguro_condominio_idx").on(t.condominioId)],
)

// Frações cobertas por um seguro, além do edifício/partes comuns (relação
// muitos-para-muitos: a mesma apólice do prédio pode incluir várias
// frações; outras frações têm seguro próprio, noutra seguradora, como um
// segundo registo `seguro` à parte). Um seguro sem nenhuma linha aqui só
// cobre o edifício.
export const seguroFracao = pgTable(
  "seguro_fracao",
  {
    id: serial("id").primaryKey(),
    seguroId: integer("seguroId")
      .notNull()
      .references(() => seguro.id, { onDelete: "cascade" }),
    fracaoId: integer("fracaoId")
      .notNull()
      .references(() => fracao.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("seguro_fracao_seguro_idx").on(t.seguroId),
    uniqueIndex("seguro_fracao_seguro_fracao_idx").on(t.seguroId, t.fracaoId),
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
    // Soft-delete (auditoria jurídica 2026-07-22, achado DOC-01) — mesmo
    // padrão de movimento/seguro.deletedAt.
    deletedAt: timestamp("deletedAt"),
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
    // Fornecedor a quem a ocorrência foi atribuída para tratar — opcional,
    // só regista "quem está a tratar disto", sem nenhuma ligação a despesas
    // ou aprovação de orçamento (fica para uma iteração futura). `set null`
    // em vez de cascade: eliminar o fornecedor nunca pode apagar a
    // ocorrência (mesmo padrão de movimento.fornecedorId).
    fornecedorId: integer("fornecedorId").references(() => fornecedor.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    // Soft-delete (auditoria jurídica 2026-07-22, achado DOC-01) — mesmo
    // padrão de movimento/seguro.deletedAt.
    deletedAt: timestamp("deletedAt"),
  },
  (t) => [
    index("ocorrencia_condominio_idx").on(t.condominioId),
    index("ocorrencia_fornecedor_idx").on(t.fornecedorId),
  ],
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
    // Controlo de permissões por documento (FUNCTIONAL_GAPS.md): por
    // omissão todos os documentos são visíveis a qualquer membro aprovado;
    // marcado como confidencial, só fica visível a quem já gere/audita o
    // condomínio (temConsultaGestao) — mesmo critério de minimização já
    // usado para IBAN/contactos, não uma lista de permissões por pessoa.
    confidencial: boolean("confidencial").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    // Soft-delete (auditoria jurídica 2026-07-22, achado DOC-01) — mesmo
    // padrão de movimento/seguro.deletedAt.
    deletedAt: timestamp("deletedAt"),
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
    // Número sequencial no livro de atas do condomínio, atribuído só na
    // aprovação (app/actions/assembleias.ts:aprovarAta) — assembleias
    // canceladas ou ainda por aprovar não consomem número.
    numero: integer("numero"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("assembleia_condominio_idx").on(t.condominioId),
    unique("assembleia_condominio_numero_uq").on(t.condominioId, t.numero),
  ],
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
    // Art. 1432º/4 CC: a convocatória tem de identificar os assuntos que só
    // podem ser aprovados por unanimidade — omiti-lo é vício de forma que
    // pode anular a deliberação. Marcado pelo administrador ao criar o ponto.
    exigeUnanimidade: boolean("exigeUnanimidade").notNull().default(false),
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

// Anexo à ata de uma assembleia (planta, orçamento discutido, proposta de
// fornecedor, etc.) — distinto de `documento`, que é solto, sem ligação a
// nenhuma assembleia específica. `condominioId` repetido (não só via join a
// `assembleia`) pelo mesmo motivo de `documento`/`ocorrencia`/`seguro`:
// permite a verificação direta em app/api/ficheiros/route.ts. Só ficheiro
// carregado, sem opção de link colado à mão (ao contrário de `documento`).
// Só pode ser adicionado/removido enquanto a assembleia não estiver
// aprovada/cancelada (ver assertEditavel em app/actions/assembleias.ts) —
// mesma garantia de imutabilidade da ata depois de fechada.
export const assembleiaAnexo = pgTable(
  "assembleia_anexo",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    assembleiaId: integer("assembleiaId")
      .notNull()
      .references(() => assembleia.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(),
    titulo: text("titulo").notNull(),
    url: text("url").notNull(),
    nomeFicheiro: text("nomeFicheiro"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [index("assembleia_anexo_assembleia_idx").on(t.assembleiaId)],
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

// Confirmação de leitura de um aviso ou de uma convocatória de assembleia
// por um membro — accountability perante a assembleia/administração
// ("provar" que um condómino teve acesso a uma comunicação). Registada por
// ação explícita do membro (botão "Confirmar leitura"), nunca automática só
// por a página ter sido carregada. `entidade`/`entidadeId` seguem o mesmo
// padrão de `audit_log` (sem FK real, porque a entidade varia).
export const confirmacaoLeitura = pgTable(
  "confirmacao_leitura",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    membroId: integer("membroId")
      .notNull()
      .references(() => membro.id, { onDelete: "cascade" }),
    entidade: text("entidade").notNull(), // "aviso" | "assembleia"
    entidadeId: integer("entidadeId").notNull(),
    confirmadoEm: timestamp("confirmadoEm").notNull().defaultNow(),
  },
  (t) => [
    index("confirmacao_leitura_entidade_idx").on(t.entidade, t.entidadeId),
    unique("confirmacao_leitura_membro_entidade_uq").on(t.membroId, t.entidade, t.entidadeId),
  ],
)

// Mensagens internas — canal de correspondência privada entre um membro
// (condómino/inquilino/fornecedor) e a administração (admin/gestor) do seu
// condomínio (FUNCTIONAL_GAPS.md, "Mensagens internas"). Sem tabela de
// "conversa" separada: o fio é implícito — todas as linhas com o mesmo
// `userId`, mesmo espírito de reaproveitar em vez de multiplicar entidades
// já usado no histórico de estado de ocorrências (audit_log).
// `userId`/`autorUserId` são texto sem FK para `membro.id`, tal como
// `ocorrencia.userId`/`audit_log.actorUserId` — porque a linha `membro` pode
// sofrer hard delete (removerMembro/rejeitarMembro em fracoes.ts, ex.
// sucessão por óbito); uma FK apagaria em cascata toda a correspondência,
// incluindo as respostas da administração. `autorNome`/`autorEhGestao` são
// denormalizados no momento do envio (a partir de quem escreve), para as
// queries de não lidas não dependerem de um join que pode falhar depois de
// o membro ser removido.
// Sem eliminação/edição na v1 — mensagens não se apagam nem editam.
export const mensagem = pgTable(
  "mensagem",
  {
    id: serial("id").primaryKey(),
    condominioId: integer("condominioId")
      .notNull()
      .references(() => condominio.id, { onDelete: "cascade" }),
    userId: text("userId").notNull(), // dono da conversa (lado não-gestão)
    autorUserId: text("autorUserId").notNull(), // quem escreveu esta mensagem
    autorNome: text("autorNome").notNull(),
    autorEhGestao: boolean("autorEhGestao").notNull(),
    conteudo: text("conteudo").notNull(),
    lida: boolean("lida").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => [
    index("mensagem_condominio_idx").on(t.condominioId),
    index("mensagem_user_idx").on(t.userId),
  ],
)
