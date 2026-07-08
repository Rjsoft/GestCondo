CREATE TABLE "seguro" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"userId" text NOT NULL,
	"seguradora" text NOT NULL,
	"apolice" text NOT NULL,
	"tipo" text DEFAULT 'multirriscos' NOT NULL,
	"dataInicio" timestamp NOT NULL,
	"dataFim" timestamp NOT NULL,
	"valorPremio" numeric(12, 2),
	"notas" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "movimento" ADD COLUMN "destino" text DEFAULT 'geral' NOT NULL;--> statement-breakpoint
ALTER TABLE "seguro" ADD CONSTRAINT "seguro_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seguro_condominio_idx" ON "seguro" USING btree ("condominioId");