/**
 * Central environment configuration for Q2 demo.
 *
 * Demo mode is the DEFAULT for this portfolio repo — `pnpm dev` works out-of-the-box
 * without Supabase credentials. Forks intended for personal use MUST set
 * `NEXT_PUBLIC_DEMO_MODE=false` and provide Supabase env vars.
 *
 * Reading the variable as a string and checking !== "false":
 *   - undefined (not set)        → demo mode ON
 *   - "true" / anything not "false" → demo mode ON
 *   - explicit "false"           → demo mode OFF
 *
 * Default-on is a deliberate choice for THIS repo (portfolio + reviewer convenience).
 * Misconfigured forks get a runtime warning below.
 */

export const DEMO_MODE: boolean =
  (process.env.NEXT_PUBLIC_DEMO_MODE ?? "true").toLowerCase() !== "false";

// Loud runtime warning for forks that ship to Vercel production with demo mode
// still on (likely forgot to flip the env var). Logged once per cold start.
if (
  typeof process !== "undefined" &&
  process.env.VERCEL_ENV === "production" &&
  DEMO_MODE &&
  // The reference deployment opts in via DEMO_MODE_INTENDED=true; forks won't have this.
  process.env.DEMO_MODE_INTENDED !== "true"
) {
  // eslint-disable-next-line no-console
  console.warn(
    "[q2] DEMO_MODE is active in Vercel production. If this is YOUR fork (not the " +
      "public reference deployment q2-second-brain-demo.vercel.app), set " +
      "NEXT_PUBLIC_DEMO_MODE=false in your Vercel env vars and configure Supabase. " +
      "See CUSTOMIZATION.md for setup steps.",
  );
}

/** Stable demo user injected by mock Supabase client when DEMO_MODE is on. */
export const DEMO_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@example.com",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2026-01-01T00:00:00.000Z",
} as const;

/** Public app URL used for canonical magic-link redirects. Falls back to demo URL. */
export const APP_URL: string =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://q2-second-brain-demo.vercel.app";
