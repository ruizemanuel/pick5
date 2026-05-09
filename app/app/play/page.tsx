"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { BottomNav } from "@/components/BottomNav";
import { ConnectedWalletPill } from "@/components/ConnectedWalletPill";
import { Pitch, type PitchSlot } from "@/components/design/Pitch";
import { PlayerRow } from "@/components/design/PlayerRow";
import { PrimaryCTALink } from "@/components/design/PrimaryCTA";
import { Stat } from "@/components/design/Stat";
import { useLineup } from "@/hooks/useLineup";
import type { FplPlayerSummary } from "@/lib/fpl/types";

type LiveStats = {
  mw: number;
  stats: Record<
    number,
    { points: number; minutes: number; goals: number; assists: number }
  >;
};

type MeRow = {
  wallet: string;
  rank: number | null;
  mw37: number;
  mw38: number;
  total: number;
};

const LOCK_DATE = new Date("2026-05-16T14:00:00Z");
const CURRENT_MW = 37;

function partsBetween(target: Date, now: Date) {
  const ms = Math.max(0, target.getTime() - now.getTime());
  return {
    expired: ms === 0,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    mins: Math.floor((ms % 3_600_000) / 60_000),
  };
}

export default function MyTeamPage() {
  const { address, isConnected } = useAccount();
  const { lineup, refetch: refetchLineup } = useLineup();
  const [players, setPlayers] = useState<FplPlayerSummary[]>([]);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const [live, setLive] = useState<LiveStats | null>(null);
  const [me, setMe] = useState<MeRow | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Force a fresh chain read on mount — wagmi may otherwise serve a stale
  // empty lineup from cache when arriving here right after joinTournament.
  useEffect(() => {
    if (address) refetchLineup();
  }, [address, refetchLineup]);

  useEffect(() => {
    fetch("/api/fpl/players")
      .then((r) => r.json())
      .then((d: { players: FplPlayerSummary[] }) => setPlayers(d.players))
      .catch(() => setPlayers([]))
      .finally(() => setPlayersLoaded(true));
  }, []);

  useEffect(() => {
    fetch(`/api/fpl/live?mw=${CURRENT_MW}`)
      .then((r) => r.json())
      .then((d: LiveStats) => setLive(d))
      .catch(() => setLive(null));
  }, []);

  useEffect(() => {
    if (!address) {
      setMe(null);
      return;
    }
    fetch(`/api/leaderboard/me?wallet=${address.toLowerCase()}`)
      .then((r) => r.json())
      .then((d: MeRow) => setMe(d))
      .catch(() => setMe(null));
  }, [address]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const playerMap = useMemo(() => {
    const m = new Map<number, FplPlayerSummary>();
    for (const p of players) m.set(p.id, p);
    return m;
  }, [players]);

  const ids = useMemo(() => {
    if (!lineup) return [] as number[];
    return lineup.map((x) => Number(x)).filter((id) => id !== 0);
  }, [lineup]);

  const hasLineup = ids.length === 5;
  const allMapped = hasLineup && ids.every((id) => playerMap.has(id));
  const haveChainResult = lineup !== undefined;
  const showLoadingState =
    !haveChainResult || (hasLineup && (!playersLoaded || !allMapped));
  const showNoLineupState = haveChainResult && playersLoaded && !hasLineup;

  // Temporary debug logging — remove once loading-state issue is fully verified.
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[pick5/play]", {
      address,
      lineup: lineup ? Array.from(lineup).map(String) : lineup,
      ids,
      hasLineup,
      haveChainResult,
      playersLoaded,
      allMapped,
      showLoadingState,
      showNoLineupState,
      ts: new Date().toISOString(),
    });
  }, [address, lineup, ids, hasLineup, haveChainResult, playersLoaded, allMapped, showLoadingState, showNoLineupState]);

  const pitchSlots: PitchSlot[] = useMemo(() => {
    if (!lineup) return Array(5).fill({ empty: true } as const);
    return lineup.map((idBn) => {
      const id = Number(idBn);
      if (id === 0) return { empty: true };
      const p = playerMap.get(id);
      if (!p) {
        return {
          empty: false,
          initials: `#${id}`,
          teamColor: "#00DF7C",
          showLabel: false,
        };
      }
      return {
        empty: false,
        photoUrl: p.photoUrl,
        initials: p.initials,
        teamColor: p.teamColor,
        name: p.name,
        team: p.team,
        position: p.position,
      };
    });
  }, [lineup, playerMap]);

  const lockParts = partsBetween(LOCK_DATE, now);
  const isLocked = lockParts.expired;
  const statusLabel = isLocked ? "MW37 LIVE" : "LOCKS IN";
  const statusValue = isLocked
    ? "Live"
    : `${String(lockParts.days).padStart(2, "0")}d ${String(lockParts.hours).padStart(2, "0")}h ${String(lockParts.mins).padStart(2, "0")}m`;

  const currentMwPoints = useMemo(() => {
    if (!live || ids.length === 0) return 0;
    return ids.reduce((sum, id) => sum + (live.stats[id]?.points ?? 0), 0);
  }, [live, ids]);

  const totalScore = me?.total ?? currentMwPoints;
  const rankLabel = me?.rank ? `#${me.rank}` : "—";

  if (!isConnected) {
    return (
      <main className="min-h-dvh bg-[#08070D] text-white">
        <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col items-center justify-center gap-4 px-5 pb-24">
          <span className="font-display text-3xl tracking-[0.2em] text-white">
            PICK<span className="text-[#00DF7C]">5</span>
          </span>
          <p className="text-center text-white/70">
            Connect your wallet to see your lineup.
          </p>
          <ConnectedWalletPill />
        </div>
        <BottomNav />
      </main>
    );
  }

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
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#00DF7C]">
            <span
              className="size-1.5 rounded-full bg-[#00DF7C] shadow-[0_0_8px_#00DF7C]"
              aria-hidden
            />
            <span>{isLocked ? "Tournament Live" : "Pre-tournament"}</span>
          </div>
          <h1 className="font-display mt-1 text-4xl leading-none tracking-tight">
            My Team
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {isLocked
              ? "MW37 is in progress. Your lineup is locked."
              : `MW37 kicks off in ${lockParts.days}d ${lockParts.hours}h. Lineup locked.`}
          </p>
        </section>

        {showLoadingState && (
          <section className="pt-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/50">
              Loading lineup…
            </div>
          </section>
        )}

        {showNoLineupState && (
          <section className="pt-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <div className="font-display text-2xl text-white">
                No Lineup Yet
              </div>
              <p className="mt-2 text-sm text-white/50">
                You haven&apos;t joined this tournament. Pick your 5 to enter.
              </p>
            </div>
            <PrimaryCTALink href="/play/build" label="Build Lineup" />
          </section>
        )}

        {hasLineup && allMapped && (
          <>
            <section className="pt-5">
              <Pitch slots={pitchSlots} />
            </section>

            <section className="pt-5">
              <div className="grid grid-cols-3 gap-2">
                <Stat
                  label="Score"
                  value={String(totalScore)}
                  sub={isLocked ? "MW37 live" : "yet to play"}
                />
                <Stat
                  label="Rank"
                  value={rankLabel}
                  sub={me?.rank ? "of all players" : "after first MW"}
                />
                <Stat label={statusLabel} value={statusValue} sub="Sat 16 May" />
              </div>
            </section>

            <section className="pt-6">
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
                How your players are doing
              </div>
              <div className="mt-2 space-y-2">
                {ids.map((id, i) => {
                  const p = playerMap.get(id);
                  const pts = live?.stats[id]?.points ?? 0;
                  const mins = live?.stats[id]?.minutes ?? 0;
                  const goals = live?.stats[id]?.goals ?? 0;
                  const assists = live?.stats[id]?.assists ?? 0;
                  const subline =
                    !isLocked
                      ? "MW37 yet to start"
                      : mins === 0
                      ? "Yet to play"
                      : `${mins}'  ·  ${goals}G ${assists}A`;
                  return (
                    <PlayerRow
                      key={`${id}-${i}`}
                      photoUrl={p?.photoUrl}
                      initials={p?.initials ?? `#${id}`}
                      teamColor={p?.teamColor}
                      name={p?.name ?? `Player #${id}`}
                      team={p?.team}
                      position={p?.position}
                      meta={subline}
                      right={
                        <>
                          <div className="font-display text-base text-white tabular-nums">
                            {pts}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider text-white/40">
                            mw{CURRENT_MW}
                          </div>
                        </>
                      }
                    />
                  );
                })}
              </div>
            </section>

            <section className="pt-6">
              <Link
                href={"/leaderboard" as Route}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-sm text-white/70 transition hover:bg-white/10"
              >
                See full leaderboard →
              </Link>
            </section>
          </>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
