CREATE TABLE "comunicacao_deliberacao" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"userId" text NOT NULL,
	"pontoId" integer NOT NULL,
	"fracaoId" integer NOT NULL,
	"metodo" text NOT NULL,
	"dataEnvio" timestamp NOT NULL,
	"referenciaEnvio" text,
	"resposta" text,
	"dataResposta" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comunicacao_deliberacao_ponto_fracao_uq" UNIQUE("pontoId","fracaoId")
);
--> statement-breakpoint
ALTER TABLE "comunicacao_deliberacao" ADD CONSTRAINT "comunicacao_deliberacao_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comunicacao_deliberacao" ADD CONSTRAINT "comunicacao_deliberacao_pontoId_assembleia_ponto_id_fk" FOREIGN KEY ("pontoId") REFERENCES "public"."assembleia_ponto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comunicacao_deliberacao" ADD CONSTRAINT "comunicacao_deliberacao_fracaoId_fracao_id_fk" FOREIGN KEY ("fracaoId") REFERENCES "public"."fracao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comunicacao_deliberacao_ponto_idx" ON "comunicacao_deliberacao" USING btree ("pontoId");