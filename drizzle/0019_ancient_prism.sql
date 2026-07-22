ALTER TABLE "aviso" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "documento" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "ocorrencia" ADD COLUMN "deletedAt" timestamp;