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

const PODIUM_STYLES = [
  {
    border: "border-[#F5C842]/40",
    bg: "bg-gradient-to-b from-[#F5C842]/15 to-[#F5C842]/5",
    text: "text-[#F5C842]",
    glow: "shadow-[0_8px_32px_rgba(245,200,66,0.15)]",
    label: "GOLD",
  },
  {
    border: "border-[#C0C0C0]/40",
    bg: "bg-gradient-to-b from-[#C0C0C0]/15 to-[#C0C0C0]/5",
    text: "text-[#C0C0C0]",
    glow: "shadow-[0_8px_24px_rgba(192,192,192,0.12)]",
    label: "SILVER",
  },
  {
    border: "border-[#CD7F32]/40",
    bg: "bg-gradient-to-b from-[#CD7F32]/15 to-[#CD7F32]/5",
    text: "text-[#CD7F32]",
    glow: "shadow-[0_8px_24px_rgba(205,127,50,0.12)]",
    label: "BRONZE",
  },
] as const;

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

  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const myIndex = me ? ranked.findIndex((r) => r.wallet.toLowerCase() === me) : -1;
  const myRow = myIndex >= 0 ? ranked[myIndex] : null;
  const showSelfBanner = !!myRow && myIndex >= 10;

  return (
    <>
      {/* Podium */}
      <section className="grid grid-cols-3 gap-2">
        {[1, 0, 2].map((podiumIdx) => {
          const row = podium[podiumIdx];
          if (!row) {
            return <div key={podiumIdx} className="rounded-2xl border border-white/5 bg-white/[0.02] p-3" />;
          }
          const style = PODIUM_STYLES[podiumIdx];
          const heightCls = podiumIdx === 0 ? "pt-6 pb-5" : "pt-4 pb-4";
          const isMe = me && row.wallet.toLowerCase() === me;
          return (
            <div
              key={row.wallet}
              className={`rounded-2xl border ${style.border} ${style.bg} ${style.glow} ${heightCls} px-3 text-center ${isMe ? "ring-2 ring-[#00DF7C]/40" : ""}`}
            >
              <div className={`text-[10px] font-medium uppercase tracking-[0.2em] ${style.text}`}>
                {style.label}
              </div>
              <div className={`font-display mt-2 text-3xl leading-none ${style.text}`}>
                #{row.displayRank}
              </div>
              <div className="mt-2 truncate font-mono text-[11px] text-white/70">
                {truncate(row.wallet)}
              </div>
              <div className="mt-1 font-display text-xl tabular-nums text-white">
                {row.total}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-white/40">
                pts
              </div>
            </div>
          );
        })}
      </section>

      {/* Ranked list */}
      {rest.length > 0 && (
        <section className="mt-6">
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
            Standings
          </div>
          <ol className="mt-2 space-y-1.5">
            {rest.map((r) => {
              const isMe = me && r.wallet.toLowerCase() === me;
              return (
                <li
                  key={r.wallet}
                  className={
                    "flex items-center justify-between rounded-xl border px-3 py-2.5 transition " +
                    (isMe
                      ? "border-[#00DF7C]/40 bg-[#00DF7C]/5"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/5")
                  }
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="font-display w-7 shrink-0 text-base text-white/60 tabular-nums">
                      {r.displayRank}
                    </span>
                    <span className="truncate font-mono text-xs text-white/80">
                      {truncate(r.wallet)}
                    </span>
                    {isMe && (
                      <span className="font-display rounded-full bg-[#00DF7C]/20 px-1.5 py-0.5 text-[9px] tracking-wider text-[#00DF7C]">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="font-display text-base tabular-nums text-white">
                    {r.total}
                    <span className="ml-1 text-[9px] uppercase tracking-wider text-white/40">
                      pts
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Sticky self banner */}
      {showSelfBanner && myRow && (
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
