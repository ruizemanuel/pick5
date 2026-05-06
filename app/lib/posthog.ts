"use client";

import posthog from "posthog-js";

let initialized = false;

export function initPosthog() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return; // fail silently if not configured
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "always",
    autocapture: true,
    capture_pageview: true,
  });
  initialized = true;
}

export { posthog };
