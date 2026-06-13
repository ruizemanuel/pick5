import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Match } from "@/lib/fixtures/fixtures";
import type { Xi } from "@/lib/fixtures/tie-in";
import type { UiPlayer } from "@/lib/players/uiPlayer";
import { MatchDetail } from "./MatchDetail";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, string>)} />;
  },
}));

function uiPlayer(id: number, name: string, teamId: number): UiPlayer {
  return { id, name, team: "X", teamColor: "#fff", position: "FWD", cost: 5, form: 0, owned: 0, points: 0, photoUrl: "", initials: "XX", eliminated: false, teamId };
}

const players = new Map<number, UiPlayer>([
  [10, uiPlayer(10, "Quinones", 28)],
  [11, uiPlayer(11, "Lira", 28)],
]);

function detailMatch(over: Partial<Match> = {}): Match {
  return {
    id: 1, kickoff: "2026-06-11T20:00:00+01:00", status: "finished",
    home: { squadId: 28, name: "Mexico", abbr: "MEX", score: 1, penalties: 0 },
    away: { squadId: 40, name: "South Africa", abbr: "RSA", score: 0, penalties: 0 },
    goals: [{ side: "home", scorerId: 10, assistId: 11 }],
    ...over,
  };
}

describe("MatchDetail", () => {
  it("lists goal scorers, assists, and the scoring team tag", () => {
    render(<MatchDetail match={detailMatch()} playersById={players} myXi={null} />);
    expect(screen.getByText("Quinones")).toBeInTheDocument();
    expect(screen.getByText(/Lira/)).toBeInTheDocument();
    expect(screen.getByText("MEX")).toBeInTheDocument();
  });
  it("shows 'No goals' when there are none", () => {
    render(<MatchDetail match={detailMatch({ goals: [] })} playersById={players} myXi={null} />);
    expect(screen.getByText(/no goals/i)).toBeInTheDocument();
  });
  it("renders a Your players section with the captain badge", () => {
    const xi: Xi = { ids: new Set([10]), captainId: 10 };
    render(<MatchDetail match={detailMatch()} playersById={players} myXi={xi} />);
    expect(screen.getByText("Your players")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });
  it("falls back to #id when a scorer is missing from the map", () => {
    render(<MatchDetail match={detailMatch({ goals: [{ side: "away", scorerId: 999, assistId: null }] })} playersById={players} myXi={null} />);
    expect(screen.getByText("#999")).toBeInTheDocument();
  });
});
