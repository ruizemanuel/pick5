"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";

export type LeaderboardRow = {
  wallet: string;
  mw37: number;
  mw38: number;
  total: number;
  rank: number | null;
};

type Tier = {
  label: string;
  border: string;
  bg: string;
  rankColor: string;
  glow: string;
};

const TIERS: Record<1 | 2 | 3, Tier> = {
  1: {
    label: "GOLD",
    border: "border-[#F5C842]/40",
    bg: "bg-gradient-to-r from-[#F5C842]/10 to-[#F5C842]/[0.02]",
    rankColor: "text-[#F5C842]",
    glow: "shadow-[0_4px_20px_rgba(245,200,66,0.12)]",
  },
  2: {
    label: "SILVER",
    border: "border-[#C0C0C0]/35",
    bg: "bg-gradient-to-r from-[#C0C0C0]/8 to-[#C0C0C0]/[0.02]",
    rankColor: "text-[#C0C0C0]",
    glow: "shadow-[0_4px_16px_rgba(192,192,192,0.08)]",
  },
  3: {
    label: "BRONZE",
    border: "border-[#CD7F32]/35",
    bg: "bg-gradient-to-r from-[#CD7F32]/10 to-[#CD7F32]/[0.02]",
    rankColor: "text-[#CD7F32]",
    glow: "shadow-[0_4px_16px_rgba(205,127,50,0.08)]",
  },
};

function truncate(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function LeaderboardView({ rows }: { rows: LeaderboardRow[] }) {
  const { address } = useAccount();
  const me = address?.toLowerCase();

  const ranked = useMemo(
    () =>
      rows.map((r, i) => ({
        ...r,
        displayRank: r.rank ?? i + 1,
      })),
    [rows],
  );

  const preKickoff = ranked.length > 0 && ranked.every((r) => r.total === 0);

  if (ranked.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-sm text-white/60">No participants yet.</p>
        <p className="mt-1 text-[11px] text-white/40">
          Standings appear once the first matchweek settles.
        </p>
      </div>
    );
  }

  const myIndex = me ? ranked.findIndex((r) => r.wallet.toLowerCase() === me) : -1;
  const myRow = myIndex >= 0 ? ranked[myIndex] : null;
  const showSelfBanner = !!myRow && myIndex >= 10;

  return (
    <>
      {preKickoff && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#00DF7C]">
            Awaiting first points
          </div>
          <div className="mt-1 text-xs text-white/60">
            Rankings appear here once players in the pool start scoring in MW37.
          </div>
        </div>
      )}
      <ol className="space-y-1.5">
        {ranked.map((r) => {
          const isMe = me && r.wallet.toLowerCase() === me;
          const tier =
            !preKickoff && (r.displayRank === 1 || r.displayRank === 2 || r.displayRank === 3)
              ? TIERS[r.displayRank as 1 | 2 | 3]
              : null;
          const baseCls = tier
            ? `${tier.border} ${tier.bg} ${tier.glow}`
            : "border-white/10 bg-white/[0.03] hover:bg-white/5";
          const meRing = isMe ? "ring-2 ring-[#00DF7C]/40" : "";

          return (
            <li
              key={r.wallet}
              className={`flex items-center justify-between rounded-xl border px-3 py-3 transition ${baseCls} ${meRing}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`font-display w-9 shrink-0 text-xl tabular-nums ${
                    tier ? tier.rankColor : "text-white/40"
                  }`}
                >
                  {preKickoff ? "—" : r.displayRank}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-xs text-white/85">
                      {truncate(r.wallet)}
                    </span>
                    {isMe && (
                      <span className="font-display rounded-full bg-[#00DF7C]/20 px-1.5 py-0.5 text-[9px] tracking-wider text-[#00DF7C]">
                        YOU
                      </span>
                    )}
                  </div>
                  {tier && (
                    <div
                      className={`text-[9px] uppercase tracking-[0.18em] ${tier.rankColor}`}
                    >
                      {tier.label}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-display text-lg tabular-nums ${
                    preKickoff ? "text-white/40" : "text-white"
                  }`}
                >
                  {r.total}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-white/40">
                  pts
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {showSelfBanner && myRow && !preKickoff && (
        <div className="sticky bottom-20 z-30 mt-4">
          <div className="rounded-2xl border border-[#00DF7C]/40 bg-[#0F0E14]/95 px-4 py-3 backdrop-blur shadow-[0_8px_32px_rgba(0,223,124,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="font-display rounded-full bg-[#00DF7C]/20 px-2 py-0.5 text-[9px] tracking-wider text-[#00DF7C]">
                  YOUR POSITION
                </span>
                <span className="font-display text-base text-white tabular-nums">
                  #{myRow.displayRank}
                </span>
                <span className="truncate font-mono text-xs text-white/60">
                  {truncate(myRow.wallet)}
                </span>
              </div>
              <span className="font-display text-lg tabular-nums text-white">
                {myRow.total}
                <span className="ml-1 text-[9px] uppercase tracking-wider text-white/40">
                  pts
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
