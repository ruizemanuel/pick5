"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { WalletButton } from "@/components/WalletButton";
import { pick5PoolAbi } from "@/lib/contracts/abi";
import { ADDRESSES, DEFAULT_NETWORK } from "@/lib/contracts/addresses";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const poolAddr = ADDRESSES[DEFAULT_NETWORK].pick5Pool as `0x${string}`;
  const enabled = Boolean(poolAddr) && Boolean(address);

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

  const hasJoined = useReadContract({
    abi: pick5PoolAbi,
    address: poolAddr,
    functionName: "hasJoined",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const withdrawn = useReadContract({
    abi: pick5PoolAbi,
    address: poolAddr,
    functionName: "depositWithdrawn",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const claimed = useReadContract({
    abi: pick5PoolAbi,
    address: poolAddr,
    functionName: "prizeClaimed",
    query: { enabled: Boolean(poolAddr) },
  });

  const { writeContractAsync } = useWriteContract();

  const winnerAddr = winner.data as `0x${string}` | undefined;
  const isWinner =
    address && winnerAddr && winnerAddr.toLowerCase() === address.toLowerCase();
  const isFinalized = Boolean(finalized.data);
  const didJoin = Boolean(hasJoined.data);
  const didWithdraw = Boolean(withdrawn.data);
  const didClaim = Boolean(claimed.data);

  async function onClaim() {
    try {
      await writeContractAsync({
        abi: pick5PoolAbi,
        address: poolAddr,
        functionName: "claimPrize",
      });
      toast.success("Prize claimed!");
      claimed.refetch();
    } catch (e) {
      console.error(e);
      toast.error("Claim failed");
    }
  }

  async function onWithdraw() {
    try {
      await writeContractAsync({
        abi: pick5PoolAbi,
        address: poolAddr,
        functionName: "withdrawDeposit",
      });
      toast.success("Deposit withdrawn");
      withdrawn.refetch();
    } catch (e) {
      console.error(e);
      toast.error("Withdrawal failed");
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md p-6 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <WalletButton />
      </header>

      {!isConnected && <p className="text-muted-foreground">Connect to view your status.</p>}

      {isConnected && (
        <div className="space-y-4">
          <div className="rounded border p-4">
            <div className="text-sm text-muted-foreground">Wallet</div>
            <div className="break-all font-mono">{address}</div>
          </div>

          {isWinner && isFinalized && !didClaim && (
            <Button onClick={onClaim} size="lg" className="w-full">
              🏆 Claim Prize
            </Button>
          )}

          {didJoin && isFinalized && !didWithdraw && (
            <Button onClick={onWithdraw} size="lg" variant="outline" className="w-full">
              Withdraw $5 Deposit
            </Button>
          )}

          {didJoin && !isFinalized && (
            <p className="text-sm text-muted-foreground">
              Tournament still open. Withdraw available after MW38 finalization.
            </p>
          )}

          {!didJoin && (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t joined this tournament yet.
            </p>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
