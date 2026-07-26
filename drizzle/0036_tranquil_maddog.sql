CREATE TABLE "patrimonio" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"userId" text NOT NULL,
	"nome" text NOT NULL,
	"categoria" text,
	"dataAquisicao" timestamp,
	"valorAquisicao" numeric(10, 2),
	"valorAtual" numeric(10, 2),
	"notas" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patrimonio" ADD CONSTRAINT "patrimonio_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "patrimonio_condominio_idx" ON "patrimonio" USING btree ("condominioId");