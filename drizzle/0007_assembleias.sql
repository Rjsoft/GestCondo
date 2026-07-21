CREATE TABLE "assembleia" (
	"id" serial PRIMARY KEY NOT NULL,
	"condominioId" integer NOT NULL,
	"userId" text NOT NULL,
	"tipo" text DEFAULT 'ordinaria' NOT NULL,
	"local" text NOT NULL,
	"dataPrimeiraConvocatoria" timestamp NOT NULL,
	"dataSegundaConvocatoria" timestamp,
	"estado" text DEFAULT 'convocada' NOT NULL,
	"textoAta" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assembleia_ponto" (
	"id" serial PRIMARY KEY NOT NULL,
	"assembleiaId" integer NOT NULL,
	"ordem" integer NOT NULL,
	"titulo" text NOT NULL,
	"descricao" text,
	"resultado" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assembleia_presenca" (
	"id" serial PRIMARY KEY NOT NULL,
	"assembleiaId" integer NOT NULL,
	"fracaoId" integer NOT NULL,
	"tipo" text DEFAULT 'presencial' NOT NULL,
	"representante" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assembleia_voto" (
	"id" serial PRIMARY KEY NOT NULL,
	"pontoId" integer NOT NULL,
	"fracaoId" integer NOT NULL,
	"voto" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assembleia" ADD CONSTRAINT "assembleia_condominioId_condominio_id_fk" FOREIGN KEY ("condominioId") REFERENCES "public"."condominio"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembleia_ponto" ADD CONSTRAINT "assembleia_ponto_assembleiaId_assembleia_id_fk" FOREIGN KEY ("assembleiaId") REFERENCES "public"."assembleia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembleia_presenca" ADD CONSTRAINT "assembleia_presenca_assembleiaId_assembleia_id_fk" FOREIGN KEY ("assembleiaId") REFERENCES "public"."assembleia"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembleia_presenca" ADD CONSTRAINT "assembleia_presenca_fracaoId_fracao_id_fk" FOREIGN KEY ("fracaoId") REFERENCES "public"."fracao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembleia_voto" ADD CONSTRAINT "assembleia_voto_pontoId_assembleia_ponto_id_fk" FOREIGN KEY ("pontoId") REFERENCES "public"."assembleia_ponto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assembleia_voto" ADD CONSTRAINT "assembleia_voto_fracaoId_fracao_id_fk" FOREIGN KEY ("fracaoId") REFERENCES "public"."fracao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assembleia_condominio_idx" ON "assembleia" USING btree ("condominioId");--> statement-breakpoint
CREATE INDEX "assembleia_ponto_assembleia_idx" ON "assembleia_ponto" USING btree ("assembleiaId");--> statement-breakpoint
CREATE INDEX "assembleia_presenca_assembleia_idx" ON "assembleia_presenca" USING btree ("assembleiaId");--> statement-breakpoint
CREATE UNIQUE INDEX "assembleia_presenca_fracao_idx" ON "assembleia_presenca" USING btree ("assembleiaId","fracaoId");--> statement-breakpoint
CREATE INDEX "assembleia_voto_ponto_idx" ON "assembleia_voto" USING btree ("pontoId");--> statement-breakpoint
CREATE UNIQUE INDEX "assembleia_voto_ponto_fracao_idx" ON "assembleia_voto" USING btree ("pontoId","fracaoId");