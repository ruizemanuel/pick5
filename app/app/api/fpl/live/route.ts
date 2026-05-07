import { NextRequest, NextResponse } from "next/server";
import { getLive } from "@/lib/fpl/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const mwParam = req.nextUrl.searchParams.get("mw");
  const mw = mwParam ? Number(mwParam) : NaN;
  if (!Number.isFinite(mw) || mw < 1 || mw > 38) {
    return NextResponse.json({ error: "invalid mw" }, { status: 400 });
  }

  try {
    const live = await getLive(mw);
    const stats: Record<
      number,
      { points: number; minutes: number; goals: number; assists: number }
    > = {};
    for (const e of live.elements) {
      stats[e.id] = {
        points: e.stats.total_points,
        minutes: e.stats.minutes,
        goals: e.stats.goals_scored,
        assists: e.stats.assists,
      };
    }
    return NextResponse.json(
      { mw, stats },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  } catch (err) {
    console.error("[fpl/live]", err);
    return NextResponse.json({ mw, stats: {} });
  }
}
