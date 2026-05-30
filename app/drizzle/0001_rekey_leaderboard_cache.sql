DROP TABLE IF EXISTS "leaderboard_cache" CASCADE;
--> statement-breakpoint
CREATE TABLE "leaderboard_cache" (
	"tournament_id" integer NOT NULL,
	"wallet" text NOT NULL,
	"pts" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboard_cache_tournament_id_wallet_pk" PRIMARY KEY("tournament_id","wallet")
);
