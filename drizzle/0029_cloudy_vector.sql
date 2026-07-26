ALTER TABLE "assembleia" ADD COLUMN "numero" integer;--> statement-breakpoint
ALTER TABLE "assembleia" ADD CONSTRAINT "assembleia_condominio_numero_uq" UNIQUE("condominioId","numero");