"use client";
import Image from "next/image";
import type { Match } from "@/lib/fixtures/fixtures";
import type { UiPlayer } from "@/lib/players/uiPlayer";
import { type Xi, enrichGoals, tieInForMatch } from "@/lib/fixtures/tie-in";
import { kitUrl } from "@/lib/players/kit";

export function MatchDetail({
  match: m, playersById, myXi,
}: { match: Match; playersById: Map<number, UiPlayer>; myXi: Xi | null }) {
  const goals = enrichGoals(m, playersById);
  const tie = tieInForMatch(m, myXi, playersById);
  const myIds = myXi?.ids ?? new Set<number>();
  const teamAbbr = (side: "home" | "away") => (side === "home" ? m.home.abbr : m.away.abbr);

  return (
    <div className="border-t border-white/5 px-3 py-3">
      <h4 className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">Goals</h4>
      {goals.length === 0 ? (
        <p className="text-xs text-white/40">No goals</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {goals.map((g, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs">
              <span className="w-9 shrink-0 font-semibold text-white/45">{teamAbbr(g.side)}</span>
              <span aria-hidden>⚽</span>
              <span className={myIds.has(g.scorerId) ? "font-semibold text-[#F5C842]" : "text-white/85"}>{g.scorerName}</span>
              {g.assistName && <span className="text-white/40">· {g.assistName}</span>}
            </li>
          ))}
        </ul>
      )}

      {tie.involved && (
        <div className="mt-3">
          <h4 className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#F5C842]/80">Your players</h4>
          <ul className="flex flex-col gap-1.5">
            {tie.players.map((p) => {
              const url = kitUrl(p.teamId);
              return (
                <li key={p.id} className="flex items-center gap-2 text-xs">
                  <span className="relative h-5 w-5 shrink-0">
                    {url ? <Image src={url} alt="" fill sizes="20px" className="object-contain" unoptimized /> : null}
                  </span>
                  <span className="text-white/85">{p.name}</span>
                  {p.isCaptain && <span className="rounded bg-[#F5C842]/15 px-1 text-[9px] font-bold text-[#F5C842]">C</span>}
                  {p.scored && <span aria-hidden title="scored">⚽</span>}
                  {p.assisted && <span aria-hidden title="assist">➜</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
