import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http } from "viem";
import { celo, celoAlfajores, celoSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import crypto from "node:crypto";
import { eq, and } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { oracleRuns } from "@/lib/db/schema";
import { getLive, isMwSettled } from "@/lib/fpl/client";
import { aggregateUserScores, liveToMap } from "@/lib/fpl/scoring";
import { pick5PoolAbi } from "@/lib/contracts/abi";
import { DEFAULT_NETWORK, poolAddress } from "@/lib/contracts/addresses";
import type { Network } from "@/lib/contracts/addresses";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function getChain(network: Network) {
  if (network === "celo") return celo;
  if (network === "alfajores") return celoAlfajores;
  if (network === "celo-sepolia") return celoSepolia;
  return celoAlfajores;
}

export async function GET(req: NextRequest) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const mwParam = req.nextUrl.searchParams.get("mw");
  const mw = Number(mwParam ?? 38);
  if (mw !== 38) {
    return NextResponse.json({
      ok: false,
      reason: "only mw=38 triggers final submitScores; intermediate MWs update leaderboard cache only",
    });
  }

  const db = getDb();

  // Idempotency: check if already submitted
  const recent = await db
    .select()
    .from(oracleRuns)
    .where(and(eq(oracleRuns.mw, mw), eq(oracleRuns.status, "submitted")));
  if (recent.length > 0) {
    return NextResponse.json({ ok: true, reason: "already submitted", txHash: recent[0].txHash });
  }

  // Check FPL settlement for both MWs
  const settled37 = await isMwSettled(37).catch(() => false);
  const settled38 = await isMwSettled(38).catch(() => false);
  if (!settled37 || !settled38) {
    await db.insert(oracleRuns).values({
      mw,
      status: "skipped",
      error: `settled37=${settled37} settled38=${settled38}`,
    });
    return NextResponse.json({ ok: false, reason: "not settled, will retry" });
  }

  // Fetch FPL points for both MWs
  const [live37, live38] = await Promise.all([getLive(37), getLive(38)]);
  const m37 = liveToMap(live37);
  const m38 = liveToMap(live38);

  // Read participants + lineups from contract
  const network = DEFAULT_NETWORK;
  const chain = getChain(network);
  const publicClient = createPublicClient({ chain, transport: http() });
  const poolAddr = poolAddress(network);
  if (poolAddr === "0x0000000000000000000000000000000000000000") {
    return NextResponse.json(
      { ok: false, reason: "pool address not configured for network " + network },
      { status: 500 }
    );
  }

  const numParticipants = (await publicClient.readContract({
    address: poolAddr,
    abi: pick5PoolAbi,
    functionName: "participantsLength",
  })) as bigint;

  if (numParticipants === BigInt(0)) {
    return NextResponse.json({ ok: false, reason: "no participants" });
  }

  const participants: `0x${string}`[] = [];
  for (let i = BigInt(0); i < numParticipants; i += BigInt(1)) {
    const p = (await publicClient.readContract({
      address: poolAddr,
      abi: pick5PoolAbi,
      functionName: "participants",
      args: [i],
    })) as `0x${string}`;
    participants.push(p);
  }

  const lineups: Record<string, readonly [number, number, number, number, number]> = {};
  for (const user of participants) {
    const lineup = (await publicClient.readContract({
      address: poolAddr,
      abi: pick5PoolAbi,
      functionName: "getLineup",
      args: [user],
    })) as readonly [number, number, number, number, number];
    lineups[user] = lineup;
  }

  // Compute scores
  const scoreList = aggregateUserScores(lineups, m37, m38);
  const users = scoreList.map((s) => s.user as `0x${string}`);
  const points = scoreList.map((s) => BigInt(s.points));

  // Generate random seed (uint256 — pass as hex string, viem handles encoding)
  const randomSeed = ("0x" + crypto.randomBytes(32).toString("hex")) as `0x${string}`;

  // Insert pending run row (advisory lock)
  const [runRow] = await db
    .insert(oracleRuns)
    .values({ mw, status: "pending", randomSeed })
    .returning({ id: oracleRuns.id });

  // Submit
  if (!process.env.ORACLE_PRIVATE_KEY) {
    await db
      .update(oracleRuns)
      .set({ status: "failed", error: "ORACLE_PRIVATE_KEY not set" })
      .where(eq(oracleRuns.id, runRow.id));
    return NextResponse.json({ ok: false, reason: "oracle key not configured" }, { status: 500 });
  }

  const oracleAccount = privateKeyToAccount(
    process.env.ORACLE_PRIVATE_KEY as `0x${string}`
  );
  const walletClient = createWalletClient({
    chain,
    account: oracleAccount,
    transport: http(),
  });

  try {
    const txHash = await walletClient.writeContract({
      address: poolAddr,
      abi: pick5PoolAbi,
      functionName: "submitScores",
      args: [users, points, BigInt(randomSeed)],
    });
    await db
      .update(oracleRuns)
      .set({ status: "submitted", txHash })
      .where(eq(oracleRuns.id, runRow.id));
    return NextResponse.json({ ok: true, txHash, users: users.length });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await db
      .update(oracleRuns)
      .set({ status: "failed", error: err })
      .where(eq(oracleRuns.id, runRow.id));
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }
}
