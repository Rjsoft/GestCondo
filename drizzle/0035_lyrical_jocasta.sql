CREATE TABLE "contacto_emergencia" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"userId" text NOT NULL,
	"nome" text NOT NULL,
	"telefone" text NOT NULL,
	"descricao" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacto_emergencia" ADD CONSTRAINT "contacto_emergencia_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contacto_emergencia_condominio_idx" ON "contacto_emergencia" USING btree ("condominioId");