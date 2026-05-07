"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { ConnectedWalletPill } from "@/components/ConnectedWalletPill";
import { PrimaryCTA } from "@/components/design/PrimaryCTA";
import { SecondaryCTA } from "@/components/design/SecondaryCTA";
import { usePool } from "@/hooks/usePool";
import { posthog } from "@/lib/posthog";

function truncate(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

type TimelineEvent = {
  label: string;
  status: "done" | "available" | "pending";
  hint?: string;
};

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const pool = usePool();
  const [claimBusy, setClaimBusy] = useState(false);
  const [withdrawBusy, setWithdrawBusy] = useState(false);

  async function onClaim() {
    setClaimBusy(true);
    try {
      await pool.claimPrize();
      toast.success("Prize claimed 🏆");
      posthog.capture("prize_claimed");
      await pool.refetchPrizeClaimed();
    } catch (e) {
      console.error(e);
      toast.error("Claim failed");
    } finally {
      setClaimBusy(false);
    }
  }

  async function onWithdraw() {
    setWithdrawBusy(true);
    try {
      await pool.withdrawDeposit();
      toast.success("Deposit withdrawn");
      posthog.capture("withdraw_completed", { amount_usdt: 5 });
      await pool.refetchDepositWithdrawn();
    } catch (e) {
      console.error(e);
      toast.error("Withdrawal failed");
    } finally {
      setWithdrawBusy(false);
    }
  }

  if (!isConnected) {
    return (
      <main className="min-h-dvh bg-[#08070D] text-white">
        <div className="mx-auto flex min-h-dvh max-w-[440px] flex-col items-center justify-center gap-4 px-5 pb-24">
          <span className="font-display text-3xl tracking-[0.2em] text-white">
            PICK<span className="text-[#00DF7C]">5</span>
          </span>
          <p className="text-center text-white/70">
            Connect to view your status.
          </p>
          <ConnectedWalletPill />
        </div>
        <BottomNav />
      </main>
    );
  }

  const timeline: TimelineEvent[] = [];
  if (pool.hasJoined) {
    timeline.push({
      label: "Joined tournament",
      status: "done",
      hint: "$5 USDT staked into Aave V3",
    });
  } else {
    timeline.push({
      label: "Not yet joined",
      status: "pending",
      hint: "Build a lineup to enter",
    });
  }
  if (pool.hasJoined) {
    timeline.push({
      label: pool.isFinalized ? "Tournament settled" : "Tournament in progress",
      status: pool.isFinalized ? "done" : "pending",
      hint: pool.isFinalized
        ? "Prize awarded on-chain"
        : "Settles after MW38",
    });
  }
  if (pool.isWinner) {
    timeline.push({
      label: pool.prizeClaimed ? "Prize claimed" : "Prize unclaimed",
      status: pool.prizeClaimed ? "done" : "available",
      hint: pool.prizeClaimed
        ? "Winnings sent to wallet"
        : "Tap Claim to receive",
    });
  }
  if (pool.hasJoined && pool.isFinalized) {
    timeline.push({
      label: pool.depositWithdrawn ? "Deposit withdrawn" : "Deposit refundable",
      status: pool.depositWithdrawn ? "done" : "available",
      hint: pool.depositWithdrawn
        ? "$5 USDT returned"
        : "Tap Withdraw to receive $5",
    });
  }

  const showClaim = pool.isWinner && pool.isFinalized && !pool.prizeClaimed;
  const showWithdraw =
    pool.hasJoined && pool.isFinalized && !pool.depositWithdrawn;

  return (
    <main className="min-h-dvh bg-[#08070D] text-white">
      <div className="mx-auto flex max-w-[440px] flex-col px-5 pt-5 pb-24">
        <header className="flex items-center justify-between">
          <span className="font-display text-2xl tracking-[0.2em] text-white">
            PICK<span className="text-[#00DF7C]">5</span>
          </span>
          <ConnectedWalletPill />
        </header>

        <section className="pt-6">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#00DF7C]">
            Your wallet
          </div>
          <h1 className="font-display mt-1 text-4xl leading-none tracking-tight">
            Profile
          </h1>
        </section>

        <section className="pt-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
                  Address
                </div>
                <div className="font-display mt-1 text-2xl tracking-[0.1em] text-white">
                  {address ? truncate(address) : "—"}
                </div>
              </div>
              <span
                className="font-display rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] tracking-wider text-white/50"
                title="Self identity verification — coming in V2"
              >
                Self · soon
              </span>
            </div>
            {address && (
              <div className="mt-2 break-all font-mono text-[10px] text-white/40">
                {address}
              </div>
            )}
          </div>
        </section>

        <section className="pt-6">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
            Tournament history
          </div>
          <ol className="mt-2 space-y-0.5">
            {timeline.map((ev, i) => (
              <TimelineItem key={i} event={ev} last={i === timeline.length - 1} />
            ))}
          </ol>
        </section>

        {(showClaim || showWithdraw) && (
          <section className="pt-6 space-y-3">
            {showClaim && (
              <PrimaryCTA
                variant="gold"
                label={`Claim Prize`}
                onClick={onClaim}
                loading={claimBusy}
              />
            )}
            {showWithdraw && (
              <SecondaryCTA
                label="Withdraw $5 Deposit"
                onClick={onWithdraw}
                loading={withdrawBusy}
              />
            )}
          </section>
        )}

        {pool.hasJoined && !pool.isFinalized && (
          <p className="pt-4 text-center text-[11px] text-white/40">
            Withdraw available once the tournament settles after MW38.
          </p>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

function TimelineItem({
  event,
  last,
}: {
  event: TimelineEvent;
  last: boolean;
}) {
  const dotCls =
    event.status === "done"
      ? "bg-[#00DF7C] shadow-[0_0_8px_#00DF7C]"
      : event.status === "available"
      ? "bg-[#F5C842] shadow-[0_0_8px_#F5C842]"
      : "bg-white/30";
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <div className="relative flex flex-col items-center">
        <span className={"mt-1.5 size-2.5 rounded-full " + dotCls} />
        {!last && <span className="mt-1 w-px flex-1 bg-white/10" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="text-sm font-medium text-white">{event.label}</div>
        {event.hint && (
          <div className="text-[11px] text-white/40">{event.hint}</div>
        )}
      </div>
    </li>
  );
}
