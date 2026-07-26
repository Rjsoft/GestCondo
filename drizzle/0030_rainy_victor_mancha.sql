CREATE TABLE "confirmacao_leitura" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"membroId" integer NOT NULL,
	"entidade" text NOT NULL,
	"entidadeId" integer NOT NULL,
	"confirmadoEm" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "confirmacao_leitura_membro_entidade_uq" UNIQUE("membroId","entidade","entidadeId")
);
--> statement-breakpoint
ALTER TABLE "confirmacao_leitura" ADD CONSTRAINT "confirmacao_leitura_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmacao_leitura" ADD CONSTRAINT "confirmacao_leitura_membroId_membro_id_fk" FOREIGN KEY ("membroId") REFERENCES "public"."membro"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "confirmacao_leitura_entidade_idx" ON "confirmacao_leitura" USING btree ("entidade","entidadeId");