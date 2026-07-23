CREATE TABLE "seguro_fracao" (
	"id" serial PRIMARY KEY NOT NULL,
	"seguroId" integer NOT NULL,
	"fracaoId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seguro_fracao" ADD CONSTRAINT "seguro_fracao_seguroId_seguro_id_fk" FOREIGN KEY ("seguroId") REFERENCES "public"."seguro"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seguro_fracao" ADD CONSTRAINT "seguro_fracao_fracaoId_fracao_id_fk" FOREIGN KEY ("fracaoId") REFERENCES "public"."fracao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seguro_fracao_seguro_idx" ON "seguro_fracao" USING btree ("seguroId");--> statement-breakpoint
CREATE UNIQUE INDEX "seguro_fracao_seguro_fracao_idx" ON "seguro_fracao" USING btree ("seguroId","fracaoId");