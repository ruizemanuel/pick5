import { Suspense } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { BottomNav } from "@/components/BottomNav";
import { ConnectedWalletPill } from "@/components/ConnectedWalletPill";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default function LeaderboardPage() {
  return (
    <main className="min-h-dvh bg-[#08070D] text-white">
      <div className="mx-auto flex max-w-[440px] flex-col px-5 pt-5 pb-24">
        <header className="flex items-center justify-between">
          <span className="font-display text-2xl tracking-[0.2em] text-white">
            PICK<span className="text-[#00DF7C]">5</span>
          </span>
          <ConnectedWalletPill />
        </header>

        <section className="pt-6">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#00DF7C]">
            Tournament standings
          </div>
          <h1 className="font-display mt-1 text-4xl leading-none tracking-tight">
            Leaderboard
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Top scorer after MW38 wins the entire prize pool.
          </p>
        </section>

        <div className="pt-6">
          <Suspense
            fallback={
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/50">
                Loading…
              </div>
            }
          >
            <Leaderboard />
          </Suspense>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
