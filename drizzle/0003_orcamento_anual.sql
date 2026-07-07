CREATE TABLE "orcamento" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"userId" text NOT NULL,
	"ano" integer NOT NULL,
	"valorAnual" numeric(12, 2) NOT NULL,
	"notas" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orcamento" ADD CONSTRAINT "orcamento_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orcamento_condominio_idx" ON "orcamento" USING btree ("condominioId");--> statement-breakpoint
CREATE UNIQUE INDEX "orcamento_condominio_ano_idx" ON "orcamento" USING btree ("condominioId","ano");