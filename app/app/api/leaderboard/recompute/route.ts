import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, type PublicClient } from "viem";
import { celo, celoAlfajores, celoSepolia } from "viem/chains";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { leaderboardCache } from "@/lib/db/schema";
import { FplScoreProvider } from "@/lib/scoring/fpl-provider";
import { pick5PoolAbi } from "@/lib/contracts/abi";
import { DEFAULT_NETWORK } from "@/lib/contracts/addresses";
import { resolvePoolById } from "@/lib/contracts/factory";
import { getActiveSeason, fechaRound } from "@/lib/tournaments/seasons";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function getChain(network: string) {
  if (network === "celo") return celo;
  if (network === "celo-sepolia") return celoSepolia;
  return celoAlfajores;
}

type Lineup = readonly [bigint, bigint, bigint, bigint, bigint];

/**
 * Recompute one fecha's per-wallet points into leaderboard_cache, keyed by
 * (tournament_id, wallet). Two sources, branched on the fecha pool's state:
 *   scoresSubmitted=false -> live FPL feed for this fecha's round (provisional)
 *   scoresSubmitted=true  -> immutable on-chain scores[wallet] (drift-proof)
 * Writes a per-fecha rank (RANK within this tournament_id), NULL until points exist.
 * Returns the number of participants written.
 */
async function recomputeFecha(
  db: ReturnType<typeof getDb>,
  client: Pick<PublicClient, "readContract">,
  tournamentId: number,
  round: number,
): Promise<number> {
  const pool = await resolvePoolById(client, DEFAULT_NETWORK, tournamentId);
  if (!pool) return 0;

  const [numParticipants, scoresSubmittedOnChain] = await Promise.all([
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "participantsLength" }) as Promise<bigint>,
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "scoresSubmitted" }) as Promise<boolean>,
  ]);
  if (numParticipants === BigInt(0)) return 0;

  const roundMap = scoresSubmittedOnChain
    ? new Map<number, number>()
    : await FplScoreProvider.getRoundPoints(round).catch(() => new Map<number, number>());

  const participants: `0x${string}`[] = [];
  for (let i = BigInt(0); i < numParticipants; i += BigInt(1)) {
    participants.push(
      (await client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "participants", args: [i] })) as `0x${string}`,
    );
  }

  let maxPts = 0;
  for (const user of participants) {
    let pts = 0;
    if (scoresSubmittedOnChain) {
      pts = Number(
        (await client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "scores", args: [user] })) as bigint,
      );
    } else {
      const lineup = (await client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "getLineup", args: [user] })) as Lineup;
      for (const idBn of lineup) pts += roundMap.get(Number(idBn)) ?? 0;
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
  const client = createPublicClient({ chain: getChain(network), transport: http() });

  // ?t=<tournamentId> recomputes one fecha; absent -> every fecha of the active season.
  const tParam = req.nextUrl.searchParams.get("t");
  let fechas: { tournamentId: number; round: number }[];
  if (tParam !== null) {
    const t = Number(tParam);
    const round = fechaRound(t);
    if (round === undefined) {
      return NextResponse.json({ ok: false, reason: `tournamentId ${t} not in season config` }, { status: 400 });
    }
    fechas = [{ tournamentId: t, round }];
  } else {
    fechas = getActiveSeason().fechas;
  }

  const results: { tournamentId: number; users: number }[] = [];
  for (const f of fechas) {
    const users = await recomputeFecha(db, client, f.tournamentId, f.round);
    results.push({ tournamentId: f.tournamentId, users });
  }
  return NextResponse.json({ ok: true, fechas: results });
}
