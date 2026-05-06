"use client";

import { useAccount, useReadContract } from "wagmi";
import { pick5PoolAbi } from "@/lib/contracts/abi";
import { ADDRESSES, DEFAULT_NETWORK } from "@/lib/contracts/addresses";

export function useLineup() {
  const { address } = useAccount();
  const poolAddr = ADDRESSES[DEFAULT_NETWORK].pick5Pool as `0x${string}`;

  const r = useReadContract({
    abi: pick5PoolAbi,
    address: poolAddr,
    functionName: "getLineup",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address) && Boolean(poolAddr),
      refetchInterval: 60_000,
    },
  });

  return {
    lineup: r.data as readonly [bigint, bigint, bigint, bigint, bigint] | undefined,
    isLoading: r.isLoading,
  };
}
