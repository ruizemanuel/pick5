import { NextResponse } from "next/server";
import { getBootstrap } from "@/lib/fpl/client";
import { teamColor } from "@/lib/fpl/teamColors";
import type { FplPlayerSummary } from "@/lib/fpl/types";

export const runtime = "nodejs";
// Don't prerender at build time — FPL blocks Vercel's build IPs with 403.
export const dynamic = "force-dynamic";

const FPL_PHOTO = (code: number) =>
  `https://resources.premierleague.com/premierleague/photos/players/250x250/p${code}.png`;

function deriveInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Per-instance memory cache so transient FPL hiccups don't surface as 500s
// to the UI. Serverless containers are reused for multiple invocations,
// and a 1h TTL keeps things fresh enough for a fantasy league.
type CacheEntry = { players: FplPlayerSummary[]; ts: number };
let memCache: CacheEntry | null = null;
const FRESH_TTL_MS = 60 * 60 * 1000; // 1h

function buildPlayers(
  data: Awaited<ReturnType<typeof getBootstrap>>,
): FplPlayerSummary[] {
  return data.elements.map((e) => {
    const team = data.teams.find((t) => t.id === e.team)?.short_name ?? "";
    return {
      id: e.id,
      name: e.web_name,
      teamId: e.team,
      team,
      teamColor: teamColor(team),
      position: ["GK", "DEF", "MID", "FWD"][e.element_type - 1] ?? "?",
      cost: e.now_cost / 10,
      form: parseFloat(e.form),
      owned: parseFloat(e.selected_by_percent),
      points: e.total_points,
      photoUrl: FPL_PHOTO(e.code),
      initials: deriveInitials(e.web_name),
    };
  });
}

export async function GET() {
  const now = Date.now();

  if (memCache && now - memCache.ts < FRESH_TTL_MS) {
    return NextResponse.json(
      { players: memCache.players, cache: "fresh" },
      { headers: { "Cache-Control": "public, max-age=600, s-maxage=3600" } },
    );
  }

  try {
    const data = await getBootstrap();
    const players = buildPlayers(data);
    memCache = { players, ts: now };
    return NextResponse.json(
      { players, cache: "miss" },
      { headers: { "Cache-Control": "public, max-age=600, s-maxage=3600" } },
    );
  } catch (err) {
    console.error("[fpl/players] upstream failed", err);
    if (memCache) {
      return NextResponse.json(
        { players: memCache.players, cache: "stale" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { players: [], error: "FPL upstream unavailable" },
      { status: 502 },
    );
  }
}
