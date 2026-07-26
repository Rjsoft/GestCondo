CREATE TABLE "assembleia_anexo" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"assembleiaId" integer NOT NULL,
	"userId" text NOT NULL,
	"titulo" text NOT NULL,
	"url" text NOT NULL,
	"nomeFicheiro" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assembleia_anexo" ADD CONSTRAINT "assembleia_anexo_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembleia_anexo" ADD CONSTRAINT "assembleia_anexo_assembleiaId_assembleia_id_fk" FOREIGN KEY ("assembleiaId") REFERENCES "public"."assembleia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assembleia_anexo_assembleia_idx" ON "assembleia_anexo" USING btree ("assembleiaId");