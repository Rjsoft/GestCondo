CREATE TABLE "contrato" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"userId" text NOT NULL,
	"fornecedorId" integer,
	"objeto" text NOT NULL,
	"categoria" text,
	"valor" numeric(12, 2),
	"periodicidade" text DEFAULT 'anual' NOT NULL,
	"dataInicio" timestamp NOT NULL,
	"dataFim" timestamp,
	"renovacaoAutomatica" boolean DEFAULT false NOT NULL,
	"prazoDenunciaDias" integer,
	"notas" text,
	"anexoUrl" text,
	"anexoNomeFicheiro" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_fornecedorId_fornecedor_id_fk" FOREIGN KEY ("fornecedorId") REFERENCES "public"."fornecedor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contrato_condominio_idx" ON "contrato" USING btree ("condominioId");--> statement-breakpoint
CREATE INDEX "contrato_fornecedor_idx" ON "contrato" USING btree ("fornecedorId");