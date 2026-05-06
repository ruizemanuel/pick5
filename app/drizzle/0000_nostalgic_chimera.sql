CREATE TABLE "coach_picks" (
	"id" serial PRIMARY KEY NOT NULL,
	"mw" integer NOT NULL,
	"player_ids" integer[] NOT NULL,
	"reasoning" jsonb NOT NULL,
	"commitment_hash" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"publish_tx_hash" text,
	"revealed_at" timestamp with time zone,
	"reveal_tx_hash" text,
	"accuracy" integer
);
--> statement-breakpoint
CREATE TABLE "leaderboard_cache" (
	"wallet" text PRIMARY KEY NOT NULL,
	"mw37_pts" integer DEFAULT 0 NOT NULL,
	"mw38_pts" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oracle_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"mw" integer NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"tx_hash" text,
	"error" text,
	"random_seed" text
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"wallet" text PRIMARY KEY NOT NULL,
	"fpl_display_name" text,
	"self_verified_at" timestamp with time zone,
	"posthog_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "coach_picks_mw_uq" ON "coach_picks" USING btree ("mw");