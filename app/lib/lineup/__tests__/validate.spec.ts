import { describe, it, expect } from "vitest";
import { lineupBudgetSpent, validateLineup, remapOnFormationChange } from "../validate";

const cost = new Map<number, number>([[1, 10], [2, 20], [3, 5]]);

describe("lineupBudgetSpent", () => {
  it("sums costs, treating empty/unknown as 0", () => {
    expect(lineupBudgetSpent([1, 2, null, 99], cost)).toBe(30);
  });
});

describe("validateLineup", () => {
  const full = Array.from({ length: 11 }, (_, i) => i + 1);
  const costAll = new Map(full.map((id) => [id, 5])); // 11 * 5 = 55
  it("passes a full distinct within-budget lineup with a captain in it", () => {
    expect(validateLineup({ slots: full, captainId: 3, costById: costAll, budget: 100 })).toEqual({ ok: true });
  });
  it("fails when not 11 filled", () => {
    expect(validateLineup({ slots: [1, null], captainId: 1, costById: costAll, budget: 100 }).ok).toBe(false);
  });
  it("fails on duplicates", () => {
    const dup = [...full.slice(0, 10), 1];
    expect(validateLineup({ slots: dup, captainId: 1, costById: costAll, budget: 100 }).ok).toBe(false);
  });
  it("fails over budget", () => {
    expect(validateLineup({ slots: full, captainId: 3, costById: costAll, budget: 50 }).ok).toBe(false);
  });
  it("fails when captain missing or outside the XI", () => {
    expect(validateLineup({ slots: full, captainId: null, costById: costAll, budget: 100 }).ok).toBe(false);
    expect(validateLineup({ slots: full, captainId: 99, costById: costAll, budget: 100 }).ok).toBe(false);
  });
});

describe("remapOnFormationChange", () => {
  it("keeps players whose position still has a slot, drops the overflow", () => {
    // 4-3-3 slots: GK, DEF,DEF,DEF,DEF, MID,MID,MID, FWD,FWD,FWD
    const slots = [10, 21, 22, 23, 24, 31, 32, 33, 41, 42, 43];
    // -> 3-5-2: GK, DEF,DEF,DEF, MID,MID,MID,MID,MID, FWD,FWD
    const next = remapOnFormationChange(slots, "4-3-3", "3-5-2");
    expect(next).toEqual([10, 21, 22, 23, 31, 32, 33, null, null, 41, 42]);
  });
});
