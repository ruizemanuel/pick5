import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { chainForNetwork } from "@/lib/contracts/chain";
import { pick5PoolAbi, coachAgentAbi, pick5SeasonAbi } from "@/lib/contracts/abi";
import { coachAddress, usdtAddress, DEFAULT_NETWORK } from "@/lib/contracts/addresses";
import { resolveActivePool, resolveSeasonPool } from "@/lib/contracts/factory";
import { getActiveSeason } from "@/lib/tournaments/seasons";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const ZERO = "0x0000000000000000000000000000000000000000";

const ERC20_BAL_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function GET() {
  const network = DEFAULT_NETWORK;
  const chain = chainForNetwork(network);
  const client = createPublicClient({ chain, transport: http() });
  const coach = coachAddress(network);
  const usdt = usdtAddress(network);
  const season = getActiveSeason();

  const pool = await resolveActivePool(client, network);
  if (!pool) {
    return NextResponse.json({ ok: false, reason: `no active tournament for ${network}` }, { status: 503 });
  }

  const reads = await Promise.all([
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "deposit" }) as Promise<bigint>,
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "seedAmount" }) as Promise<bigint>,
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "participantsLength" }) as Promise<bigint>,
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "lockTime" }) as Promise<bigint>,
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "endTime" }) as Promise<bigint>,
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "scoresSubmitted" }) as Promise<boolean>,
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "finalized" }) as Promise<boolean>,
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "prizeClaimed" }) as Promise<boolean>,
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "prizeAmount" }) as Promise<bigint>,
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "winner" }) as Promise<`0x${string}`>,
    client.readContract({ address: pool, abi: pick5PoolAbi, functionName: "emergencyActive" }) as Promise<boolean>,
    client.readContract({ address: usdt, abi: ERC20_BAL_ABI, functionName: "balanceOf", args: [pool] }) as Promise<bigint>,
  ]);
  const [deposit, seedAmount, participants, lockTime, endTime, scoresSubmitted, finalized, prizeClaimed, prizeAmount, winner, emergencyActive, contractUsdt] = reads;

  const now = Math.floor(Date.now() / 1000);
  const lockTimeNum = Number(lockTime);
  const endTimeNum = Number(endTime);

  let phase: "joining" | "locked" | "ended" | "scores-in" | "finalized" | "emergency";
  if (emergencyActive) phase = "emergency";
  else if (finalized) phase = "finalized";
  else if (scoresSubmitted) phase = "scores-in";
  else if (now >= endTimeNum) phase = "ended";
  else if (now >= lockTimeNum) phase = "locked";
  else phase = "joining";

  // Coach state for the active season's rounds (#9056, mw monotonic).
  const emptyHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
  let coachState: unknown = null;
  if (coach !== ZERO) {
    const rounds = season.fechas.map((f) => f.round);
    const perRound = await Promise.all(
      rounds.map(async (round) => {
        const [commit, revealed, accuracy] = await Promise.all([
          client.readContract({ address: coach, abi: coachAgentAbi, functionName: "commitments", args: [round] }) as Promise<`0x${string}`>,
          client.readContract({ address: coach, abi: coachAgentAbi, functionName: "hasRevealed", args: [round] }) as Promise<boolean>,
          client.readContract({ address: coach, abi: coachAgentAbi, functionName: "accuracy", args: [round] }) as Promise<number>,
        ]);
        return { round, committed: commit !== emptyHash, revealed, accuracy: Number(accuracy) };
      }),
    );
    const coachWallet = (await client.readContract({ address: coach, abi: coachAgentAbi, functionName: "coachWallet" })) as string;
    coachState = { coachWallet, rounds: perRound };
  }

  // Season pool state (best-effort — may not be created yet).
  let seasonState: unknown = null;
  const seasonPool = await resolveSeasonPool(client, network, season.seasonId);
  if (seasonPool) {
    const [champion, sPrize, sClaimed, sSubmitted, sFinalized] = await Promise.all([
      client.readContract({ address: seasonPool, abi: pick5SeasonAbi, functionName: "champion" }) as Promise<`0x${string}`>,
      client.readContract({ address: seasonPool, abi: pick5SeasonAbi, functionName: "prizeAmount" }) as Promise<bigint>,
      client.readContract({ address: seasonPool, abi: pick5SeasonAbi, functionName: "prizeClaimed" }) as Promise<boolean>,
      client.readContract({ address: seasonPool, abi: pick5SeasonAbi, functionName: "standingsSubmitted" }) as Promise<boolean>,
      client.readContract({ address: seasonPool, abi: pick5SeasonAbi, functionName: "finalized" }) as Promise<boolean>,
    ]);
    seasonState = {
      seasonId: season.seasonId,
      label: season.label,
      address: seasonPool,
      champion: champion === ZERO ? null : champion,
      prizeAmount: sPrize.toString(),
      prizeClaimed: sClaimed,
      standingsSubmitted: sSubmitted,
      finalized: sFinalized,
    };
  }

  return NextResponse.json({
    ok: true,
    network,
    now,
    pool: {
      address: pool,
      phase,
      deposit: deposit.toString(),
      seedAmount: seedAmount.toString(),
      participantsLength: Number(participants),
      lockTime: lockTimeNum,
      endTime: endTimeNum,
      scoresSubmitted,
      finalized,
      prizeClaimed,
      prizeAmount: prizeAmount.toString(),
      winner: winner === ZERO ? null : winner,
      emergencyActive,
      contractUsdtBalance: contractUsdt.toString(),
    },
    coach: coachState,
    season: seasonState,
  });
}
