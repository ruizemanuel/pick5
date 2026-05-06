"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import { pick5PoolAbi } from "@/lib/contracts/abi";
import { ADDRESSES, DEFAULT_NETWORK } from "@/lib/contracts/addresses";

export function usePool() {
  const network = DEFAULT_NETWORK;
  const poolAddr = ADDRESSES[network].pick5Pool as `0x${string}`;
  const usdtAddr = ADDRESSES[network].usdt as `0x${string}`;

  const { address } = useAccount();

  const allowance = useReadContract({
    abi: erc20Abi,
    address: usdtAddr,
    functionName: "allowance",
    args: address ? [address, poolAddr] : undefined,
    query: { enabled: Boolean(address) && Boolean(usdtAddr) && Boolean(poolAddr) },
  });

  const hasJoined = useReadContract({
    abi: pick5PoolAbi,
    address: poolAddr,
    functionName: "hasJoined",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && Boolean(poolAddr) },
  });

  const { writeContractAsync } = useWriteContract();

  return {
    addresses: { pool: poolAddr, usdt: usdtAddr },
    allowance: (allowance.data as bigint | undefined) ?? BigInt(0),
    hasJoined: Boolean(hasJoined.data),
    approve: () =>
      writeContractAsync({
        abi: erc20Abi,
        address: usdtAddr,
        functionName: "approve",
        args: [poolAddr, parseUnits("5", 6)],
      }),
    join: (lineup: readonly [number, number, number, number, number]) =>
      writeContractAsync({
        abi: pick5PoolAbi,
        address: poolAddr,
        functionName: "joinTournament",
        args: [lineup],
      }),
    refetchAllowance: allowance.refetch,
    refetchHasJoined: hasJoined.refetch,
  };
}
