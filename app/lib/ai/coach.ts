import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import type { FplBootstrap } from "@/lib/fpl/client";

export const PicksSchema = z.object({
  picks: z
    .array(
      z.object({
        playerId: z.number().int().min(1).max(999),
        playerName: z.string(),
        reasoning: z.string().min(20).max(300),
      })
    )
    .length(5),
});

export type CoachPicks = z.infer<typeof PicksSchema>;

export async function generateCoachPicks(
  mw: number,
  bootstrap: FplBootstrap
): Promise<CoachPicks> {
  // Build top 50 candidate context: form × ownership / cost
  const topPlayers = bootstrap.elements
    .map((e) => ({
      id: e.id,
      name: e.web_name,
      team: bootstrap.teams.find((t) => t.id === e.team)?.short_name ?? "",
      position: ["GK", "DEF", "MID", "FWD"][e.element_type - 1] ?? "?",
      cost: e.now_cost / 10,
      form: parseFloat(e.form),
      owned: parseFloat(e.selected_by_percent),
      total_points: e.total_points,
    }))
    .sort(
      (a, b) =>
        (b.form * b.owned) / Math.max(b.cost, 0.1) -
        (a.form * a.owned) / Math.max(a.cost, 0.1)
    )
    .slice(0, 50);

  const result = await generateObject({
    model: gateway("anthropic/claude-sonnet-4-6"),
    schema: PicksSchema,
    prompt: `You are an expert FPL (Fantasy Premier League) analyst making picks for matchweek ${mw}.
Pick the 5 players most likely to deliver high points. All 5 must be DISTINCT player IDs.
Consider: recent form, fixture difficulty, ownership, and value.

Top 50 candidates (sorted by form × ownership ÷ cost):
${JSON.stringify(topPlayers, null, 2)}

Output the 5 best picks with their FPL playerId, web_name, and a 1-2 sentence reasoning each.`,
  });

  // Validate distinct IDs
  const ids = new Set(result.object.picks.map((p) => p.playerId));
  if (ids.size !== 5) throw new Error("LLM returned duplicate player IDs");
  return result.object;
}
