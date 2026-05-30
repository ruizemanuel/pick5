"use client";

import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { pick5SeasonAbi, pick5FactoryAbi } from "@/lib/contracts/abi";
import { factoryAddress, DEFAULT_NETWORK, CHAIN_ID } from "@/lib/contracts/addresses";
import { getActiveSeason } from "@/lib/tournaments/seasons";

const ZERO = "0x0000000000000000000000000000000000000000" as const;

/**
 * Reads the season's SeasonPool (resolved from factory.seasonBy) and exposes the
 * champion-claim write. Mirrors usePool: chainId-pinned reads/writes, waits for the
 * receipt. The UI must OR-combine prizeClaimed with a local success flag.
 */
export function useSeasonPool(seasonId?: number) {
  const network = DEFAULT_NETWORK;
  const chainId = CHAIN_ID[network] ?? 42220;
  const sid = seasonId ?? getActiveSeason().seasonId;
  const factory = factoryAddress(network);
  const { address } = useAccount();

  const poolRead = useReadContract({
    abi: pick5FactoryAbi,
    address: factory,
    chainId,
    functionName: "seasonBy",
    args: [BigInt(sid)],
    query: { enabled: factory !== ZERO },
  });
  const resolved = poolRead.data as `0x${string}` | undefined;
  const seasonPool = (resolved ?? ZERO) as `0x${string}`;
  const on = seasonPool !== ZERO;

  const champion = useReadContract({ abi: pick5SeasonAbi, address: seasonPool, chainId, functionName: "champion", query: { enabled: on } });
  const prizeAmount = useReadContract({ abi: pick5SeasonAbi, address: seasonPool, chainId, functionName: "prizeAmount", query: { enabled: on } });
  const prizeClaimed = useReadContract({ abi: pick5SeasonAbi, address: seasonPool, chainId, functionName: "prizeClaimed", query: { enabled: on } });
  const finalized = useReadContract({ abi: pick5SeasonAbi, address: seasonPool, chainId, functionName: "finalized", query: { enabled: on } });
  const standingsSubmitted = useReadContract({ abi: pick5SeasonAbi, address: seasonPool, chainId, functionName: "standingsSubmitted", query: { enabled: on } });
  const seedAmount = useReadContract({ abi: pick5SeasonAbi, address: seasonPool, chainId, functionName: "seedAmount", query: { enabled: on } });

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId });

  async function claimPrize() {
    const hash = await writeContractAsync({
      abi: pick5SeasonAbi,
      address: seasonPool,
      chainId,
      functionName: "claimPrize",
    } as Parameters<typeof writeContractAsync>[0]);
    if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
    return hash;
  }

  const championAddr = champion.data as `0x${string}` | undefined;
  const isChampion =
    !!address && !!championAddr && championAddr.toLowerCase() === address.toLowerCase();

  return {
    seasonPool: on ? seasonPool : undefined,
    seasonId: sid,
    champion: championAddr && championAddr !== ZERO ? championAddr : undefined,
    isChampion,
    prizeAmount: (prizeAmount.data as bigint | undefined) ?? BigInt(0),
    prizeClaimed: Boolean(prizeClaimed.data),
    finalized: Boolean(finalized.data),
    standingsSubmitted: Boolean(standingsSubmitted.data),
    seedAmount: (seedAmount.data as bigint | undefined) ?? BigInt(0),
    isLoading: poolRead.isLoading,
    claimPrize,
    refetchPrizeClaimed: prizeClaimed.refetch,
  };
}
