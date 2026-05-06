"use client";

import { useLineupDraft } from "@/stores/lineupDraft";
import { PlayerSlot } from "./PlayerSlot";

const POSITIONS = [
  { top: "10%", left: "50%" }, // top
  { top: "35%", left: "20%" }, // upper-left
  { top: "35%", left: "80%" }, // upper-right
  { top: "70%", left: "30%" }, // lower-left
  { top: "70%", left: "70%" }, // lower-right
] as const;

export function PitchView() {
  const { lineup, setSlot } = useLineupDraft();

  return (
    <div
      className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl shadow-md"
      style={{
        background: "linear-gradient(180deg,#3b8d3b 0%,#2f7a2f 100%)",
      }}
      role="region"
      aria-label="Football pitch with 5 lineup slots"
    >
      <div className="pointer-events-none absolute inset-4 rounded-xl border-2 border-white/30" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30"
        aria-hidden
      />

      {POSITIONS.map((pos, i) => {
        const others = lineup.filter((id, idx) => idx !== i && id !== null) as number[];
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: pos.top, left: pos.left }}
          >
            <PlayerSlot
              idx={i}
              playerId={lineup[i]}
              otherIds={others}
              onChange={(id) => setSlot(i, id)}
            />
          </div>
        );
      })}
    </div>
  );
}
