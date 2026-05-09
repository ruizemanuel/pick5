"use client";

import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import { pick5PoolAbi } from "@/lib/contracts/abi";
import { ADDRESSES, DEFAULT_NETWORK } from "@/lib/contracts/addresses";

export function usePool() {
  const network = DEFAULT_NETWORK;
  const poolAddr = ADDRESSES[network].pick5Pool as `0x${string}`;
  const usdtAddr = ADDRESSES[network].usdt as `0x${string}`;

  const { address } = useAccount();
  const userEnabled = Boolean(address) && Boolean(poolAddr);

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
    query: { enabled: userEnabled },
  });

  const winner = useReadContract({
    abi: pick5PoolAbi,
    address: poolAddr,
    functionName: "winner",
    query: { enabled: Boolean(poolAddr) },
  });

  const finalized = useReadContract({
    abi: pick5PoolAbi,
    address: poolAddr,
    functionName: "finalized",
    query: { enabled: Boolean(poolAddr) },
  });

  const prizeAmount = useReadContract({
    abi: pick5PoolAbi,
    address: poolAddr,
    functionName: "prizeAmount",
    query: { enabled: Boolean(poolAddr) },
  });

  const prizeClaimed = useReadContract({
    abi: pick5PoolAbi,
    address: poolAddr,
    functionName: "prizeClaimed",
    query: { enabled: Boolean(poolAddr) },
  });

  const depositWithdrawn = useReadContract({
    abi: pick5PoolAbi,
    address: poolAddr,
    functionName: "depositWithdrawn",
    args: address ? [address] : undefined,
    query: { enabled: userEnabled },
  });

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  async function writeAndWait(args: Parameters<typeof writeContractAsync>[0]) {
    const hash = await writeContractAsync(args);
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }
    return hash;
  }

  const winnerAddr = winner.data as `0x${string}` | undefined;
  const isWinner =
    !!address && !!winnerAddr && winnerAddr.toLowerCase() === address.toLowerCase();

  return {
    addresses: { pool: poolAddr, usdt: usdtAddr },
    allowance: (allowance.data as bigint | undefined) ?? BigInt(0),
    hasJoined: Boolean(hasJoined.data),
    winner: winnerAddr,
    isWinner,
    isFinalized: Boolean(finalized.data),
    prizeAmount: (prizeAmount.data as bigint | undefined) ?? BigInt(0),
    prizeClaimed: Boolean(prizeClaimed.data),
    depositWithdrawn: Boolean(depositWithdrawn.data),
    approve: () =>
      writeAndWait({
        abi: erc20Abi,
        address: usdtAddr,
        functionName: "approve",
        args: [poolAddr, parseUnits("5", 6)],
      }),
    join: (lineup: readonly [number, number, number, number, number]) =>
      writeAndWait({
        abi: pick5PoolAbi,
        address: poolAddr,
        functionName: "joinTournament",
        args: [lineup],
      }),
    claimPrize: () =>
      writeAndWait({
        abi: pick5PoolAbi,
        address: poolAddr,
        functionName: "claimPrize",
      }),
    withdrawDeposit: () =>
      writeAndWait({
        abi: pick5PoolAbi,
        address: poolAddr,
        functionName: "withdrawDeposit",
      }),
    refetchAllowance: allowance.refetch,
    refetchHasJoined: hasJoined.refetch,
    refetchPrizeClaimed: prizeClaimed.refetch,
    refetchDepositWithdrawn: depositWithdrawn.refetch,
  };
}
