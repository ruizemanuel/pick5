"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { toast } from "sonner";
import { PrimaryCTA } from "@/components/design/PrimaryCTA";
import { usePool } from "@/hooks/usePool";
import { posthog } from "@/lib/posthog";

function truncate(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function useCounter(target: number, durationMs = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") {
      setValue(target);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    if (target === 0) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export function ResultsHero() {
  const pool = usePool();
  const [busy, setBusy] = useState(false);
  const [claimedLocally, setClaimedLocally] = useState(false);

  const prizeUSDT = Number(formatUnits(pool.prizeAmount, 6));
  const animatedPrize = useCounter(prizeUSDT);
  const formattedPrize = animatedPrize.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  async function onClaim() {
    setBusy(true);
    try {
      await pool.claimPrize();
      setClaimedLocally(true);
      toast.success("Prize claimed 🏆");
      posthog.capture("prize_claimed");
      await pool.refetchPrizeClaimed();
    } catch (e) {
      console.error(e);
      toast.error("Claim failed");
    } finally {
      setBusy(false);
    }
  }

  if (!pool.isFinalized) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
          Tournament status
        </div>
        <div className="font-display mt-1 text-2xl text-white">
          Awaiting final settlement
        </div>
        <p className="mt-2 text-xs text-white/40">
          Results appear here once MW38 settles and the oracle finalizes the
          winner on-chain.
        </p>
      </section>
    );
  }

  if (!pool.winner) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
          Tournament settled
        </div>
        <div className="font-display mt-1 text-2xl text-white">
          No participants
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#F5C842]/30 bg-gradient-to-b from-[#F5C842]/15 to-[#F5C842]/[0.02] p-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(245,200,66,0.18), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative">
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#F5C842]">
          Champion
        </div>
        <div className="font-display mt-1 text-2xl tracking-[0.15em] text-white">
          {truncate(pool.winner)}
        </div>

        <div className="mt-6 text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
          Prize claimed
        </div>
        <div className="font-display mt-1 text-6xl leading-none tracking-tight text-[#F5C842] tabular-nums">
          ${formattedPrize}
        </div>
        <div className="mt-1 text-[11px] text-white/40">USDT · seed + yield</div>

        {pool.isWinner && !pool.prizeClaimed && !claimedLocally && (
          <div className="mt-6">
            <PrimaryCTA
              variant="gold"
              label={`Claim $${prizeUSDT.toFixed(2)}`}
              onClick={onClaim}
              loading={busy}
            />
          </div>
        )}
        {pool.isWinner && (pool.prizeClaimed || claimedLocally) && (
          <div className="mt-6 rounded-xl border border-[#00DF7C]/30 bg-[#00DF7C]/10 px-3 py-2 text-xs text-[#00DF7C]">
            Prize already claimed.
          </div>
        )}
      </div>
    </section>
  );
}
