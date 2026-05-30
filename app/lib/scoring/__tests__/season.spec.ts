import { describe, it, expect } from "vitest";
import { sumSeasonScores } from "../season";

describe("sumSeasonScores", () => {
  it("sums a wallet's scores across fechas and unions participants", () => {
    const f1 = new Map<string, number>([["0xa", 10], ["0xb", 5]]);
    const f2 = new Map<string, number>([["0xa", 7], ["0xc", 3]]);
    const out = sumSeasonScores([f1, f2]);
    expect(out.get("0xa")).toBe(17);
    expect(out.get("0xb")).toBe(5);
    expect(out.get("0xc")).toBe(3);
    expect([...out.keys()].sort()).toEqual(["0xa", "0xb", "0xc"]);
  });

  it("returns an empty map for no fechas", () => {
    expect(sumSeasonScores([]).size).toBe(0);
  });
});
