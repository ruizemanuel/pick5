"use client";

declare global {
  interface Window {
    ethereum?: {
      isMiniPay?: boolean;
    };
  }
}

export function isMiniPay(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.ethereum?.isMiniPay);
}
