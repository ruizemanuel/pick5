import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  // Using npm on Vercel to dodge the pnpm 9.x ERR_INVALID_THIS bug on Node 24.
  // Local development still uses pnpm via the workspace.
  installCommand: "npm install --legacy-peer-deps",
  buildCommand: "next build",
  // app/ is the project root for Vercel deploys; pnpm-workspace.yaml lives at the
  // repo parent and is not uploaded — so install runs solo against app/package.json.
  // NOTE: Vercel Hobby plan limits crons to once-per-day max.
  // Upgrade to Pro before mainnet to enable the hourly oracle retry + leaderboard refresh.
  crons: [
    // Coach AI: publish picks before each MW (Thu 12:00 UTC, May 14 and May 21 2026)
    { path: "/api/coach/publish-picks?mw=37", schedule: "0 12 14 5 *" },
    { path: "/api/coach/publish-picks?mw=38", schedule: "0 12 21 5 *" },
    // Coach AI: reveal + reputation update after each MW
    { path: "/api/coach/reveal?mw=37", schedule: "0 23 18 5 *" },
    { path: "/api/coach/reveal?mw=38", schedule: "0 8 25 5 *" },
    // Oracle: final score submission after MW38 (Sun 22:00 UTC)
    { path: "/api/oracle/finalize-mw?mw=38", schedule: "0 22 24 5 *" },
    // Single retry the day after, in case MW38 finalize cron failed.
    // On Pro plan switch this to hourly: "0 * 24-25 5 *"
    { path: "/api/oracle/retry?mw=38", schedule: "0 12 25 5 *" },
    // Leaderboard cache recompute — daily on Hobby. Switch to hourly on Pro: "0 * * * *"
    { path: "/api/leaderboard/recompute", schedule: "0 0 * * *" },
  ],
};
