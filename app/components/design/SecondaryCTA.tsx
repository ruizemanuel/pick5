"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type SecondaryCTAProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: ReactNode;
  loading?: boolean;
};

export function SecondaryCTA({
  label,
  loading,
  disabled,
  className = "",
  ...rest
}: SecondaryCTAProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={
        "font-display w-full rounded-2xl border border-white/15 bg-white/[0.03] py-4 text-xl tracking-[0.18em] text-white transition hover:bg-white/[0.06] active:scale-[0.98] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 " +
        className
      }
    >
      {loading ? "Working…" : label}
    </button>
  );
}
