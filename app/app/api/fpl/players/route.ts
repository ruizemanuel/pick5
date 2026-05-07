import { NextResponse } from "next/server";
import { getBootstrap } from "@/lib/fpl/client";
import { teamColor } from "@/lib/fpl/teamColors";

export const revalidate = 3600;
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

export async function GET() {
  const data = await getBootstrap();
  const players = data.elements.map((e) => {
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
  return NextResponse.json({ players });
}
