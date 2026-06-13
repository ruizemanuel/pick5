import { describe, it, expect } from "vitest";
import { tieInForMatch, enrichGoals, type Xi } from "../tie-in";
import type { Match } from "../fixtures";
import type { UiPlayer } from "@/lib/players/uiPlayer";

function uiPlayer(id: number, name: string, teamId: number): UiPlayer {
  return { id, name, team: "X", teamColor: "#fff", position: "FWD", cost: 5, form: 0, owned: 0, points: 0, photoUrl: "", initials: "XX", eliminated: false, teamId };
}

function m(over: Partial<Match> = {}): Match {
  return {
    id: 1, kickoff: "2026-06-11T20:00:00+01:00", status: "finished",
    home: { squadId: 28, name: "Mexico", abbr: "MEX", score: 2, penalties: 0 },
    away: { squadId: 40, name: "South Africa", abbr: "RSA", score: 1, penalties: 0 },
    goals: [],
    ...over,
  };
}

const players = new Map<number, UiPlayer>([
  [1, uiPlayer(1, "Captain", 28)],
  [2, uiPlayer(2, "Scorer", 40)],
  [3, uiPlayer(3, "Other", 28)],
  [9, uiPlayer(9, "Bench", 99)],
]);

describe("tieInForMatch", () => {
  it("returns not-involved when xi is null", () => {
    expect(tieInForMatch(m(), null, players)).toEqual({ involved: false, players: [] });
  });
  it("includes only players whose team is in the match", () => {
    const xi: Xi = { ids: new Set([1, 9]), captainId: undefined };
    const res = tieInForMatch(m(), xi, players);
    expect(res.involved).toBe(true);
    expect(res.players.map((p) => p.id)).toEqual([1]);
  });
  it("flags scored/assisted from the match goals", () => {
    const xi: Xi = { ids: new Set([2]), captainId: undefined };
    const res = tieInForMatch(m({ goals: [{ side: "away", scorerId: 2, assistId: null }] }), xi, players);
    expect(res.players[0]).toMatchObject({ id: 2, scored: true, assisted: false });
  });
  it("orders captain first, then scorers, then the rest", () => {
    const xi: Xi = { ids: new Set([3, 1, 2]), captainId: 1 };
    const res = tieInForMatch(m({ goals: [{ side: "away", scorerId: 2, assistId: null }] }), xi, players);
    expect(res.players.map((p) => p.id)).toEqual([1, 2, 3]);
  });
});

describe("enrichGoals", () => {
  it("resolves scorer + assist names", () => {
    const res = enrichGoals(m({ goals: [{ side: "home", scorerId: 1, assistId: 3 }] }), players);
    expect(res).toEqual([{ side: "home", scorerId: 1, scorerName: "Captain", assistId: 3, assistName: "Other" }]);
  });
  it("keeps assistName null when there is no assist", () => {
    const res = enrichGoals(m({ goals: [{ side: "away", scorerId: 2, assistId: null }] }), players);
    expect(res[0]).toMatchObject({ scorerName: "Scorer", assistId: null, assistName: null });
  });
  it("falls back to #id when a player is missing from the map", () => {
    const res = enrichGoals(m({ goals: [{ side: "home", scorerId: 777, assistId: 888 }] }), players);
    expect(res[0]).toMatchObject({ scorerName: "#777", assistName: "#888" });
  });
});
