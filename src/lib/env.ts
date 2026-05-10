/**
 * Central environment configuration for Q2 demo.
 *
 * Demo mode is the DEFAULT — repo runs out-of-the-box without Supabase / Anthropic
 * credentials. Only when an operator wires a real Supabase project should demo mode
 * be turned off (set NEXT_PUBLIC_DEMO_MODE=false in .env.local).
 *
 * Reading the variable as a string and checking !== "false" means:
 *   - undefined (not set)        → demo mode ON
 *   - "true" / "1" / anything    → demo mode ON
 *   - explicit "false"           → demo mode OFF
 *
 * This default-on behavior is intentional: a misconfigured deployment fails safe
 * to demo mode rather than crashing on missing Supabase URLs.
 */

export const DEMO_MODE: boolean =
  (process.env.NEXT_PUBLIC_DEMO_MODE ?? "true").toLowerCase() !== "false";

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
