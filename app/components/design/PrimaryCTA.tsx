"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type PrimaryCTAProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: ReactNode;
  loading?: boolean;
  variant?: "primary" | "gold";
};

export function PrimaryCTA({
  label,
  loading,
  disabled,
  variant = "primary",
  className = "",
  ...rest
}: PrimaryCTAProps) {
  const isDisabled = disabled || loading;
  const palette =
    variant === "gold"
      ? "bg-[#F5C842] text-black shadow-[0_8px_32px_rgba(245,200,66,0.3)]"
      : "bg-[#00DF7C] text-black shadow-[0_8px_32px_rgba(0,223,124,0.3)]";

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={
        "font-display group relative w-full overflow-hidden rounded-2xl py-4 text-xl tracking-[0.18em] transition active:scale-[0.98] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 " +
        palette +
        " " +
        className
      }
    >
      <span className="relative z-10">
        {loading ? "Working…" : label}
      </span>
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-700 motion-reduce:transition-none"
        aria-hidden
      />
    </button>
  );
}
