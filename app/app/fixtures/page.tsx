"use client";
import { AppShell } from "@/components/design/AppShell";
import { Wordmark } from "@/components/design/Wordmark";
import { ConnectedWalletPill } from "@/components/ConnectedWalletPill";
import { RoundSection } from "@/components/fixtures/RoundSection";
import { useFixtures } from "@/hooks/useFixtures";
import { usePlayers } from "@/hooks/usePlayers";
import { useFixtureLineups } from "@/hooks/useFixtureLineups";
import { currentRoundIndex } from "@/lib/fixtures/fixtures";

export default function FixturesPage() {
  const { rounds, isLoading } = useFixtures();
  const { byId } = usePlayers();
  const { lineupForRound } = useFixtureLineups();
  const current = currentRoundIndex(rounds);

  return (
    <AppShell active="fixtures" topbarTitle="Fixtures">
      <div className="mx-auto flex max-w-[440px] flex-col gap-3 px-5 pt-5 pb-24 lg:max-w-3xl lg:px-0 lg:pt-0 lg:pb-0">
        <header className="flex items-center justify-between lg:hidden">
          <Wordmark />
          <ConnectedWalletPill />
        </header>

        <div className="pt-2 lg:pt-0">
          <h1 className="text-lg font-semibold lg:hidden">Fixtures</h1>
          <p className="text-sm text-white/45">World Cup 2026 — matches &amp; results.</p>
        </div>

        {isLoading && rounds.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/40">Loading fixtures…</p>
        ) : rounds.length === 0 ? (
          <p className="py-16 text-center text-sm text-white/40">Fixtures unavailable — check back soon.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {rounds.map((r, i) => (
              <RoundSection
                key={r.round}
                round={r}
                defaultOpen={i === current}
                playersById={byId}
                lineupForRound={lineupForRound}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
