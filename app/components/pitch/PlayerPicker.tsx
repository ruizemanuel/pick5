"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import type { FplPlayerSummary } from "@/lib/fpl/types";

const POSITIONS = ["", "GK", "DEF", "MID", "FWD"] as const;

export type PlayerPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  players: FplPlayerSummary[];
  excludeIds: number[];
  onPick: (id: number) => void;
  onClear?: () => void;
};

export function PlayerPicker({
  open,
  onOpenChange,
  players,
  excludeIds,
  onPick,
  onClear,
}: PlayerPickerProps) {
  const [q, setQ] = useState("");
  const [pos, setPos] = useState<string>("");

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
      <DrawerContent className="border-white/10 bg-[#0F0E14] text-white">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="font-display text-2xl tracking-[0.18em] text-white">
            Pick a Player
          </DrawerTitle>
        </DrawerHeader>
        <div className="space-y-3 px-4 pb-6">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search players"
            className="h-10 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-[#00DF7C]/50 focus-visible:ring-[#00DF7C]/20"
          />
          <div
            className="flex gap-2 overflow-x-auto"
            role="tablist"
            aria-label="Filter by position"
          >
            {POSITIONS.map((p) => {
              const active = pos === p;
              return (
                <button
                  key={p || "all"}
                  type="button"
                  onClick={() => setPos(p)}
                  className={
                    "font-display shrink-0 rounded-full border px-3 py-1 text-sm tracking-[0.15em] transition " +
                    (active
                      ? "border-[#00DF7C] bg-[#00DF7C] text-black"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
                  }
                  role="tab"
                  aria-selected={active}
                >
                  {p || "All"}
                </button>
              );
            })}
          </div>

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10"
            >
              Remove from this slot
            </button>
          )}

          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {filtered.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                onPick={() => {
                  onPick(p.id);
                  onOpenChange(false);
                }}
              />
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-white/50">
                No players match.
              </p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function PlayerRow({
  player,
  onPick,
}: {
  player: FplPlayerSummary;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-left transition hover:bg-white/[0.06] active:scale-[0.99] motion-reduce:active:scale-100"
    >
      <div
        className="relative size-10 shrink-0 rounded-full p-[2px]"
        style={{
          background: `conic-gradient(from 180deg, ${player.teamColor}, transparent 70%, ${player.teamColor})`,
        }}
      >
        <div className="size-full overflow-hidden rounded-full bg-[#13121A] flex items-center justify-center relative">
          {player.photoUrl ? (
            <Image
              src={player.photoUrl}
              alt={player.name}
              fill
              sizes="40px"
              className="object-cover scale-110"
              unoptimized
            />
          ) : (
            <span className="text-[11px] font-semibold text-white/80">
              {player.initials}
            </span>
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">
          {player.name}
        </div>
        <div className="text-[11px] text-white/50">
          <span className="font-display tracking-wider">{player.position}</span>
          <span className="mx-1.5 text-white/25">·</span>
          <span>{player.team}</span>
          <span className="mx-1.5 text-white/25">·</span>
          <span>£{player.cost.toFixed(1)}</span>
          <span className="mx-1.5 text-white/25">·</span>
          <span className="tabular-nums">form {player.form.toFixed(1)}</span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-display text-base text-white tabular-nums">
          {player.points}
        </div>
        <div className="text-[9px] uppercase tracking-wider text-white/40">
          pts
        </div>
      </div>
    </button>
  );
}
