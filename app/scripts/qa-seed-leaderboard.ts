// QA helper: seed leaderboard_cache for the active season's first fecha so
// /leaderboard renders the podium during a compressed test tournament where
// real FPL live stats are still 0.

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { leaderboardCache } from "../lib/db/schema";
import { getActiveSeason } from "../lib/tournaments/seasons";

const TID = getActiveSeason().fechas[0].tournamentId;
const ROWS = [
  { wallet: "0x291ddfefc3215c8091c24e422f5567ed60124483", pts: 100 }, // 0x291D
  { wallet: "0xfb226037b54b8782655b233f2a9590c0cf997f68", pts: 50 }, // 0xFb22
];

async function main() {
  const db = getDb();
  // Wipe stale rows for this fecha before re-seeding.
  await db.execute(sql`DELETE FROM leaderboard_cache WHERE tournament_id = ${TID}`);
  for (const r of ROWS) {
    await db
      .insert(leaderboardCache)
      .values({ tournamentId: TID, wallet: r.wallet, pts: r.pts, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [leaderboardCache.tournamentId, leaderboardCache.wallet],
        set: { pts: r.pts, updatedAt: new Date() },
      });
  }
  await db.execute(sql`
    UPDATE leaderboard_cache lc
    SET rank = sub.rank
    FROM (
      SELECT wallet, RANK() OVER (ORDER BY pts DESC) AS rank
      FROM leaderboard_cache
      WHERE tournament_id = ${TID}
    ) sub
    WHERE lc.tournament_id = ${TID} AND lc.wallet = sub.wallet
  `);
  console.log("✅ Seeded leaderboard_cache QA rows for tournament", TID);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
