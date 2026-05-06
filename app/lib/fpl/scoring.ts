export type Lineup = readonly [number, number, number, number, number];

/**
 * Sum lineup points across an arbitrary set of MW point maps.
 * Each map: playerId → totalPoints.
 * Missing playerIds resolve to 0.
 */
export function aggregateUserScores(
  lineups: Record<string, Lineup>,
  ...mwPointMaps: Map<number, number>[]
): Array<{ user: string; points: number }> {
  return Object.entries(lineups).map(([user, lineup]) => {
    let total = 0;
    for (const pid of lineup) {
      for (const m of mwPointMaps) {
        total += m.get(pid) ?? 0;
      }
    }
    return { user, points: total };
  });
}

/**
 * Convert FPL live response into a playerId → total_points map.
 */
export function liveToMap(live: { elements: Array<{ id: number; stats: { total_points: number } }> }): Map<number, number> {
  const m = new Map<number, number>();
  for (const e of live.elements) m.set(e.id, e.stats.total_points);
  return m;
}
