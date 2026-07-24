CREATE TABLE "orcamento_rubrica" (
	"id" serial PRIMARY KEY NOT NULL,
	"orcamentoId" integer NOT NULL,
	"categoria" text NOT NULL,
	"valorOrcamentado" numeric(12, 2) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orcamento_rubrica" ADD CONSTRAINT "orcamento_rubrica_orcamentoId_orcamento_id_fk" FOREIGN KEY ("orcamentoId") REFERENCES "public"."orcamento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orcamento_rubrica_orcamento_idx" ON "orcamento_rubrica" USING btree ("orcamentoId");