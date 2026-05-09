"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { ConnectedWalletPill } from "@/components/ConnectedWalletPill";
import { PlayerRow } from "@/components/design/PlayerRow";
import { PrimaryCTA } from "@/components/design/PrimaryCTA";
import { useLineupDraft } from "@/stores/lineupDraft";
import { usePool } from "@/hooks/usePool";
import { posthog } from "@/lib/posthog";
import type { FplPlayerSummary } from "@/lib/fpl/types";

async function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#00DF7C", "#F5C842", "#FFFFFF"],
    disableForReducedMotion: true,
  });
  setTimeout(
    () =>
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#00DF7C", "#F5C842"],
      }),
    180,
  );
  setTimeout(
    () =>
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#00DF7C", "#F5C842"],
      }),
    260,
  );
}

export default function ConfirmPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { lineup, clear } = useLineupDraft();
  const pool = usePool();
  const [step, setStep] = useState<"approve" | "join">("approve");
  const [busy, setBusy] = useState(false);
  const [didJoin, setDidJoin] = useState(false);
  const [players, setPlayers] = useState<FplPlayerSummary[]>([]);

  useEffect(() => {
    // Once the join tx confirms we navigate to /play and clear the draft
    // explicitly. Don't bounce back to /play/build during that transition.
    if (didJoin) return;
    if (lineup.some((x) => x === null)) {
      router.replace("/play/build" as Route);
      return;
    }
    if (pool.allowance >= parseUnits("5", 6)) setStep("join");
  }, [lineup, pool.allowance, router, didJoin]);

  useEffect(() => {
    fetch("/api/fpl/players")
      .then((r) => r.json())
      .then((d: { players: FplPlayerSummary[] }) => setPlayers(d.players))
      .catch(() => setPlayers([]));
  }, []);

  const playerMap = useMemo(() => {
    const m = new Map<number, FplPlayerSummary>();
    for (const p of players) m.set(p.id, p);
    return m;
  }, [players]);

  if (!isConnected) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#08070D] p-6 text-white">
        <p className="text-center text-white/70">
          Connect your wallet to continue.
        </p>
        <ConnectedWalletPill />
        <Link
          href={"/" as Route}
          className="text-xs text-white/40 underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
      </main>
    );
  }
  if (lineup.some((x) => x === null)) return null;

  const completed: number[] = lineup.filter((x): x is number => x !== null);

  async function onApprove() {
    setBusy(true);
    try {
      await pool.approve();
      toast.success("USDT approved");
      posthog.capture("usdt_approved", { amount_usdt: 5 });
      await pool.refetchAllowance();
      setStep("join");
    } catch (e) {
      console.error(e);
      toast.error("Approval failed");
    } finally {
      setBusy(false);
    }
  }

  async function onJoin() {
    setBusy(true);
    const t0 = Date.now();
    console.log("[pick5/onJoin] start", new Date().toISOString());
    try {
      const tuple = completed as unknown as readonly [
        number,
        number,
        number,
        number,
        number,
      ];
      await pool.join(tuple);
      console.log(`[pick5/onJoin] pool.join() resolved (+${Date.now() - t0}ms)`);
      setDidJoin(true);
      posthog.capture("deposit_completed", { amount_usdt: 5 });
      toast.success("You're in 🎉");
      console.log(`[pick5/onJoin] navigating to /play (+${Date.now() - t0}ms)`);
      router.push("/play" as Route);
      void celebrate();
      clear();
    } catch (e) {
      console.error(e);
      toast.error("Join failed");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#08070D] text-white">
      <div className="mx-auto flex max-w-[440px] flex-col px-5 pt-5 pb-10">
        <header className="flex items-center justify-between">
          <span className="font-display text-2xl tracking-[0.2em] text-white">
            PICK<span className="text-[#00DF7C]">5</span>
          </span>
          <ConnectedWalletPill />
        </header>

        <section className="pt-6">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#00DF7C]">
            Final step
          </div>
          <h1 className="font-display mt-1 text-4xl leading-none tracking-tight">
            Confirm Lineup
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Review your 5 picks. Submit to lock them in for matchweeks 37 & 38.
          </p>
        </section>

        <section className="pt-5 space-y-2">
          {completed.map((id, i) => {
            const p = playerMap.get(id);
            return (
              <PlayerRow
                key={`${id}-${i}`}
                photoUrl={p?.photoUrl}
                initials={p?.initials ?? `#${id}`}
                teamColor={p?.teamColor}
                name={p?.name ?? `Player #${id}`}
                team={p?.team}
                position={p?.position}
              />
            );
          })}
        </section>

        <section className="pt-5">
          <div className="rounded-2xl border border-[#F5C842]/30 bg-[#F5C842]/5 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
                Total
              </span>
              <span className="font-display text-3xl tracking-tight text-[#F5C842] tabular-nums">
                $5.00
              </span>
            </div>
            <p className="mt-1 text-[11px] text-white/40">
              Refundable in full after MW38, regardless of outcome.
            </p>
          </div>
        </section>

        <section className="pt-5">
          {pool.hasJoined ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-sm text-white/70">
              You already joined this tournament.
              <Link
                href={"/play" as Route}
                className="ml-1 text-[#00DF7C] underline-offset-4 hover:underline"
              >
                Go to your team →
              </Link>
            </div>
          ) : step === "approve" ? (
            <PrimaryCTA
              label="Approve · $5 USDT"
              onClick={onApprove}
              loading={busy}
            />
          ) : (
            <PrimaryCTA
              label="Submit Lineup"
              onClick={onJoin}
              loading={busy}
            />
          )}
          <p className="mt-3 text-center text-[11px] text-white/40">
            Two-step: approve once, then submit your lineup on-chain.
          </p>
        </section>
      </div>
    </main>
  );
}
