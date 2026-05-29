import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM layer so we can drive generateCoachPicks' output validation.
vi.mock("@ai-sdk/gateway", () => ({ gateway: vi.fn(() => "mock-model") }));
vi.mock("ai", () => ({ generateObject: vi.fn() }));

import { generateObject } from "ai";
import { generateCoachPicks } from "@/lib/ai/coach";
import type { ProviderPlayer } from "../provider";

function player(over: Partial<ProviderPlayer>): ProviderPlayer {
  return {
    id: 1,
    name: "P",
    team: "ARS",
    position: "MID",
    cost: 10,
    form: 5,
    owned: 20,
    totalPoints: 100,
    status: "a",
    chanceThisRound: null,
    chanceNextRound: null,
    ...over,
  };
}

// id 9 is injured -> filtered OUT of the candidate pool; ids 4-8 are available.
const pool: ProviderPlayer[] = [
  player({ id: 4, status: "a" }),
  player({ id: 5, status: "a" }),
  player({ id: 6, status: "a" }),
  player({ id: 7, status: "a" }),
  player({ id: 8, status: "a" }),
  player({ id: 9, status: "i", form: 9, owned: 90, cost: 4 }),
];

function pick(id: number) {
  return { playerId: id, playerName: "X", reasoning: "x".repeat(25) };
}

beforeEach(() => {
  vi.mocked(generateObject).mockReset();
});

describe("generateCoachPicks output validation (X.1 enforcement)", () => {
  it("rejects picks containing a player outside the available candidate pool", async () => {
    // The LLM returns id 9 (injured, not in the filtered pool).
    vi.mocked(generateObject).mockResolvedValue({
      object: { picks: [pick(4), pick(5), pick(6), pick(7), pick(9)] },
    } as never);
    await expect(generateCoachPicks(38, pool)).rejects.toThrow(/candidate pool/);
  });

  it("accepts picks that are all within the available candidate pool", async () => {
    vi.mocked(generateObject).mockResolvedValue({
      object: { picks: [pick(4), pick(5), pick(6), pick(7), pick(8)] },
    } as never);
    const res = await generateCoachPicks(38, pool);
    expect(res.picks.map((p) => p.playerId)).toEqual([4, 5, 6, 7, 8]);
  });

  it("rejects duplicate ids (existing guard still holds)", async () => {
    vi.mocked(generateObject).mockResolvedValue({
      object: { picks: [pick(4), pick(4), pick(5), pick(6), pick(7)] },
    } as never);
    await expect(generateCoachPicks(38, pool)).rejects.toThrow(/duplicate/);
  });
});
