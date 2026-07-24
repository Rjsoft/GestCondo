ALTER TABLE "movimento" ADD CONSTRAINT "movimento_id_condominio_uq" UNIQUE("id","condominioId");--> statement-breakpoint
CREATE TABLE "documento_fornecedor" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"userId" text NOT NULL,
	"fornecedorId" integer,
	"numeroLancamento" serial NOT NULL,
	"numeroDocumento" text,
	"categoria" text NOT NULL,
	"dataEmissao" timestamp NOT NULL,
	"dataVencimento" timestamp,
	"valor" numeric(12, 2) NOT NULL,
	"anexoUrl" text,
	"anexoNomeFicheiro" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "documento_fornecedor_id_condominio_uq" UNIQUE("id","condominioId")
);
--> statement-breakpoint
CREATE TABLE "pagamento_documento_fornecedor" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"documentoFornecedorId" integer NOT NULL,
	"valor" numeric(12, 2) NOT NULL,
	"dataPagamento" timestamp NOT NULL,
	"movimentoId" integer,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documento_fornecedor" ADD CONSTRAINT "documento_fornecedor_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documento_fornecedor" ADD CONSTRAINT "documento_fornecedor_fornecedorId_fornecedor_id_fk" FOREIGN KEY ("fornecedorId") REFERENCES "public"."fornecedor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamento_documento_fornecedor" ADD CONSTRAINT "pagamento_documento_fornecedor_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamento_documento_fornecedor" ADD CONSTRAINT "pagamento_documento_fornecedor_documento_condominio_fk" FOREIGN KEY ("documentoFornecedorId","condominioId") REFERENCES "public"."documento_fornecedor"("id","condominioId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagamento_documento_fornecedor" ADD CONSTRAINT "pagamento_documento_fornecedor_movimento_condominio_fk" FOREIGN KEY ("movimentoId","condominioId") REFERENCES "public"."movimento"("id","condominioId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documento_fornecedor_condominio_idx" ON "documento_fornecedor" USING btree ("condominioId");--> statement-breakpoint
CREATE INDEX "documento_fornecedor_fornecedor_idx" ON "documento_fornecedor" USING btree ("fornecedorId");--> statement-breakpoint
CREATE INDEX "pagamento_documento_fornecedor_condominio_idx" ON "pagamento_documento_fornecedor" USING btree ("condominioId");--> statement-breakpoint
CREATE INDEX "pagamento_documento_fornecedor_documento_idx" ON "pagamento_documento_fornecedor" USING btree ("documentoFornecedorId");--> statement-breakpoint
CREATE INDEX "pagamento_documento_fornecedor_movimento_idx" ON "pagamento_documento_fornecedor" USING btree ("movimentoId");