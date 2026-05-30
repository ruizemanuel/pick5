/**
 * Sum per-wallet scores across a season's fechas. Input is one wallet->score map
 * per fecha (on-chain scores); output is the union of wallets with their season
 * total. A wallet that played >= 1 fecha appears in the result.
 */
export function sumSeasonScores(fechaScores: Map<string, number>[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const m of fechaScores) {
    for (const [wallet, score] of m) {
      totals.set(wallet, (totals.get(wallet) ?? 0) + score);
    }
  }
  return totals;
}
