import type { PublicClient } from "viem";
import { pick5FactoryAbi } from "./abi";
import { factoryAddress, type Network } from "./addresses";

const ZERO = "0x0000000000000000000000000000000000000000" as const;

/** Server-side: resolve the factory's active (latest) tournament pool address. */
export async function resolveActivePool(
  client: Pick<PublicClient, "readContract">,
  network: Network,
): Promise<`0x${string}` | null> {
  const factory = factoryAddress(network);
  if (factory === ZERO) return null;
  const length = (await client.readContract({
    address: factory,
    abi: pick5FactoryAbi,
    functionName: "tournamentsLength",
  })) as bigint;
  if (length === BigInt(0)) return null;
  return (await client.readContract({
    address: factory,
    abi: pick5FactoryAbi,
    functionName: "tournamentBy",
    args: [length - BigInt(1)],
  })) as `0x${string}`;
}

/** Server-side: resolve a specific fecha pool by tournamentId (or null if unset). */
export async function resolvePoolById(
  client: Pick<PublicClient, "readContract">,
  network: Network,
  tournamentId: number,
): Promise<`0x${string}` | null> {
  const factory = factoryAddress(network);
  if (factory === ZERO) return null;
  const pool = (await client.readContract({
    address: factory,
    abi: pick5FactoryAbi,
    functionName: "tournamentBy",
    args: [BigInt(tournamentId)],
  })) as `0x${string}`;
  return pool === ZERO ? null : pool;
}

/** Server-side: resolve a season's SeasonPool by seasonId (or null if unset). */
export async function resolveSeasonPool(
  client: Pick<PublicClient, "readContract">,
  network: Network,
  seasonId: number,
): Promise<`0x${string}` | null> {
  const factory = factoryAddress(network);
  if (factory === ZERO) return null;
  const pool = (await client.readContract({
    address: factory,
    abi: pick5FactoryAbi,
    functionName: "seasonBy",
    args: [BigInt(seasonId)],
  })) as `0x${string}`;
  return pool === ZERO ? null : pool;
}
