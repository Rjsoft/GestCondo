CREATE TABLE "fracao_transmissao" (
	"id" serial PRIMARY KEY NOT NULL,
	"fracaoId" integer NOT NULL,
	"vendedorNome" text NOT NULL,
	"vendedorNif" text,
	"compradorNome" text NOT NULL,
	"compradorNif" text,
	"dataEscritura" timestamp NOT NULL,
	"saldoNaData" numeric(12, 2) NOT NULL,
	"decisaoSaldo" text NOT NULL,
	"notas" text,
	"userId" text NOT NULL,
	"autorNome" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fracao_transmissao" ADD CONSTRAINT "fracao_transmissao_fracaoId_fracao_id_fk" FOREIGN KEY ("fracaoId") REFERENCES "public"."fracao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fracao_transmissao_fracao_idx" ON "fracao_transmissao" USING btree ("fracaoId");