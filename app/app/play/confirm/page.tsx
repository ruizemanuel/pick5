"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLineupDraft } from "@/stores/lineupDraft";
import { usePool } from "@/hooks/usePool";

export default function ConfirmPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { lineup, clear } = useLineupDraft();
  const pool = usePool();
  const [step, setStep] = useState<"approve" | "join" | "done">("approve");

  useEffect(() => {
    if (lineup.some((x) => x === null)) {
      router.replace("/play/build" as Route);
      return;
    }
    if (pool.allowance >= parseUnits("5", 6)) setStep("join");
  }, [lineup, pool.allowance, router]);

  if (!isConnected) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6">
        <p>Connect your wallet to continue.</p>
        <Link href={"/" as Route} className="text-sm underline">
          Back to home
        </Link>
      </main>
    );
  }
  if (lineup.some((x) => x === null)) return null;

  const completed: number[] = lineup.filter((x): x is number => x !== null);

  async function onApprove() {
    try {
      await pool.approve();
      toast.success("USDT approved");
      await pool.refetchAllowance();
      setStep("join");
    } catch (e) {
      console.error(e);
      toast.error("Approval failed");
    }
  }

  async function onJoin() {
    try {
      const tuple = completed as unknown as readonly [number, number, number, number, number];
      await pool.join(tuple);
      toast.success("You're in 🎉");
      clear();
      router.push("/play" as Route);
    } catch (e) {
      console.error(e);
      toast.error("Join failed");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24">
      <h1 className="text-2xl font-semibold">Confirm</h1>
      <ul className="space-y-2">
        {completed.map((id, i) => (
          <li key={i} className="rounded border p-3 text-sm">
            Player #{id}
          </li>
        ))}
      </ul>
      <div className="rounded-lg bg-muted p-4 text-sm">
        Total: <strong>$5.00 USDT</strong> · You can withdraw your $5 after the tournament regardless of outcome.
      </div>
      {pool.hasJoined ? (
        <p className="rounded border p-3 text-sm">You already joined this tournament.</p>
      ) : step === "approve" ? (
        <Button onClick={onApprove} size="lg">
          Approve $5 USDT
        </Button>
      ) : (
        <Button onClick={onJoin} size="lg">
          Submit Lineup
        </Button>
      )}
    </main>
  );
}
