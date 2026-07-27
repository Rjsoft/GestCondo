CREATE TABLE "lembrete_cobranca" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"fracaoId" integer NOT NULL,
	"escalao" text NOT NULL,
	"dataEnvio" timestamp DEFAULT now() NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lembrete_cobranca" ADD CONSTRAINT "lembrete_cobranca_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lembrete_cobranca" ADD CONSTRAINT "lembrete_cobranca_fracaoId_fracao_id_fk" FOREIGN KEY ("fracaoId") REFERENCES "public"."fracao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lembrete_cobranca_fracao_idx" ON "lembrete_cobranca" USING btree ("fracaoId");