"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { BottomNav } from "@/components/BottomNav";
import { WalletButton } from "@/components/WalletButton";
import { useLineup } from "@/hooks/useLineup";

type FplPlayerSummary = { id: number; name: string; team: string };

export default function MyTeamPage() {
  const { isConnected } = useAccount();
  const { lineup, isLoading } = useLineup();
  const [players, setPlayers] = useState<Record<number, { name: string; team: string }>>({});

  useEffect(() => {
    fetch("/api/fpl/players")
      .then((r) => r.json())
      .then((d: { players: FplPlayerSummary[] }) => {
        const m: Record<number, { name: string; team: string }> = {};
        for (const p of d.players) m[p.id] = { name: p.name, team: p.team };
        setPlayers(m);
      })
      .catch(() => setPlayers({}));
  }, []);

  const hasLineup = lineup && lineup.some((id) => id !== BigInt(0));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Team</h1>
        <WalletButton />
      </header>

      {!isConnected && <p className="text-muted-foreground">Connect your wallet to see your lineup.</p>}

      {isConnected && isLoading && <p className="text-muted-foreground">Loading…</p>}

      {isConnected && !isLoading && !hasLineup && (
        <div className="space-y-3">
          <p>You haven&apos;t joined yet.</p>
          <Link
            href={"/play/build" as Route}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Build a lineup
          </Link>
        </div>
      )}

      {isConnected && hasLineup && lineup && (
        <ul className="space-y-2">
          {lineup.map((idBn, i) => {
            const id = Number(idBn);
            const p = players[id];
            return (
              <li key={i} className="rounded border p-3">
                <strong>{p?.name ?? `#${id}`}</strong>
                <span className="ml-2 text-sm text-muted-foreground">{p?.team ?? ""}</span>
              </li>
            );
          })}
        </ul>
      )}

      <BottomNav />
    </main>
  );
}
