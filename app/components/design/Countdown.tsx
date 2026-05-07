"use client";

import { useEffect, useState } from "react";

export type CountdownProps = {
  targetDate: Date | string | number;
  label?: string;
  sub?: string;
};

function diffParts(targetMs: number, nowMs: number) {
  const ms = Math.max(0, targetMs - nowMs);
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return { days, hours, mins, expired: ms === 0 };
}

export function Countdown({ targetDate, label, sub }: CountdownProps) {
  const targetMs =
    targetDate instanceof Date
      ? targetDate.getTime()
      : new Date(targetDate).getTime();

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { days, hours, mins, expired } = diffParts(targetMs, now);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      {label && (
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
          {label}
        </div>
      )}
      <div className="font-display mt-1 flex items-baseline gap-2 text-5xl leading-none tracking-tight tabular-nums">
        {expired ? (
          <span>Locked</span>
        ) : (
          <>
            <span>{String(days).padStart(2, "0")}</span>
            <span className="text-base text-white/40">d</span>
            <span>{String(hours).padStart(2, "0")}</span>
            <span className="text-base text-white/40">h</span>
            <span>{String(mins).padStart(2, "0")}</span>
            <span className="text-base text-white/40">m</span>
          </>
        )}
      </div>
      {sub && <div className="mt-2 text-xs text-white/50">{sub}</div>}
    </div>
  );
}
