CREATE TABLE "extratoBancario" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"userId" text NOT NULL,
	"data" timestamp NOT NULL,
	"descricao" text NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"conciliadoMovimentoId" integer,
	"ignorado" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "extratoBancario" ADD CONSTRAINT "extratoBancario_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extratoBancario" ADD CONSTRAINT "extratoBancario_conciliadoMovimentoId_movimento_id_fk" FOREIGN KEY ("conciliadoMovimentoId") REFERENCES "public"."movimento"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "extrato_bancario_condominio_idx" ON "extratoBancario" USING btree ("condominioId");