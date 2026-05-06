"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlayerId = number;

type LineupDraftState = {
  lineup: (PlayerId | null)[]; // length 5
  setSlot: (idx: number, id: PlayerId | null) => void;
  randomFill: (allIds: PlayerId[]) => void;
  clear: () => void;
};

export const useLineupDraft = create<LineupDraftState>()(
  persist(
    (set) => ({
      lineup: [null, null, null, null, null],
      setSlot: (idx, id) =>
        set((s) => {
          if (id !== null && s.lineup.includes(id)) return s;
          const next = [...s.lineup];
          next[idx] = id;
          return { lineup: next };
        }),
      randomFill: (allIds) =>
        set(() => {
          const shuffled = [...allIds].sort(() => Math.random() - 0.5);
          return { lineup: shuffled.slice(0, 5) };
        }),
      clear: () => set({ lineup: [null, null, null, null, null] }),
    }),
    { name: "pick5-lineup-draft" }
  )
);
