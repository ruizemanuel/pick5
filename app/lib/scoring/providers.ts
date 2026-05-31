import type { ScoreProvider } from "./provider";
import { FplScoreProvider } from "./fpl-provider";
import { OnzeWcScoreProvider } from "./worldcup-provider";
import { getActiveSeason, seasonProvider } from "@/lib/tournaments/seasons";

const PROVIDERS: Record<string, ScoreProvider> = {
  [FplScoreProvider.id]: FplScoreProvider,
  [OnzeWcScoreProvider.id]: OnzeWcScoreProvider,
};

/** Resolve a provider by id; falls back to FPL for an unknown id. */
export function getProvider(id: string): ScoreProvider {
  return PROVIDERS[id] ?? FplScoreProvider;
}

/** The provider for the currently-active season. */
export function getActiveProvider(): ScoreProvider {
  return getProvider(seasonProvider(getActiveSeason()));
}
