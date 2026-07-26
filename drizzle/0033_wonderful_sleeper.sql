ALTER TABLE "ocorrencia" ADD COLUMN "fornecedorId" integer;--> statement-breakpoint
ALTER TABLE "ocorrencia" ADD CONSTRAINT "ocorrencia_fornecedorId_fornecedor_id_fk" FOREIGN KEY ("fornecedorId") REFERENCES "public"."fornecedor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ocorrencia_fornecedor_idx" ON "ocorrencia" USING btree ("fornecedorId");