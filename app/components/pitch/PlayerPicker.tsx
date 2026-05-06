"use client";

import { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { PlayerCard, type PlayerCardProps } from "@/components/PlayerCard";

type FplPlayer = Omit<PlayerCardProps, "selected" | "onClick"> & { points: number };

const POSITIONS = ["", "GK", "DEF", "MID", "FWD"] as const;

export function PlayerPicker({
  open,
  onOpenChange,
  excludeIds,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  excludeIds: number[];
  onPick: (id: number) => void;
}) {
  const [players, setPlayers] = useState<FplPlayer[]>([]);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    fetch("/api/fpl/players")
      .then((r) => r.json())
      .then((d: { players: FplPlayer[] }) => setPlayers(d.players))
      .catch(() => setPlayers([]));
  }, [open]);

  const filtered = useMemo(() => {
    return players
      .filter((p) => !excludeIds.includes(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()))
      .filter((p) => !pos || p.position === pos)
      .sort((a, b) => b.form - a.form)
      .slice(0, 100);
  }, [players, q, pos, excludeIds]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Pick a player</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-3 px-4 pb-6">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search players"
          />
          <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Filter by position">
            {POSITIONS.map((p) => (
              <button
                key={p || "all"}
                onClick={() => setPos(p)}
                className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
                  pos === p ? "bg-foreground text-background" : ""
                }`}
                role="tab"
                aria-selected={pos === p}
              >
                {p || "All"}
              </button>
            ))}
          </div>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {filtered.map((p) => (
              <PlayerCard
                key={p.id}
                {...p}
                onClick={() => {
                  onPick(p.id);
                  onOpenChange(false);
                }}
              />
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">No players match.</p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
