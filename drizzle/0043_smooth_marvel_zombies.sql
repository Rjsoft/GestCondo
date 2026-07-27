CREATE TABLE "orcamento_obra" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"userId" text NOT NULL,
	"assunto" text NOT NULL,
	"ocorrenciaId" integer,
	"fornecedorId" integer,
	"valor" numeric(12, 2) NOT NULL,
	"descricao" text,
	"anexoUrl" text,
	"anexoNomeFicheiro" text,
	"vencedor" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "orcamento_obra" ADD CONSTRAINT "orcamento_obra_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamento_obra" ADD CONSTRAINT "orcamento_obra_ocorrenciaId_ocorrencia_id_fk" FOREIGN KEY ("ocorrenciaId") REFERENCES "public"."ocorrencia"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamento_obra" ADD CONSTRAINT "orcamento_obra_fornecedorId_fornecedor_id_fk" FOREIGN KEY ("fornecedorId") REFERENCES "public"."fornecedor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orcamento_obra_condominio_idx" ON "orcamento_obra" USING btree ("condominioId");--> statement-breakpoint
CREATE INDEX "orcamento_obra_ocorrencia_idx" ON "orcamento_obra" USING btree ("ocorrenciaId");--> statement-breakpoint
CREATE INDEX "orcamento_obra_fornecedor_idx" ON "orcamento_obra" USING btree ("fornecedorId");