import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { coachPicks } from "@/lib/db/schema";
import { CoachPickCard } from "@/components/CoachPickCard";
import { BottomNav } from "@/components/BottomNav";
import { getBootstrap } from "@/lib/fpl/client";

export const revalidate = 300;
export const dynamic = "force-dynamic";

type PlayerSummary = { name: string; team: string };

async function buildPlayerMap(): Promise<Map<number, PlayerSummary>> {
  try {
    const bootstrap = await getBootstrap();
    const teamShort = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
    const m = new Map<number, PlayerSummary>();
    for (const p of bootstrap.elements) {
      m.set(p.id, { name: p.web_name, team: teamShort.get(p.team) ?? "" });
    }
    return m;
  } catch {
    return new Map();
  }
}

export default async function CoachPage() {
  const db = getDb();
  const [rows, players] = await Promise.all([
    db.select().from(coachPicks).orderBy(desc(coachPicks.mw)),
    buildPlayerMap(),
  ]);

  return (
    <main className="mx-auto min-h-dvh max-w-md p-6 pb-24">
      <h1 className="mb-2 text-2xl font-semibold">AI Coach</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Picks are committed onchain before each matchweek and revealed after. The Coach&apos;s accuracy is tracked via ERC-8004 reputation.
      </p>
      <div className="space-y-4">
        {rows.length === 0 && <p className="text-muted-foreground">No picks yet.</p>}
        {rows.map((row) => (
          <CoachPickCard
            key={row.id}
            row={{
              mw: row.mw,
              playerIds: row.playerIds,
              playerNames: row.playerIds.map((id) => players.get(id)?.name ?? null),
              playerTeams: row.playerIds.map((id) => players.get(id)?.team ?? null),
              reasoning: row.reasoning ?? [],
              commitmentHash: row.commitmentHash,
              publishTxHash: row.publishTxHash,
              revealTxHash: row.revealTxHash,
              accuracy: row.accuracy,
            }}
          />
        ))}
      </div>
      <BottomNav />
    </main>
  );
}
