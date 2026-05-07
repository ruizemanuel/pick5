"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PitchView } from "@/components/pitch/PitchView";
import { WalletButton } from "@/components/WalletButton";
import { useLineupDraft } from "@/stores/lineupDraft";

export default function BuildPage() {
  const { lineup, randomFill } = useLineupDraft();
  const [allIds, setAllIds] = useState<number[]>([]);
  const filled = lineup.filter((x) => x !== null).length;

  useEffect(() => {
    fetch("/api/fpl/players")
      .then((r) => r.json())
      .then((d: { players: { id: number }[] }) => setAllIds(d.players.map((p) => p.id)))
      .catch(() => setAllIds([]));
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4 pb-24">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Build your lineup</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{filled} / 5</span>
          <WalletButton />
        </div>
      </header>

      <PitchView />

      <Button variant="outline" onClick={() => randomFill(allIds)} disabled={!allIds.length}>
        Random fill
      </Button>

      {filled === 5 ? (
        <Link
          href={"/play/confirm" as Route}
          className="mt-auto inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Continue
        </Link>
      ) : (
        <Button disabled className="mt-auto">{`Pick ${5 - filled} more`}</Button>
      )}
    </main>
  );
}
