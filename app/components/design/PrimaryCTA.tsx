"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "gold";

type CommonProps = {
  label: ReactNode;
  loading?: boolean;
  variant?: Variant;
  className?: string;
};

export type PrimaryCTAButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export type PrimaryCTALinkProps<R extends string = string> = CommonProps & {
  href: Route<R>;
  prefetch?: boolean;
};

const PALETTE: Record<Variant, string> = {
  primary: "bg-[#00DF7C] text-black shadow-[0_8px_32px_rgba(0,223,124,0.3)]",
  gold: "bg-[#F5C842] text-black shadow-[0_8px_32px_rgba(245,200,66,0.3)]",
};

function classes(variant: Variant, extra = "") {
  return (
    "font-display group relative w-full overflow-hidden rounded-2xl py-4 text-center text-xl tracking-[0.18em] transition active:scale-[0.98] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60 inline-flex items-center justify-center " +
    PALETTE[variant] +
    " " +
    extra
  );
}

function Shimmer() {
  return (
    <span
      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-700 motion-reduce:transition-none"
      aria-hidden
    />
  );
}

export function PrimaryCTA(props: PrimaryCTAButtonProps) {
  const {
    label,
    loading,
    variant = "primary",
    className = "",
    disabled,
    type = "button",
    ...rest
  } = props;
  const text = loading ? "Working…" : label;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      {...rest}
      className={classes(variant, className)}
    >
      <span className="relative z-10">{text}</span>
      <Shimmer />
    </button>
  );
}

export function PrimaryCTALink<R extends string = string>(
  props: PrimaryCTALinkProps<R>,
) {
  const { label, loading, variant = "primary", className = "", href, prefetch } = props;
  const text = loading ? "Working…" : label;
  return (
    <Link
      href={href}
      prefetch={prefetch}
      aria-disabled={loading ? true : undefined}
      className={classes(variant, className)}
    >
      <span className="relative z-10">{text}</span>
      <Shimmer />
    </Link>
  );
}
