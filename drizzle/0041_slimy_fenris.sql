CREATE TABLE "mensagem" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"userId" text NOT NULL,
	"autorUserId" text NOT NULL,
	"autorNome" text NOT NULL,
	"autorEhGestao" boolean NOT NULL,
	"conteudo" text NOT NULL,
	"lida" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mensagem" ADD CONSTRAINT "mensagem_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mensagem_condominio_idx" ON "mensagem" USING btree ("condominioId");--> statement-breakpoint
CREATE INDEX "mensagem_user_idx" ON "mensagem" USING btree ("userId");