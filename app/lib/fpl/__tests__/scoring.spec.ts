import { describe, it, expect } from "vitest";
import { aggregateUserScores, liveToMap } from "../scoring";

describe("aggregateUserScores", () => {
  it("sums lineup points across two MWs", () => {
    const lineups = {
      "0xa": [1, 2, 3, 4, 5] as const,
      "0xb": [10, 20, 30, 40, 50] as const,
    };
    const mw37 = new Map<number, number>([
      [1, 5], [2, 3], [3, 0], [4, 8], [5, 2],
      [10, 1], [20, 0], [30, 4], [40, 0], [50, 6],
    ]);
    const mw38 = new Map<number, number>([
      [1, 0], [2, 6], [3, 1], [4, 2], [5, 0],
      [10, 9], [20, 3], [30, 2], [40, 5], [50, 0],
    ]);

    const result = aggregateUserScores(lineups, mw37, mw38);
    expect(result.find((r) => r.user === "0xa")?.points).toBe(5 + 3 + 0 + 8 + 2 + 0 + 6 + 1 + 2 + 0); // 27
    expect(result.find((r) => r.user === "0xb")?.points).toBe(1 + 0 + 4 + 0 + 6 + 9 + 3 + 2 + 5 + 0); // 30
  });

  it("treats missing player as 0 points", () => {
    const lineups = { "0xa": [1, 999, 3, 4, 5] as const };
    const mw37 = new Map<number, number>([[1, 5], [3, 0], [4, 8], [5, 2]]);
    const mw38 = new Map<number, number>([[1, 0], [3, 1], [4, 2], [5, 0]]);
    const result = aggregateUserScores(lineups, mw37, mw38);
    expect(result[0].points).toBe(5 + 0 + 8 + 2 + 0 + 1 + 2 + 0); // 18 (player 999 not found)
  });

  it("works with a single MW map", () => {
    const lineups = { "0xa": [1, 2, 3, 4, 5] as const };
    const mw37 = new Map<number, number>([[1, 10], [2, 5], [3, 3], [4, 2], [5, 1]]);
    const result = aggregateUserScores(lineups, mw37);
    expect(result[0].points).toBe(21);
  });
});

describe("liveToMap", () => {
  it("converts live response to map", () => {
    const live = {
      elements: [
        { id: 1, stats: { total_points: 5 } },
        { id: 2, stats: { total_points: 3 } },
      ],
    };
    const m = liveToMap(live);
    expect(m.get(1)).toBe(5);
    expect(m.get(2)).toBe(3);
    expect(m.get(99)).toBeUndefined();
  });
});
