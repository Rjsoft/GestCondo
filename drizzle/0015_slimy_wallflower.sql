ALTER TABLE "condominio" ADD COLUMN "codigoConvite" text;--> statement-breakpoint
ALTER TABLE "condominio" ADD CONSTRAINT "condominio_codigoConvite_unique" UNIQUE("codigoConvite");