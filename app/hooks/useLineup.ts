"use client";

import { useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import { onzePoolAbi } from "@/lib/contracts/abi";
import { CHAIN_ID, DEFAULT_NETWORK } from "@/lib/contracts/addresses";
import { useActiveTournament } from "@/hooks/useActiveTournament";

const ZERO = "0x0000000000000000000000000000000000000000" as const;

export function useLineup(poolAddrParam?: `0x${string}`) {
  const { address } = useAccount();
  const active = useActiveTournament(!poolAddrParam);
  const poolAddr = (poolAddrParam ?? active.poolAddr ?? ZERO) as `0x${string}`;
  const chainId = CHAIN_ID[DEFAULT_NETWORK];

  const enabled = Boolean(address) && poolAddr !== ZERO;

  const lineupRead = useReadContract({
    abi: onzePoolAbi,
    address: poolAddr,
    chainId,
    functionName: "getLineup",
    args: address ? [address] : undefined,
    query: {
      enabled,
      refetchInterval: 10_000,
    },
  });

  const captainRead = useReadContract({
    abi: onzePoolAbi,
    address: poolAddr,
    chainId,
    functionName: "captainOf",
    args: address ? [address] : undefined,
    query: {
      enabled,
      refetchInterval: 10_000,
    },
  });

  const refetch = useCallback(async () => {
    const [r1, r2] = await Promise.all([lineupRead.refetch(), captainRead.refetch()]);
    return r1;
  }, [lineupRead.refetch, captainRead.refetch]);

  return {
    lineup: lineupRead.data as
      | readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]
      | undefined,
    captainId:
      captainRead.data !== undefined
        ? Number(captainRead.data as bigint)
        : undefined,
    isLoading: lineupRead.isLoading || captainRead.isLoading,
    isFetching: lineupRead.isFetching || captainRead.isFetching,
    refetch,
  };
}
