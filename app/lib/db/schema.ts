import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const coachPicks = pgTable(
  "coach_picks",
  {
    id: serial("id").primaryKey(),
    mw: integer("mw").notNull(),
    playerIds: integer("player_ids").array().notNull(),
    reasoning: jsonb("reasoning").$type<string[]>().notNull(),
    commitmentHash: text("commitment_hash").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    publishTxHash: text("publish_tx_hash"),
    revealedAt: timestamp("revealed_at", { withTimezone: true }),
    revealTxHash: text("reveal_tx_hash"),
    accuracy: integer("accuracy"),
  },
  (t) => ({ mwUq: uniqueIndex("coach_picks_mw_uq").on(t.mw) })
);

export const oracleRuns = pgTable("oracle_runs", {
  id: serial("id").primaryKey(),
  mw: integer("mw").notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  status: text("status").notNull(),
  txHash: text("tx_hash"),
  error: text("error"),
  randomSeed: text("random_seed"),
});

export const userProfiles = pgTable("user_profiles", {
  wallet: text("wallet").primaryKey(),
  fplDisplayName: text("fpl_display_name"),
  selfVerifiedAt: timestamp("self_verified_at", { withTimezone: true }),
  posthogId: text("posthog_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const leaderboardCache = pgTable("leaderboard_cache", {
  wallet: text("wallet").primaryKey(),
  mw37Pts: integer("mw37_pts").default(0).notNull(),
  mw38Pts: integer("mw38_pts").default(0).notNull(),
  rank: integer("rank"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
