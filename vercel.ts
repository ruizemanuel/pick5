import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  buildCommand: "pnpm --filter @pick5/app build",
  framework: "nextjs",
  installCommand: "pnpm install --frozen-lockfile",
  rootDirectory: "app",
  crons: [
    // Coach AI: publish picks before each MW (Wed 12:00 UTC)
    { path: "/api/coach/publish-picks?mw=37", schedule: "0 12 14 5 *" },
    { path: "/api/coach/publish-picks?mw=38", schedule: "0 12 21 5 *" },
    // Coach AI: reveal + reputation update after each MW
    { path: "/api/coach/reveal?mw=37", schedule: "0 23 18 5 *" },
    { path: "/api/coach/reveal?mw=38", schedule: "0 8 25 5 *" },
    // Oracle: final score submission after MW38 (Sun 22:00 UTC)
    { path: "/api/oracle/finalize-mw?mw=38", schedule: "0 22 24 5 *" },
    // Retry oracle hourly through deadline
    { path: "/api/oracle/retry?mw=38", schedule: "0 * 24-25 5 *" },
    // Leaderboard cache recompute (post MW37, then daily)
    { path: "/api/leaderboard/recompute", schedule: "0 * * * *" },
  ],
};
