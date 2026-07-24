CREATE TABLE "conta_financeira" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"nome" text NOT NULL,
	"banco" text,
	"iban" text,
	"tipo" text NOT NULL,
	"moeda" text DEFAULT 'EUR' NOT NULL,
	"estado" text DEFAULT 'ativa' NOT NULL,
	"dataAbertura" date,
	"dataEncerramento" date,
	"notaTransitoria" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conta_financeira_id_condominio_uq" UNIQUE("id","condominioId")
);
--> statement-breakpoint
CREATE TABLE "exercicio_financeiro" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"designacao" text NOT NULL,
	"anoPrincipal" integer NOT NULL,
	"dataInicio" date NOT NULL,
	"dataFim" date NOT NULL,
	"estado" text DEFAULT 'aberto' NOT NULL,
	"fechadoEm" timestamp,
	"fechadoPorUserId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exercicio_financeiro_id_condominio_uq" UNIQUE("id","condominioId")
);
--> statement-breakpoint
CREATE TABLE "saldo_inicial_conta" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"contaFinanceiraId" integer NOT NULL,
	"exercicioId" integer NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"origem" text NOT NULL,
	"definidoPorUserId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "extratoBancario" ADD COLUMN "contaFinanceiraId" integer;--> statement-breakpoint
ALTER TABLE "movimento" ADD COLUMN "exercicioId" integer;--> statement-breakpoint
ALTER TABLE "movimento" ADD COLUMN "contaFinanceiraId" integer;--> statement-breakpoint
ALTER TABLE "conta_financeira" ADD CONSTRAINT "conta_financeira_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercicio_financeiro" ADD CONSTRAINT "exercicio_financeiro_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saldo_inicial_conta" ADD CONSTRAINT "saldo_inicial_conta_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saldo_inicial_conta" ADD CONSTRAINT "saldo_inicial_conta_conta_condominio_fk" FOREIGN KEY ("contaFinanceiraId","condominioId") REFERENCES "public"."conta_financeira"("id","condominioId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saldo_inicial_conta" ADD CONSTRAINT "saldo_inicial_conta_exercicio_condominio_fk" FOREIGN KEY ("exercicioId","condominioId") REFERENCES "public"."exercicio_financeiro"("id","condominioId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conta_financeira_condominio_idx" ON "conta_financeira" USING btree ("condominioId");--> statement-breakpoint
CREATE INDEX "exercicio_financeiro_condominio_idx" ON "exercicio_financeiro" USING btree ("condominioId");--> statement-breakpoint
CREATE UNIQUE INDEX "saldo_inicial_conta_conta_exercicio_idx" ON "saldo_inicial_conta" USING btree ("contaFinanceiraId","exercicioId");--> statement-breakpoint
ALTER TABLE "extratoBancario" ADD CONSTRAINT "extrato_bancario_conta_financeira_condominio_fk" FOREIGN KEY ("contaFinanceiraId","condominioId") REFERENCES "public"."conta_financeira"("id","condominioId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimento" ADD CONSTRAINT "movimento_exercicio_condominio_fk" FOREIGN KEY ("exercicioId","condominioId") REFERENCES "public"."exercicio_financeiro"("id","condominioId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimento" ADD CONSTRAINT "movimento_conta_financeira_condominio_fk" FOREIGN KEY ("contaFinanceiraId","condominioId") REFERENCES "public"."conta_financeira"("id","condominioId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "extrato_bancario_conta_financeira_idx" ON "extratoBancario" USING btree ("contaFinanceiraId");--> statement-breakpoint
CREATE INDEX "movimento_exercicio_idx" ON "movimento" USING btree ("exercicioId");--> statement-breakpoint
CREATE INDEX "movimento_conta_financeira_idx" ON "movimento" USING btree ("contaFinanceiraId");--> statement-breakpoint
-- Adicionado à mão (drizzle-kit não tem um construtor nativo para EXCLUDE):
-- impede exercícios com datas sobrepostas no mesmo condomínio. Testado
-- isoladamente em transação revertida em dev antes de aqui incluído — ver
-- docs/product/MBD_GEST_GAP_ANALYSIS.md. dataInicio/dataFim são inclusivas
-- ('[]'), por isso um exercício não pode começar no mesmo dia em que o
-- anterior termina. Qualquer migração futura que recrie esta tabela do
-- zero (ex. drizzle-kit push destrutivo) tem de reintroduzir isto à mão.
CREATE EXTENSION IF NOT EXISTS "btree_gist";--> statement-breakpoint
ALTER TABLE "exercicio_financeiro" ADD CONSTRAINT "exercicio_financeiro_sem_sobreposicao"
  EXCLUDE USING gist ("condominioId" WITH =, daterange("dataInicio", "dataFim", '[]') WITH &&);