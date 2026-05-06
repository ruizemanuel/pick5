"use client";

import { useEffect, useState } from "react";
import { PlayerPicker } from "./PlayerPicker";

export function PlayerSlot({
  playerId,
  otherIds,
  onChange,
}: {
  idx: number;
  playerId: number | null;
  otherIds: number[];
  onChange: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      setName(null);
      return;
    }
    fetch("/api/fpl/players")
      .then((r) => r.json())
      .then((d: { players: { id: number; name: string }[] }) => {
        const found = d.players.find((p) => p.id === playerId);
        setName(found?.name ?? `#${playerId}`);
      })
      .catch(() => setName(`#${playerId}`));
  }, [playerId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex aspect-square w-20 flex-col items-center justify-center rounded-full border-2 border-dashed border-white/60 bg-white/85 text-center text-xs font-medium text-foreground shadow-sm sm:w-24"
        aria-label={playerId ? `Player ${name ?? playerId}, tap to change` : "Empty slot, tap to pick a player"}
      >
        {playerId ? (
          <>
            <span className="line-clamp-1 px-1">{name ?? `#${playerId}`}</span>
            <span
              className="mt-0.5 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              role="button"
              aria-label="Remove player"
            >
              ✕
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">+ Pick</span>
        )}
      </button>
      <PlayerPicker open={open} onOpenChange={setOpen} excludeIds={otherIds} onPick={(id) => onChange(id)} />
    </>
  );
}
