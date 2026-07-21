ALTER TABLE "movimento" ADD COLUMN "orcamentoId" integer;--> statement-breakpoint
ALTER TABLE "movimento" ADD CONSTRAINT "movimento_orcamentoId_orcamento_id_fk" FOREIGN KEY ("orcamentoId") REFERENCES "public"."orcamento"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "movimento_orcamento_idx" ON "movimento" USING btree ("orcamentoId");