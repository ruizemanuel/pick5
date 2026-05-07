"use client";

import { useEffect, useState } from "react";

/**
 * FPL CDN serves /250x250/ for many players but is missing roughly 20-30%
 * of currently rostered players (returns 403). The /110x140/ size has wider
 * availability — try it as a fallback before giving up to initials.
 */
export function useFallbackPhoto(photoUrl?: string) {
  const [attempt, setAttempt] = useState<0 | 1 | 2>(0);

  // Reset chain when the input URL changes (slot transitions to a different player).
  useEffect(() => {
    setAttempt(0);
  }, [photoUrl]);

  if (!photoUrl) return { src: null as string | null, onError: () => {} };

  if (attempt === 0) {
    return { src: photoUrl, onError: () => setAttempt(1) };
  }
  if (attempt === 1) {
    return {
      src: photoUrl.replace("/250x250/", "/110x140/"),
      onError: () => setAttempt(2),
    };
  }
  return { src: null as string | null, onError: () => {} };
}
