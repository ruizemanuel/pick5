import { NextRequest, NextResponse } from "next/server";
import {
  createWalletClient,
  http,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
} from "viem";
import { celo, celoAlfajores, celoSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { coachPicks } from "@/lib/db/schema";
import { getBootstrap } from "@/lib/fpl/client";
import { generateCoachPicks } from "@/lib/ai/coach";
import { fallbackPicks } from "@/lib/ai/fallback";
import { coachAgentAbi } from "@/lib/contracts/abi";
import { coachAddress, DEFAULT_NETWORK } from "@/lib/contracts/addresses";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function getChain(network: string) {
  if (network === "celo") return celo;
  if (network === "celo-sepolia") return celoSepolia;
  return celoAlfajores;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const mwStr = req.nextUrl.searchParams.get("mw");
  const mw = Number(mwStr);
  if (![37, 38].includes(mw)) {
    return NextResponse.json({ ok: false, reason: "invalid mw, expected 37 or 38" }, { status: 400 });
  }

  const db = getDb();

  // Skip if already published
  const existing = await db.select().from(coachPicks).where(eq(coachPicks.mw, mw));
  if (existing.length > 0) {
    return NextResponse.json({
      ok: true,
      reason: "already published",
      txHash: existing[0].publishTxHash,
    });
  }

  const bootstrap = await getBootstrap();

  let picks;
  try {
    picks = await generateCoachPicks(mw, bootstrap);
  } catch (e) {
    console.error("LLM failed, using fallback", e);
    picks = fallbackPicks(bootstrap);
  }

  const playerIds = picks.picks.map((p) => p.playerId) as [number, number, number, number, number];
  const reasoning = picks.picks.map((p) => p.reasoning);

  // commitment hash matches what the Solidity contract checks: keccak256(abi.encode(picks))
  // where picks is uint16[5]
  const commitmentHash = keccak256(
    encodeAbiParameters(parseAbiParameters("uint16[5]"), [playerIds])
  );

  const [inserted] = await db
    .insert(coachPicks)
    .values({
      mw,
      playerIds,
      reasoning,
      commitmentHash,
      publishedAt: new Date(),
    })
    .returning({ id: coachPicks.id });

  if (!process.env.COACH_PRIVATE_KEY) {
    return NextResponse.json({ ok: false, reason: "COACH_PRIVATE_KEY not set" }, { status: 500 });
  }

  const network = DEFAULT_NETWORK;
  const chain = getChain(network);
  const account = privateKeyToAccount(process.env.COACH_PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({ chain, account, transport: http() });

  const coachAddr = coachAddress(network);
  if (coachAddr === "0x0000000000000000000000000000000000000000") {
    return NextResponse.json({ ok: false, reason: `coach contract not configured for ${network}` }, { status: 500 });
  }

  try {
    const txHash = await walletClient.writeContract({
      address: coachAddr,
      abi: coachAgentAbi,
      functionName: "publishCommitment",
      args: [mw, commitmentHash],
    });

    await db.update(coachPicks).set({ publishTxHash: txHash }).where(eq(coachPicks.id, inserted.id));

    return NextResponse.json({
      ok: true,
      mw,
      txHash,
      commitmentHash,
      picks: picks.picks,
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }
}
