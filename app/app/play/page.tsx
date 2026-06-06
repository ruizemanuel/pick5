import type { Route } from "next";
import { redirect } from "next/navigation";
import { getActiveSeason } from "@/lib/tournaments/seasons";

export const dynamic = "force-dynamic";

// Home tab → the current phase of the active season. Phases run in order
// (Group Stage, then Knockout); a later phase's pool isn't created until that
// phase opens, so we default to the FIRST configured phase rather than the
// highest tid (which would land on a not-yet-created Knockout pool).
// When the Knockout opens, revisit this to point at the latest open phase.
export default function PlayIndex() {
  const fechas = getActiveSeason().fechas;
  const activeTid = fechas[0]?.tournamentId ?? 0;
  redirect(`/play/${activeTid}` as Route);
}
