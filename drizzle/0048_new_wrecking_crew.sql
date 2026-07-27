CREATE TABLE "fracao_credito" (
	"id" serial PRIMARY KEY NOT NULL,
	"fracaoId" integer NOT NULL,
	"tipo" text NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"movimentoId" integer,
	"notas" text,
	"data" timestamp DEFAULT now() NOT NULL,
	"userId" text NOT NULL,
	"autorNome" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fracao_credito" ADD CONSTRAINT "fracao_credito_fracaoId_fracao_id_fk" FOREIGN KEY ("fracaoId") REFERENCES "public"."fracao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fracao_credito" ADD CONSTRAINT "fracao_credito_movimentoId_movimento_id_fk" FOREIGN KEY ("movimentoId") REFERENCES "public"."movimento"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fracao_credito_fracao_idx" ON "fracao_credito" USING btree ("fracaoId");