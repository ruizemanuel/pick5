"use client";

import { useReadContract } from "wagmi";
import { pick5FactoryAbi } from "@/lib/contracts/abi";
import { factoryAddress, DEFAULT_NETWORK, CHAIN_ID } from "@/lib/contracts/addresses";

const ZERO = "0x0000000000000000000000000000000000000000" as const;

/** Resolve a fecha's Pick5Pool address from its tournamentId (client read). */
export function useFechaPool(tournamentId: number | undefined) {
  const network = DEFAULT_NETWORK;
  const chainId = CHAIN_ID[network] ?? 42220;
  const factory = factoryAddress(network);
  const valid = tournamentId !== undefined && Number.isInteger(tournamentId);
  const r = useReadContract({
    abi: pick5FactoryAbi,
    address: factory,
    chainId,
    functionName: "tournamentBy",
    args: valid ? [BigInt(tournamentId)] : undefined,
    query: { enabled: factory !== ZERO && valid },
  });
  const data = r.data as `0x${string}` | undefined;
  const poolAddr = data && data !== ZERO ? data : undefined;
  return { poolAddr, isLoading: r.isLoading };
}
