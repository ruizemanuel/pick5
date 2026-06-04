/** Public path to a national-team kit PNG (self-hosted from FIFA's feed, keyed by
 * squadId 1..48). Returns undefined when there is no team (e.g. the FPL provider). */
export function kitUrl(teamId?: number): string | undefined {
  return teamId ? `/kits/${teamId}.png` : undefined;
}
