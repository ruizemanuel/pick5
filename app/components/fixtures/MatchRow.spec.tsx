import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Match } from "@/lib/fixtures/fixtures";
import type { Xi } from "@/lib/fixtures/tie-in";
import type { UiPlayer } from "@/lib/players/uiPlayer";
import { MatchRow } from "./MatchRow";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, string>)} />;
  },
}));

function uiPlayer(id: number, name: string, teamId: number): UiPlayer {
  return { id, name, team: "X", teamColor: "#fff", position: "FWD", cost: 5, form: 0, owned: 0, points: 0, photoUrl: "", initials: "XX", eliminated: false, teamId };
}

function match(over: Partial<Match> = {}): Match {
  return {
    id: 1, kickoff: "2026-06-11T20:00:00+01:00",
    status: "upcoming",
    home: { squadId: 28, name: "Mexico", abbr: "MEX", score: null, penalties: null },
    away: { squadId: 40, name: "South Africa", abbr: "RSA", score: null, penalties: null },
    goals: [],
    ...over,
  };
}

describe("MatchRow", () => {
  it("shows both team abbreviations and kit images", () => {
    render(<MatchRow match={match()} />);
    expect(screen.getByText("MEX")).toBeInTheDocument();
    expect(screen.getByText("RSA")).toBeInTheDocument();
    expect(screen.getByAltText("Mexico")).toBeInTheDocument();
    expect(screen.getByAltText("South Africa")).toBeInTheDocument();
  });

  it("shows the score and an FT badge for a finished match", () => {
    render(<MatchRow match={match({ status: "finished", home: { squadId: 28, name: "Mexico", abbr: "MEX", score: 2, penalties: 0 }, away: { squadId: 40, name: "South Africa", abbr: "RSA", score: 0, penalties: 0 } })} />);
    expect(screen.getByText("FT")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows a LIVE badge for an in-play match", () => {
    render(<MatchRow match={match({ status: "live", home: { squadId: 28, name: "Mexico", abbr: "MEX", score: 1, penalties: null }, away: { squadId: 40, name: "South Africa", abbr: "RSA", score: 1, penalties: null } })} />);
    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });

  it("shows penalties for a KO match decided on pens", () => {
    render(<MatchRow match={match({ status: "finished", home: { squadId: 28, name: "Mexico", abbr: "MEX", score: 1, penalties: 4 }, away: { squadId: 40, name: "South Africa", abbr: "RSA", score: 1, penalties: 3 } })} />);
    expect(screen.getByText(/4.?3 pens/i)).toBeInTheDocument();
  });

  it("is not expandable (no button) with no goals and no tie-in", () => {
    render(<MatchRow match={match({ status: "finished", goals: [], home: { squadId: 28, name: "Mexico", abbr: "MEX", score: 2, penalties: 0 }, away: { squadId: 40, name: "South Africa", abbr: "RSA", score: 0, penalties: 0 } })} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("expands to reveal goal scorers when the match has goals", () => {
    const m = match({ status: "finished", goals: [{ side: "home", scorerId: 99, assistId: null }], home: { squadId: 28, name: "Mexico", abbr: "MEX", score: 1, penalties: 0 }, away: { squadId: 40, name: "South Africa", abbr: "RSA", score: 0, penalties: 0 } });
    render(<MatchRow match={m} playersById={new Map([[99, uiPlayer(99, "Striker", 28)]])} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Striker")).toBeInTheDocument();
  });

  it("shows a gold tie-in marker with the count when your XI plays", () => {
    const xi: Xi = { ids: new Set([5]), captainId: 5 };
    render(<MatchRow match={match()} playersById={new Map([[5, uiPlayer(5, "Mine", 28)]])} myXi={xi} />);
    expect(screen.getByText(/●1/)).toBeInTheDocument();
  });
});
