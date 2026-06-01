import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, type PublicClient } from "viem";
import { chainForNetwork } from "@/lib/contracts/chain";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { leaderboardCache } from "@/lib/db/schema";
import { scoreLineup } from "@/lib/scoring/lineup-score";
import { getProvider } from "@/lib/scoring/providers";
import { getPhasePoints } from "@/lib/scoring/phase-points";
import { onzePoolAbi } from "@/lib/contracts/abi";
import { DEFAULT_NETWORK } from "@/lib/contracts/addresses";
import { resolvePoolById } from "@/lib/contracts/factory";
import { getActiveSeason, fechaRound, phaseRounds, seasonProvider, type Season } from "@/lib/tournaments/seasons";
import type { ScoreProvider } from "@/lib/scoring/provider";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Recompute one fecha's per-wallet points into leaderboard_cache, keyed by
 * (tournament_id, wallet). Two sources, branched on the fecha pool's state:
 *   scoresSubmitted=false -> live feed for this fecha's phase rounds (provisional, captain doubled)
 *   scoresSubmitted=true  -> immutable on-chain scores[wallet] (drift-proof)
 * Writes a per-fecha rank (RANK within this tournament_id), NULL until points exist.
 * Returns the number of participants written.
 */
async function recomputeFecha(
  db: ReturnType<typeof getDb>,
  client: Pick<PublicClient, "readContract">,
  tournamentId: number,
  provider: ScoreProvider,
  rounds: number[],
): Promise<number> {
  const pool = await resolvePoolById(client, DEFAULT_NETWORK, tournamentId);
  if (!pool) return 0;

  const [numParticipants, scoresSubmittedOnChain] = await Promise.all([
    client.readContract({ address: pool, abi: onzePoolAbi, functionName: "participantsLength" }) as Promise<bigint>,
    client.readContract({ address: pool, abi: onzePoolAbi, functionName: "scoresSubmitted" }) as Promise<boolean>,
  ]);
  if (numParticipants === BigInt(0)) return 0;

  const roundMap = scoresSubmittedOnChain
    ? new Map<number, number>()
    : await getPhasePoints(provider, rounds).catch(() => new Map<number, number>());

  const participants: `0x${string}`[] = [];
  for (let i = BigInt(0); i < numParticipants; i += BigInt(1)) {
    participants.push(
      (await client.readContract({ address: pool, abi: onzePoolAbi, functionName: "participants", args: [i] })) as `0x${string}`,
    );
  }

  let maxPts = 0;
  for (const user of participants) {
    let pts = 0;
    if (scoresSubmittedOnChain) {
      pts = Number(
        (await client.readContract({ address: pool, abi: onzePoolAbi, functionName: "scores", args: [user] })) as bigint,
      );
    } else {
      const [lineupRaw, captainRaw] = await Promise.all([
        client.readContract({ address: pool, abi: onzePoolAbi, functionName: "getLineup", args: [user] }) as Promise<readonly (bigint | number)[]>,
        client.readContract({ address: pool, abi: onzePoolAbi, functionName: "captainOf", args: [user] }) as Promise<bigint | number>,
      ]);
      pts = scoreLineup(lineupRaw.map((x) => Number(x)), Number(captainRaw), roundMap);
    }
    maxPts = Math.max(maxPts, pts);
    await db
      .insert(leaderboardCache)
      .values({ tournamentId, wallet: user.toLowerCase(), pts, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [leaderboardCache.tournamentId, leaderboardCache.wallet],
        set: { pts, updatedAt: new Date() },
      });
  }

  // Per-fecha rank within this tournament_id, only once points exist (else NULL).
  if (maxPts > 0) {
    await db.execute(sql`
      UPDATE leaderboard_cache lc
      SET rank = sub.rank
      FROM (
        SELECT wallet, RANK() OVER (ORDER BY pts DESC) AS rank
        FROM leaderboard_cache
        WHERE tournament_id = ${tournamentId}
      ) sub
      WHERE lc.tournament_id = ${tournamentId} AND lc.wallet = sub.wallet
    `);
  } else {
    await db.execute(sql`UPDATE leaderboard_cache SET rank = NULL WHERE tournament_id = ${tournamentId}`);
  }
  return participants.length;
}

export async function GET(req: NextRequest) {
  // Cron-gated (Bearer CRON_SECRET) — does on-chain reads + DB writes.
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const db = getDb();
  const network = DEFAULT_NETWORK;
  const client = createPublicClient({ chain: chainForNetwork(network), transport: http() });

  const season: Season = getActiveSeason();
  const provider = getProvider(seasonProvider(season));

  // ?t=<tournamentId> recomputes one fecha; absent -> every fecha of the active season.
  const tParam = req.nextUrl.searchParams.get("t");
  let tournamentIds: number[];
  if (tParam !== null) {
    const t = Number(tParam);
    if (fechaRound(t) === undefined) {
      return NextResponse.json({ ok: false, reason: `tournamentId ${t} not in season config` }, { status: 400 });
    }
    tournamentIds = [t];
  } else {
    tournamentIds = season.fechas.map((f) => f.tournamentId);
  }

  const results: { tournamentId: number; users: number }[] = [];
  for (const tid of tournamentIds) {
    const rounds = phaseRounds(season, tid);
    const users = await recomputeFecha(db, client, tid, provider, rounds);
    results.push({ tournamentId: tid, users });
  }
  return NextResponse.json({ ok: true, fechas: results });
}
