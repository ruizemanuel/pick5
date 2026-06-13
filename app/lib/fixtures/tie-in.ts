import type { Match } from "./fixtures";
import type { UiPlayer } from "@/lib/players/uiPlayer";

export type Xi = { ids: Set<number>; captainId: number | undefined };

export type MyPlayerInMatch = {
  id: number;
  name: string;
  teamId: number | undefined;
  isCaptain: boolean;
  scored: boolean;
  assisted: boolean;
};

/** Which of the user's XI feature in this match (by team), with captain/scored/assisted flags. */
export function tieInForMatch(
  match: Match,
  xi: Xi | null,
  playersById: Map<number, UiPlayer>,
): { involved: boolean; players: MyPlayerInMatch[] } {
  if (!xi) return { involved: false, players: [] };
  const squads = new Set<number>([match.home.squadId, match.away.squadId]);
  const players: MyPlayerInMatch[] = [];
  for (const id of xi.ids) {
    const p = playersById.get(id);
    if (!p || p.teamId === undefined || !squads.has(p.teamId)) continue;
    players.push({
      id,
      name: p.name,
      teamId: p.teamId,
      isCaptain: id === xi.captainId,
      scored: match.goals.some((g) => g.scorerId === id),
      assisted: match.goals.some((g) => g.assistId === id),
    });
  }
  const rank = (x: MyPlayerInMatch) => (x.isCaptain ? 0 : x.scored ? 1 : 2);
  players.sort((a, b) => rank(a) - rank(b) || a.id - b.id);
  return { involved: players.length > 0, players };
}

export type EnrichedGoal = {
  side: "home" | "away";
  scorerId: number;
  scorerName: string;
  assistId: number | null;
  assistName: string | null;
};

/** Resolve goal scorer/assist ids to names (fallback `#id`). Preserves goal order. */
export function enrichGoals(match: Match, playersById: Map<number, UiPlayer>): EnrichedGoal[] {
  return match.goals.map((g) => ({
    side: g.side,
    scorerId: g.scorerId,
    scorerName: playersById.get(g.scorerId)?.name ?? `#${g.scorerId}`,
    assistId: g.assistId,
    assistName: g.assistId == null ? null : (playersById.get(g.assistId)?.name ?? `#${g.assistId}`),
  }));
}
