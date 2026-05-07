import { desc, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { leaderboardCache } from "@/lib/db/schema";
import { LeaderboardView, type LeaderboardRow } from "./LeaderboardView";

async function loadRows(): Promise<LeaderboardRow[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        wallet: leaderboardCache.wallet,
        mw37: leaderboardCache.mw37Pts,
        mw38: leaderboardCache.mw38Pts,
        total: sql<number>`${leaderboardCache.mw37Pts} + ${leaderboardCache.mw38Pts}`,
        rank: leaderboardCache.rank,
      })
      .from(leaderboardCache)
      .orderBy(desc(sql`${leaderboardCache.mw37Pts} + ${leaderboardCache.mw38Pts}`))
      .limit(100);
    return rows.map((r) => ({
      wallet: r.wallet,
      mw37: r.mw37,
      mw38: r.mw38,
      total: Number(r.total),
      rank: r.rank ?? null,
    }));
  } catch {
    return [];
  }
}

export async function Leaderboard() {
  const rows = await loadRows();
  return <LeaderboardView rows={rows} />;
}
