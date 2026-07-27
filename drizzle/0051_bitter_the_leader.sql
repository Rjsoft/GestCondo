ALTER TABLE "membro" ADD COLUMN "fornecedorId" integer;--> statement-breakpoint
ALTER TABLE "membro" ADD CONSTRAINT "membro_fornecedorId_fornecedor_id_fk" FOREIGN KEY ("fornecedorId") REFERENCES "public"."fornecedor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "membro_fornecedor_idx" ON "membro" USING btree ("fornecedorId");