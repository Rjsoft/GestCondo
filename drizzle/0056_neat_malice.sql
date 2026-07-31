CREATE TABLE "acesso_convidado" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"assembleiaId" integer NOT NULL,
	"criadoPorUserId" text NOT NULL,
	"token" text NOT NULL,
	"descricao" text,
	"expiraEm" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"revogadoEm" timestamp,
	"numeroAcessos" integer DEFAULT 0 NOT NULL,
	"ultimoAcessoEm" timestamp
);
--> statement-breakpoint
ALTER TABLE "acesso_convidado" ADD CONSTRAINT "acesso_convidado_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acesso_convidado" ADD CONSTRAINT "acesso_convidado_assembleiaId_assembleia_id_fk" FOREIGN KEY ("assembleiaId") REFERENCES "public"."assembleia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "acesso_convidado_token_idx" ON "acesso_convidado" USING btree ("token");--> statement-breakpoint
CREATE INDEX "acesso_convidado_condominio_idx" ON "acesso_convidado" USING btree ("condominioId");--> statement-breakpoint
CREATE INDEX "acesso_convidado_assembleia_idx" ON "acesso_convidado" USING btree ("assembleiaId");