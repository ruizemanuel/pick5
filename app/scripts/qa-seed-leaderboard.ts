// QA helper: seed leaderboardCache so /leaderboard renders the podium during
// a compressed test tournament where real FPL live stats are still 0.

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { sql } from "drizzle-orm";
import { getDb } from "../lib/db";
import { leaderboardCache } from "../lib/db/schema";

const ROWS = [
  { wallet: "0x291ddfefc3215c8091c24e422f5567ed60124483", mw37: 40, mw38: 60 }, // 0x291D (winner)
  { wallet: "0xfb226037b54b8782655b233f2a9590c0cf997f68", mw37: 20, mw38: 30 }, // 0xFb22
];

async function main() {
  const db = getDb();
  // Wipe stale rows from previous QA rounds before re-seeding.
  await db.execute(sql`DELETE FROM leaderboard_cache`);
  for (const r of ROWS) {
    await db
      .insert(leaderboardCache)
      .values({
        wallet: r.wallet,
        mw37Pts: r.mw37,
        mw38Pts: r.mw38,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: leaderboardCache.wallet,
        set: { mw37Pts: r.mw37, mw38Pts: r.mw38, updatedAt: new Date() },
      });
  }
  await db.execute(sql`
    UPDATE leaderboard_cache lc
    SET rank = sub.rank
    FROM (
      SELECT wallet, RANK() OVER (ORDER BY (mw37_pts + mw38_pts) DESC) AS rank
      FROM leaderboard_cache
    ) sub
    WHERE lc.wallet = sub.wallet
  `);
  console.log("✅ Seeded leaderboardCache with QA rows.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
