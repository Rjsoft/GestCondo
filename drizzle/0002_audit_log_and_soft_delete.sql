CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"actorUserId" text NOT NULL,
	"actorNome" text NOT NULL,
	"acao" text NOT NULL,
	"entidade" text NOT NULL,
	"entidadeId" integer NOT NULL,
	"detalhes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "movimento" ADD COLUMN "deletedAt" timestamp;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_condominio_idx" ON "audit_log" USING btree ("condominioId");--> statement-breakpoint
CREATE INDEX "audit_log_entidade_idx" ON "audit_log" USING btree ("entidade","entidadeId");