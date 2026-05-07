import { NextResponse } from "next/server";
import { getBootstrap } from "@/lib/fpl/client";

export const revalidate = 3600;
export const runtime = "nodejs";
// Don't prerender at build time — FPL blocks Vercel's build IPs with 403.
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getBootstrap();
  const players = data.elements.map((e) => ({
    id: e.id,
    name: e.web_name,
    teamId: e.team,
    team: data.teams.find((t) => t.id === e.team)?.short_name ?? "",
    position: ["GK", "DEF", "MID", "FWD"][e.element_type - 1] ?? "?",
    cost: e.now_cost / 10,
    form: parseFloat(e.form),
    owned: parseFloat(e.selected_by_percent),
    points: e.total_points,
  }));
  return NextResponse.json({ players });
}
