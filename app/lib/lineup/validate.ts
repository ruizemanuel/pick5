import { formationSlots, type Position } from "./formations";

export type Slot = number | null;

export function lineupBudgetSpent(slots: Slot[], costById: Map<number, number>): number {
  return slots.reduce<number>((sum, id) => sum + (id != null ? costById.get(id) ?? 0 : 0), 0);
}

export function validateLineup(args: {
  slots: Slot[];
  captainId: number | null;
  costById: Map<number, number>;
  budget: number;
}): { ok: boolean; reason?: string } {
  const filled = args.slots.filter((x): x is number => x != null);
  if (filled.length !== 11) return { ok: false, reason: `${filled.length}/11 jugadores` };
  if (new Set(filled).size !== 11) return { ok: false, reason: "jugadores repetidos" };
  const spent = lineupBudgetSpent(args.slots, args.costById);
  if (spent > args.budget) return { ok: false, reason: `presupuesto excedido (${spent.toFixed(1)}/${args.budget}M)` };
  if (args.captainId == null) return { ok: false, reason: "falta capitán" };
  if (!filled.includes(args.captainId)) return { ok: false, reason: "capitán fuera del XI" };
  return { ok: true };
}

/**
 * Preserve players by position when the formation changes: for each position
 * line, keep as many of the previous slots as the new formation has room for
 * (in order), filling the rest with null.
 */
export function remapOnFormationChange(
  prevSlots: Slot[],
  prevFormation: string,
  nextFormation: string,
): Slot[] {
  const prevPos = formationSlots(prevFormation);
  const queues: Record<Position, number[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  prevPos.forEach((pos, i) => {
    const id = prevSlots[i];
    if (id != null) queues[pos].push(id);
  });
  return formationSlots(nextFormation).map((pos) => queues[pos].shift() ?? null);
}
