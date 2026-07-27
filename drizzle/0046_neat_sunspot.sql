CREATE TABLE "documento_versao" (
	"id" serial PRIMARY KEY NOT NULL,
	"documentoId" integer NOT NULL,
	"userId" text NOT NULL,
	"autorNome" text NOT NULL,
	"titulo" text NOT NULL,
	"url" text,
	"nomeFicheiro" text,
	"motivo" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documento_versao" ADD CONSTRAINT "documento_versao_documentoId_documento_id_fk" FOREIGN KEY ("documentoId") REFERENCES "public"."documento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documento_versao_documento_idx" ON "documento_versao" USING btree ("documentoId");