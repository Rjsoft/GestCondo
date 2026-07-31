DROP INDEX "membro_user_condominio_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "membro_user_condominio_fracao_idx" ON "membro" USING btree ("userId","condominioId","fracaoId") WHERE "fracaoId" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "membro_user_condominio_sem_fracao_idx" ON "membro" USING btree ("userId","condominioId") WHERE "fracaoId" IS NULL;