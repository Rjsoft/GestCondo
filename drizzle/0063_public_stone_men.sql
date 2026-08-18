ALTER TABLE "fundo_reserva_reposicao" ALTER COLUMN "dataInicio" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "fundo_reserva_reposicao" ALTER COLUMN "dataInicio" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "fundo_reserva_reposicao" ALTER COLUMN "dataLimite" SET DATA TYPE date;