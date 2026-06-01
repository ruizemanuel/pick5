import { NextResponse } from "next/server";
import { getActiveProvider } from "@/lib/scoring/providers";
import { providerPlayerToUi } from "@/lib/players/uiPlayer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const players = (await getActiveProvider().getPlayers()).map(providerPlayerToUi);
    return NextResponse.json({ players });
  } catch (e) {
    console.error("players endpoint failed", e);
    return NextResponse.json({ players: [] }, { status: 200 });
  }
}
