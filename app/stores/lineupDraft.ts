"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_FORMATION, formationSlots } from "@/lib/lineup/formations";
import { remapOnFormationChange, type Slot } from "@/lib/lineup/validate";

export type PlayerId = number;

export type Draft = {
  formation: string;
  slots: Slot[]; // length 11, ordered by formationSlots(formation)
  captainId: number | null;
};

function emptyDraft(formation = DEFAULT_FORMATION): Draft {
  return { formation, slots: formationSlots(formation).map(() => null), captainId: null };
}

type LineupDraftState = {
  byFecha: Record<number, Draft>;
  draftFor: (tid: number) => Draft;
  setFormation: (tid: number, formation: string) => void;
  setSlot: (tid: number, idx: number, id: PlayerId | null) => void;
  setCaptain: (tid: number, id: PlayerId) => void;
  clear: (tid: number) => void;
};

export const useLineupDraft = create<LineupDraftState>()(
  persist(
    (set, get) => ({
      byFecha: {},
      draftFor: (tid) => get().byFecha[tid] ?? emptyDraft(),
      setFormation: (tid, formation) =>
        set((s) => {
          const cur = s.byFecha[tid] ?? emptyDraft();
          if (cur.formation === formation) return s;
          const slots = remapOnFormationChange(cur.slots, cur.formation, formation);
          const captainId =
            cur.captainId != null && slots.includes(cur.captainId) ? cur.captainId : null;
          return { byFecha: { ...s.byFecha, [tid]: { formation, slots, captainId } } };
        }),
      setSlot: (tid, idx, id) =>
        set((s) => {
          const cur = s.byFecha[tid] ?? emptyDraft();
          if (id !== null && cur.slots.includes(id)) return s; // no duplicates
          const slots = [...cur.slots];
          const removed = slots[idx];
          slots[idx] = id;
          const captainId = removed != null && removed === cur.captainId ? null : cur.captainId;
          return { byFecha: { ...s.byFecha, [tid]: { ...cur, slots, captainId } } };
        }),
      setCaptain: (tid, id) =>
        set((s) => {
          const cur = s.byFecha[tid] ?? emptyDraft();
          if (!cur.slots.includes(id)) return s; // captain must be in the XI
          return { byFecha: { ...s.byFecha, [tid]: { ...cur, captainId: id } } };
        }),
      clear: (tid) =>
        set((s) => ({ byFecha: { ...s.byFecha, [tid]: emptyDraft() } })),
    }),
    { name: "onze-lineup-draft-v1" },
  ),
);
