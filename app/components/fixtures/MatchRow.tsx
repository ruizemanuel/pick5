import Image from "next/image";
import type { Match, Side } from "@/lib/fixtures/fixtures";
import { kitUrl } from "@/lib/players/kit";

function Kit({ side }: { side: Side }) {
  const url = kitUrl(side.squadId);
  return (
    <div className="relative h-7 w-7 shrink-0">
      {url ? (
        <Image src={url} alt={side.name} fill sizes="28px" className="object-contain" unoptimized />
      ) : null}
    </div>
  );
}

function kickoffTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function hasPens(m: Match): boolean {
  return m.home.penalties != null && m.away.penalties != null && (m.home.penalties > 0 || m.away.penalties > 0);
}

export function MatchRow({ match: m }: { match: Match }) {
  const played = m.status === "finished" || m.status === "live";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
      {/* home */}
      <div className="flex flex-1 items-center justify-end gap-2 text-right">
        <span className="text-sm font-medium text-white/85">{m.home.abbr}</span>
        <Kit side={m.home} />
      </div>

      {/* center */}
      <div className="flex w-20 flex-col items-center">
        {played ? (
          <div className="flex items-center gap-1 text-base font-semibold tabular-nums">
            <span>{m.home.score ?? 0}</span>
            <span className="text-white/40">–</span>
            <span>{m.away.score ?? 0}</span>
          </div>
        ) : (
          <span className="text-sm font-medium text-white/70">{kickoffTime(m.kickoff)}</span>
        )}
        {m.status === "live" && (
          <span className="mt-0.5 rounded-full bg-[#00DF7C]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#00DF7C]">
            LIVE
          </span>
        )}
        {m.status === "finished" && (
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">FT</span>
        )}
        {hasPens(m) && (
          <span className="mt-0.5 text-[10px] text-white/50">{m.home.penalties}–{m.away.penalties} pens</span>
        )}
      </div>

      {/* away */}
      <div className="flex flex-1 items-center gap-2">
        <Kit side={m.away} />
        <span className="text-sm font-medium text-white/85">{m.away.abbr}</span>
      </div>
    </div>
  );
}
