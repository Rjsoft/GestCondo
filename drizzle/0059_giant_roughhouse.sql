CREATE TABLE "documento_cobranca_emitido" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"fracaoId" integer NOT NULL,
	"processoCobrancaId" integer,
	"tipo" text NOT NULL,
	"userId" text NOT NULL,
	"autorNome" text NOT NULL,
	"destinatario" text NOT NULL,
	"valorDivida" numeric(10, 2) NOT NULL,
	"prazoDias" integer,
	"templateVersao" text NOT NULL,
	"snapshotJson" text NOT NULL,
	"snapshotHash" text NOT NULL,
	"emitidoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prestacao" (
	"id" serial PRIMARY KEY NOT NULL,
	"processoCobrancaId" integer NOT NULL,
	"numero" integer NOT NULL,
	"dataPrevista" timestamp NOT NULL,
	"valor" numeric(10, 2) NOT NULL,
	"estado" text DEFAULT 'pendente' NOT NULL,
	"cumpridaEm" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processo_cobranca" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"fracaoId" integer NOT NULL,
	"estado" text DEFAULT 'em_atraso' NOT NULL,
	"notas" text,
	"abertoPorUserId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processo_cobranca_transicao" (
	"id" serial PRIMARY KEY NOT NULL,
	"processoCobrancaId" integer NOT NULL,
	"estadoAnterior" text,
	"estadoNovo" text NOT NULL,
	"userId" text NOT NULL,
	"autorNome" text NOT NULL,
	"nota" text,
	"data" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documento_cobranca_emitido" ADD CONSTRAINT "documento_cobranca_emitido_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documento_cobranca_emitido" ADD CONSTRAINT "documento_cobranca_emitido_fracaoId_fracao_id_fk" FOREIGN KEY ("fracaoId") REFERENCES "public"."fracao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documento_cobranca_emitido" ADD CONSTRAINT "documento_cobranca_emitido_processoCobrancaId_processo_cobranca_id_fk" FOREIGN KEY ("processoCobrancaId") REFERENCES "public"."processo_cobranca"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prestacao" ADD CONSTRAINT "prestacao_processoCobrancaId_processo_cobranca_id_fk" FOREIGN KEY ("processoCobrancaId") REFERENCES "public"."processo_cobranca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processo_cobranca" ADD CONSTRAINT "processo_cobranca_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processo_cobranca" ADD CONSTRAINT "processo_cobranca_fracaoId_fracao_id_fk" FOREIGN KEY ("fracaoId") REFERENCES "public"."fracao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processo_cobranca_transicao" ADD CONSTRAINT "processo_cobranca_transicao_processoCobrancaId_processo_cobranca_id_fk" FOREIGN KEY ("processoCobrancaId") REFERENCES "public"."processo_cobranca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documento_cobranca_emitido_fracao_idx" ON "documento_cobranca_emitido" USING btree ("fracaoId");--> statement-breakpoint
CREATE INDEX "prestacao_processo_idx" ON "prestacao" USING btree ("processoCobrancaId");--> statement-breakpoint
CREATE INDEX "processo_cobranca_fracao_idx" ON "processo_cobranca" USING btree ("fracaoId");--> statement-breakpoint
CREATE UNIQUE INDEX "processo_cobranca_fracao_aberto_idx" ON "processo_cobranca" USING btree ("fracaoId") WHERE estado not in ('regularizado', 'encerrado', 'cancelado');--> statement-breakpoint
CREATE INDEX "processo_cobranca_transicao_processo_idx" ON "processo_cobranca_transicao" USING btree ("processoCobrancaId");