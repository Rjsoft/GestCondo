CREATE TABLE "log_plataforma" (
	"id" serial PRIMARY KEY NOT NULL,
	"acao" text NOT NULL,
	"operadorUserId" text NOT NULL,
	"operadorEmail" text NOT NULL,
	"autorUserId" text NOT NULL,
	"autorEmail" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
