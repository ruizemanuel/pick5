import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { celo, celoAlfajores, celoSepolia } from "viem/chains";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { leaderboardCache } from "@/lib/db/schema";
import { getLive, isMwSettled } from "@/lib/fpl/client";
import { liveToMap } from "@/lib/fpl/scoring";
import { pick5PoolAbi } from "@/lib/contracts/abi";
import { poolAddress, DEFAULT_NETWORK } from "@/lib/contracts/addresses";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function getChain(network: string) {
  if (network === "celo") return celo;
  if (network === "celo-sepolia") return celoSepolia;
  return celoAlfajores;
}

export async function GET(req: NextRequest) {
  // Triggered by the GH Actions cron (Bearer CRON_SECRET). The endpoint
  // does on-chain reads + DB writes, so gate it to prevent DoS even though
  // the cache it produces is non-authoritative.
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const db = getDb();

  const network = DEFAULT_NETWORK;
  const chain = getChain(network);
  const client = createPublicClient({ chain, transport: http() });
  const poolAddr = poolAddress(network);

  if (poolAddr === "0x0000000000000000000000000000000000000000") {
    return NextResponse.json({ ok: false, reason: `pool not configured for ${network}` });
  }

  const numParticipants = (await client.readContract({
    address: poolAddr,
    abi: pick5PoolAbi,
    functionName: "participantsLength",
  })) as bigint;

  if (numParticipants === BigInt(0)) {
    return NextResponse.json({ ok: true, users: 0 });
  }

  const settled37 = await isMwSettled(37).catch(() => false);
  const settled38 = await isMwSettled(38).catch(() => false);

  const m37 = settled37 ? liveToMap(await getLive(37)) : new Map<number, number>();
  const m38 = settled38 ? liveToMap(await getLive(38)) : new Map<number, number>();

  type Lineup = readonly [bigint, bigint, bigint, bigint, bigint];
  const lineups: Record<string, Lineup> = {};
  for (let i = BigInt(0); i < numParticipants; i += BigInt(1)) {
    const u = (await client.readContract({
      address: poolAddr,
      abi: pick5PoolAbi,
      functionName: "participants",
      args: [i],
    })) as `0x${string}`;
    const lin = (await client.readContract({
      address: poolAddr,
      abi: pick5PoolAbi,
      functionName: "getLineup",
      args: [u],
    })) as Lineup;
    lineups[u] = lin;
  }

  for (const [user, lineup] of Object.entries(lineups)) {
    let mw37Pts = 0;
    let mw38Pts = 0;
    for (const idBn of lineup) {
      const id = Number(idBn);
      mw37Pts += m37.get(id) ?? 0;
      mw38Pts += m38.get(id) ?? 0;
    }
    // Store lowercase — /api/leaderboard/me normalizes the query param to
    // lowercase before an exact match, so the cache key must be lowercase too.
    await db
      .insert(leaderboardCache)
      .values({ wallet: user.toLowerCase(), mw37Pts, mw38Pts, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: leaderboardCache.wallet,
        set: { mw37Pts, mw38Pts, updatedAt: new Date() },
      });
  }

  // Recompute ranks via window function
  await db.execute(sql`
    UPDATE leaderboard_cache lc
    SET rank = sub.rank
    FROM (
      SELECT wallet, RANK() OVER (ORDER BY (mw37_pts + mw38_pts) DESC) AS rank
      FROM leaderboard_cache
    ) sub
    WHERE lc.wallet = sub.wallet
  `);

  return NextResponse.json({ ok: true, users: Object.keys(lineups).length });
}
