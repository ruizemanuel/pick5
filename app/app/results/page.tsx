import { Suspense } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { ConnectedWalletPill } from "@/components/ConnectedWalletPill";
import { ResultsHero } from "@/components/ResultsHero";
import { AppShell } from "@/components/design/AppShell";
import { Wordmark } from "@/components/design/Wordmark";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default function ResultsPage() {
  return (
    <AppShell active="ranking">
      <div className="mx-auto flex max-w-[440px] flex-col px-5 pt-5 pb-24 lg:max-w-3xl lg:px-0 lg:pt-0 lg:pb-0">
        <header className="flex items-center justify-between lg:hidden">
          <Wordmark />
          <ConnectedWalletPill />
        </header>

        <section className="pt-6">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#F5C842]">
            Final results
          </div>
          <h1 className="font-display mt-1 text-4xl leading-none tracking-tight">
            Tournament Settled
          </h1>
        </section>

        <div className="pt-6">
          <ResultsHero />
        </div>

        <div className="pt-6">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
            Final standings
          </div>
          <div className="mt-2">
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
      </div>
    </AppShell>
  );
}
