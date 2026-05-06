import { desc, sql } from "drizzle-orm";
import { Leaderboard } from "@/components/Leaderboard";
import { BottomNav } from "@/components/BottomNav";
import { getDb } from "@/lib/db";
import { leaderboardCache } from "@/lib/db/schema";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const db = getDb();
  const rows = await db
    .select({
      wallet: leaderboardCache.wallet,
      mw37: leaderboardCache.mw37Pts,
      mw38: leaderboardCache.mw38Pts,
      total: sql<number>`${leaderboardCache.mw37Pts} + ${leaderboardCache.mw38Pts}`,
    })
    .from(leaderboardCache)
    .orderBy(desc(sql`${leaderboardCache.mw37Pts} + ${leaderboardCache.mw38Pts}`))
    .limit(1);

  const winner = rows[0];

  return (
    <main className="mx-auto min-h-dvh max-w-md p-6 pb-24">
      <h1 className="mb-2 text-2xl font-semibold">Final Results</h1>
      {winner && (
        <div className="mb-6 rounded-xl bg-gradient-to-br from-yellow-200 to-yellow-400 p-6 text-center text-yellow-950 shadow">
          <div className="text-sm font-medium">🏆 Winner</div>
          <div className="font-mono">
            {winner.wallet.slice(0, 6)}…{winner.wallet.slice(-4)}
          </div>
          <div className="mt-1 text-sm">{winner.total} points</div>
        </div>
      )}
      <Leaderboard />
      <BottomNav />
    </main>
  );
}
