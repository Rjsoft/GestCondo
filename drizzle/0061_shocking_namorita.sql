CREATE TABLE "fundo_reserva_reposicao" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"descricao" text NOT NULL,
	"valorAReposicao" numeric(12, 2) NOT NULL,
	"dataInicio" timestamp DEFAULT now() NOT NULL,
	"dataLimite" timestamp,
	"assembleiaPontoId" integer,
	"estado" text DEFAULT 'em_curso' NOT NULL,
	"notas" text,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fundo_reserva_reposicao" ADD CONSTRAINT "fundo_reserva_reposicao_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fundo_reserva_reposicao" ADD CONSTRAINT "fundo_reserva_reposicao_assembleiaPontoId_assembleia_ponto_id_fk" FOREIGN KEY ("assembleiaPontoId") REFERENCES "public"."assembleia_ponto"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fundo_reserva_reposicao_condominio_idx" ON "fundo_reserva_reposicao" USING btree ("condominioId");--> statement-breakpoint
CREATE UNIQUE INDEX "fundo_reserva_reposicao_em_curso_idx" ON "fundo_reserva_reposicao" USING btree ("condominioId") WHERE estado = 'em_curso';