ALTER TABLE "movimento" ADD COLUMN "fornecedorId" integer;--> statement-breakpoint
ALTER TABLE "movimento" ADD CONSTRAINT "movimento_fornecedorId_fornecedor_id_fk" FOREIGN KEY ("fornecedorId") REFERENCES "public"."fornecedor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "movimento_fornecedor_idx" ON "movimento" USING btree ("fornecedorId");