ALTER TABLE "membro" ADD COLUMN "fracaoId" integer;--> statement-breakpoint
ALTER TABLE "membro" ADD CONSTRAINT "membro_fracaoId_fracao_id_fk" FOREIGN KEY ("fracaoId") REFERENCES "public"."fracao"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "membro_fracao_idx" ON "membro" USING btree ("fracaoId");