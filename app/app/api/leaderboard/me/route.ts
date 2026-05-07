import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { leaderboardCache } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!wallet || !/^0x[0-9a-f]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "invalid wallet" }, { status: 400 });
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        wallet: leaderboardCache.wallet,
        mw37: leaderboardCache.mw37Pts,
        mw38: leaderboardCache.mw38Pts,
        rank: leaderboardCache.rank,
      })
      .from(leaderboardCache)
      .where(eq(leaderboardCache.wallet, wallet))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return NextResponse.json({
        wallet,
        rank: null,
        mw37: 0,
        mw38: 0,
        total: 0,
      });
    }

    return NextResponse.json({
      wallet: row.wallet,
      rank: row.rank,
      mw37: row.mw37,
      mw38: row.mw38,
      total: row.mw37 + row.mw38,
    });
  } catch (err) {
    console.error("[leaderboard/me]", err);
    return NextResponse.json({
      wallet,
      rank: null,
      mw37: 0,
      mw38: 0,
      total: 0,
    });
  }
}
