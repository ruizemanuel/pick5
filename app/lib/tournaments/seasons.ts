// Off-chain season config — the single source mapping each fecha (a gameweek
// Pick5Pool) to its FPL round, grouping fechas into a season, and pointing at the
// season's on-chain SeasonPool id. The contracts store no FPL round numbers, so
// this maps them. Update the entries to match the tournaments/seasons the factory
// actually created before each deploy (Tanda C4).

export type Fecha = {
  tournamentId: number; // factory.tournamentBy(tournamentId)
  round: number;        // FPL gameweek this fecha scores
};

export type Season = {
  seasonId: number;     // factory.seasonBy(seasonId) -> SeasonPool
  label: string;
  fechas: Fecha[];
};

// Example config (Premier League 2026/27). Replace tournamentId/round/seasonId
// with the real on-chain values at deploy time.
export const SEASONS: Season[] = [
  {
    seasonId: 0,
    label: "Premier League 2026/27",
    fechas: [
      { tournamentId: 0, round: 39 },
      { tournamentId: 1, round: 40 },
    ],
  },
];

/** The current season = the highest seasonId in the config. */
export function getActiveSeason(): Season {
  return SEASONS.reduce((a, b) => (b.seasonId > a.seasonId ? b : a), SEASONS[0]);
}

export function getSeasonById(seasonId: number): Season | undefined {
  return SEASONS.find((s) => s.seasonId === seasonId);
}

/** The season that contains a given fecha (tournamentId), if any. */
export function seasonForFecha(tournamentId: number): Season | undefined {
  return SEASONS.find((s) => s.fechas.some((f) => f.tournamentId === tournamentId));
}

/** The FPL round a fecha scores, or undefined if the tournamentId isn't configured. */
export function fechaRound(tournamentId: number): number | undefined {
  for (const s of SEASONS) {
    const f = s.fechas.find((x) => x.tournamentId === tournamentId);
    if (f) return f.round;
  }
  return undefined;
}

/** All tournamentIds belonging to a season. */
export function seasonFechaIds(season: Season): number[] {
  return season.fechas.map((f) => f.tournamentId);
}

/** Is `round` an FPL round configured in any season? (coach mw validation) */
export function isConfiguredRound(round: number): boolean {
  return SEASONS.some((s) => s.fechas.some((f) => f.round === round));
}
