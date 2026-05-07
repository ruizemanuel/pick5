"use client";

import type { ButtonHTMLAttributes } from "react";

export type WalletPillProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  address?: `0x${string}` | string;
  connected?: boolean;
};

function truncate(addr?: string) {
  if (!addr) return "";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletPill({
  address,
  connected,
  className = "",
  children,
  ...rest
}: WalletPillProps) {
  const isConnected = connected ?? !!address;
  return (
    <button
      type="button"
      {...rest}
      className={
        "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur transition hover:bg-white/10 active:scale-[0.98] motion-reduce:active:scale-100 " +
        className
      }
    >
      <span
        className={
          "size-1.5 rounded-full " +
          (isConnected
            ? "bg-[#00DF7C] shadow-[0_0_8px_#00DF7C]"
            : "bg-white/30")
        }
        aria-hidden
      />
      <span className="text-xs font-medium tabular-nums text-white/80">
        {children ?? (isConnected ? truncate(address) : "Connect")}
      </span>
    </button>
  );
}
