# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

**Public demo / portfolio version** of "Q2 — Second Brain" — a personal journaling + cascade-planning app built by Kacper Dryla. The original private app lives at `q2.dryla.pl` (closed source, daily-use). **This repo is a sanitized fork** prepared as a code sample for the **Bison Fellowship 2026** application (deadline 2026-05-11).

**This is NOT the live app.** It is a clean snapshot:
- All personal data removed (no real journal entries, no real plans, no PII).
- All credentials replaced with placeholders.
- Backend disabled by default — runs in **mock mode** so the committee can clone and `pnpm dev` without setting up Supabase.
- Optional Supabase integration documented in `CUSTOMIZATION.md`.

The original private repo (`MDRYLA/second-brain`) and the live app (`q2.dryla.pl`) are completely independent of this one. Do not push from here back to the original. Do not use original credentials.

## Concept (3 sentences)

Personal "Second Brain + Coach" app. Cascading planning hierarchy (Year → Quarter → Month → Week → Day) + daily check-in/check-out + habit tracker + journal. Built with **end-to-end client-side encryption** (BIP-39 mnemonic → PBKDF2 600k iterations → AES-256-GCM) so the backend only ever stores ciphertext.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript 5.7
- **Styling:** Tailwind CSS v4
- **Encryption:** `@noble/ciphers` (AES-GCM), `@noble/hashes` (PBKDF2), `@scure/bip39` (mnemonic)
- **Drag & drop:** `@dnd-kit/core` + `@dnd-kit/sortable`
- **Backend (optional):** Supabase (Postgres + Auth + RLS) via `@supabase/ssr`
- **Tests:** Vitest (unit) + Playwright (e2e)
- **Deploy:** Vercel
- **Node:** ≥22

## Commands

```bash
pnpm install
pnpm dev              # next dev --turbopack — http://localhost:3000
pnpm build            # production build
pnpm start            # serve production build
pnpm lint             # eslint (errors fail; warnings tracked, see ARCHITECTURE.md debt)
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest watch
pnpm test:run         # vitest run
pnpm test:e2e         # playwright test
pnpm preflight        # typecheck + lint + test:run + build (run before commit)
```

Single test file: `pnpm test path/to/file.test.ts`. Single Playwright spec: `pnpm test:e2e tests/e2e/<file>.spec.ts`.

## High-level architecture

### Two-variant UI system

The app ships **two parallel design variants** of every screen, selectable via cookie `sb-variant-v1`:
- `bold-v1` — Magazine-cover aesthetic (Boldonse + Caveat fonts, hand-drawn flower SVGs, cream paper sections)
- `chrome-v2` — Apple Vision aesthetic (Cormorant Garamond + JetBrains Mono, glass-morphic, numbered sections 001-N)

Routes live under `src/app/v/<variant>/<screen>/`. The middleware (`src/middleware.ts`) reads the cookie and rewrites `/` → `/v/<variant>/dashboard`. Per-variant atomic components in `src/components/v/<variant>/`. Per-variant CSS tokens in `src/styles/v/<variant>/`.

When editing a screen, edit both variants unless the change is variant-specific (e.g. a typography token only relevant to `bold-v1`).

### End-to-end encryption flow

User onboarding generates a BIP-39 mnemonic (12 words). The mnemonic is converted to a master key via PBKDF2 (600k iterations, salt stored in `users` row). The master key encrypts every journal entry / plan / note client-side as AES-GCM and stores the ciphertext as `ENC:<base64>` in the database. The server never sees plaintext. Master key lives in IndexedDB (per-device); recovery requires the mnemonic.

Crypto entry points: `src/lib/crypto/`. Per-tab passphrase staging: `sessionStorage["sb-pp-tmp"]`.

### Cascade planning data model

Plans link upward via `parent_plan_id` (FK in DB migration 012). Year plan → Quarter plan(s) → Month plan(s) → Week plan(s) → Day plan(s). Each level can backlink to parent (P1/P2/P3 cascade). UI in `src/app/v/<variant>/plan/<level>/` and `src/lib/plan/`.

### Demo mode

When `NEXT_PUBLIC_DEMO_MODE=true` (default), all Supabase calls are stubbed via a mock client (`src/lib/supabase/mock-client.ts`). The auth gate is bypassed (a synthetic demo user is injected). Reviewers can clone, `pnpm dev`, and click through the app without any backend setup. To enable real Supabase: see `CUSTOMIZATION.md`.

A loud runtime warning logs to server console if `DEMO_MODE` is on in Vercel production deployments — set `DEMO_MODE_INTENDED=true` to silence on the reference deploy, or `NEXT_PUBLIC_DEMO_MODE=false` on forks meant for real personal use.

### Folder map

- `src/app/` — App Router routes. `auth/`, `api/`, `login/`, and `v/<variant>/<screen>/`.
- `src/components/` — Shared (`form/`, `icons/`) + per-variant atomic primitives in `v/<variant>/`.
- `src/context/` — React Context providers (auth, encryption key).
- `src/lib/` — Pure logic.
  - `crypto/` — AES-GCM + BIP-39 + key derivation
  - `auth/` — Supabase auth wrappers + demo-mode shim
  - `storage/`, `plan/`, `journal/`, `tags/`, `cytaty/`, `exercises/`, `utils/`
  - `supabase/` — server actions + mock client
- `src/styles/v/<variant>/tokens.css` — Per-variant CSS variables.
- `src/middleware.ts` — Variant cookie + auth gate.
- `supabase/migrations/` — SQL migrations (run on a fresh Supabase project, see CUSTOMIZATION.md).
- `tests/` — Vitest unit tests + Playwright e2e specs.
- `.seed-input/` — Default markdown content for Constitution / Quotes / About screens.

## Important constraints

1. **No personal data, ever.** Every seed, fixture, screenshot, comment must be generic.
2. **No live credentials.** `.env*` files (except `.env.example`) are gitignored. Any `sk-ant-`, `eyJhbGci`, `sbp_`, `sk_live`, `pk_live`, `AIza`, `AKIA` prefix in a tracked file is a CI failure waiting to happen.
3. **Demo mode is the default.** Don't rip out the `NEXT_PUBLIC_DEMO_MODE` branching. Reviewers must be able to clone → `pnpm install` → `pnpm dev` and have a working app with zero env config.
4. **Don't break both variants.** UI changes touch `bold-v1` AND `chrome-v2` unless explicitly variant-specific.
5. **Don't add gamification.** No streaks, no XP, no badges. The app is anti-toxic-optimization by design.
6. **Don't change the stack.** Next.js 16 + Supabase + AES-GCM client-side is a deliberate choice.

## Environment variables

See `.env.local.example` for the full list. Minimum to run in demo mode: nothing (defaults work). To enable real Supabase:
- `NEXT_PUBLIC_DEMO_MODE=false`
- `NEXT_PUBLIC_SUPABASE_URL=...` + `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...` (server-only, used by `/api/setup-user`)

Full setup walkthrough: `CUSTOMIZATION.md`.

## Status

This repo was created on 2026-05-10 from a sanitized snapshot of the private upstream. It is not actively developed — it is a portfolio artifact. Bug fixes welcome via PR; feature work happens in the private upstream.

For deeper architectural context: `ARCHITECTURE.md`. For fork setup: `CUSTOMIZATION.md`. For PR conventions: `CONTRIBUTING.md`.
