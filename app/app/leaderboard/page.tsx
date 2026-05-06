import { Suspense } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { BottomNav } from "@/components/BottomNav";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default function LeaderboardPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-md p-6 pb-24">
      <h1 className="mb-6 text-2xl font-semibold">Leaderboard</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Leaderboard />
      </Suspense>
      <BottomNav />
    </main>
  );
}
