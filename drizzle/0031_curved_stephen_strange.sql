ALTER TABLE "condominio" ADD COLUMN "estadoSubscricao" text DEFAULT 'ativo' NOT NULL;--> statement-breakpoint
ALTER TABLE "condominio" ADD COLUMN "notaSubscricao" text;--> statement-breakpoint
ALTER TABLE "condominio" ADD COLUMN "subscricaoAtualizadaEm" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "operadorPlataforma" boolean DEFAULT false NOT NULL;