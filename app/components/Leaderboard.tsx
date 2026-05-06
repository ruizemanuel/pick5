import { desc, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { leaderboardCache } from "@/lib/db/schema";

export async function Leaderboard() {
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

  if (rows.length === 0) {
    return <p className="text-muted-foreground">No participants yet.</p>;
  }

  return (
    <ol className="space-y-2">
      {rows.map((r) => (
        <li key={r.wallet} className="flex items-center justify-between rounded border p-3 text-sm">
          <span>
            <strong>#{r.rank ?? "—"}</strong>{" "}
            <span className="font-mono">
              {r.wallet.slice(0, 6)}…{r.wallet.slice(-4)}
            </span>
          </span>
          <span className="text-muted-foreground">{r.total} pts</span>
        </li>
      ))}
    </ol>
  );
}
