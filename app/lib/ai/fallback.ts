import type { FplBootstrap } from "@/lib/fpl/client";
import type { CoachPicks } from "./coach";

export function fallbackPicks(bootstrap: FplBootstrap): CoachPicks {
  const ranked = bootstrap.elements
    .map((e) => ({
      id: e.id,
      name: e.web_name,
      score:
        (parseFloat(e.form) * parseFloat(e.selected_by_percent)) /
        Math.max(e.now_cost / 10, 0.1),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    picks: ranked.map((r) => ({
      playerId: r.id,
      playerName: r.name,
      reasoning: "Selected via rule-based fallback (form × ownership ÷ cost).",
    })) as CoachPicks["picks"],
  };
}
