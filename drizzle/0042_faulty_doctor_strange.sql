ALTER TABLE "movimento" ADD COLUMN "requerAprovacao" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "movimento" ADD COLUMN "urgente" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "movimento" ADD COLUMN "justificacaoUrgencia" text;