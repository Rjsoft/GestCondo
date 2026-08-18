CREATE TABLE "fracao_titular" (
	"id" serial PRIMARY KEY NOT NULL,
	"fracaoId" integer NOT NULL,
	"nome" text NOT NULL,
	"nif" text,
	"tipoTitular" text DEFAULT 'proprietario' NOT NULL,
	"contactoEmail" text,
	"contactoTelefone" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fracao_titular" ADD CONSTRAINT "fracao_titular_fracaoId_fracao_id_fk" FOREIGN KEY ("fracaoId") REFERENCES "public"."fracao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fracao_titular_fracao_idx" ON "fracao_titular" USING btree ("fracaoId");