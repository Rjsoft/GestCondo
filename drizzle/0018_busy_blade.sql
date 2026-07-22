CREATE TABLE "fornecedor" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"userId" text NOT NULL,
	"nome" text NOT NULL,
	"nif" text,
	"categoria" text,
	"contactoEmail" text,
	"contactoTelefone" text,
	"notas" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fornecedor" ADD CONSTRAINT "fornecedor_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fornecedor_condominio_idx" ON "fornecedor" USING btree ("condominioId");