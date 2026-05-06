import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { coachPicks } from "@/lib/db/schema";
import { CoachPickCard } from "@/components/CoachPickCard";
import { BottomNav } from "@/components/BottomNav";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const db = getDb();
  const rows = await db.select().from(coachPicks).orderBy(desc(coachPicks.mw));

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
