# Architecture

Q2 is a single-user web app with two design variants, end-to-end client-side encryption, and an optional AI coach. This document explains the architectural choices that aren't immediately obvious from the file tree.

---

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                            BROWSER                                  │
│                                                                     │
│   ┌─────────────────────┐       ┌─────────────────────┐             │
│   │ React 19 client     │──────▶│ AES-GCM encrypt     │             │
│   │ (per-variant UI)    │       │ (lib/crypto/aes)    │             │
│   └────────┬────────────┘       └──────────┬──────────┘             │
│            │                               │                        │
│   ┌────────▼────────────┐       ┌──────────▼──────────┐             │
│   │ Server Action       │       │ ENC:<base64>        │             │
│   │ ("use server")      │       │ ciphertext          │             │
│   └────────┬────────────┘       └──────────┬──────────┘             │
└────────────┼──────────────────────────────┼──────────────────────────┘
             │                               │
             │   HTTPS (Next.js / Vercel)    │
             ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         VERCEL FLUID COMPUTE                        │
│                                                                     │
│   ┌──────────────────────┐       ┌──────────────────────┐           │
│   │ Middleware (auth)    │──────▶│ Server Components    │           │
│   │ src/middleware.ts    │       │ + Server Actions     │           │
│   └──────────┬───────────┘       └──────────┬───────────┘           │
│              │                               │                      │
└──────────────┼───────────────────────────────┼──────────────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SUPABASE (Postgres)                           │
│                                                                     │
│   users / entries / plans / snapshots / knowledge_notes / ...       │
│   Row-Level Security on every table. Server only ever sees ENC:*    │
└─────────────────────────────────────────────────────────────────────┘
```

In **demo mode** (default for this repo), the entire bottom half is replaced by a `MockSupabaseClient` that returns empty/success synchronously. The encryption layer still runs client-side; it just encrypts data nobody persists.

---

## End-to-end encryption

**Threat model.** A future attacker who breaches Supabase or compels the operator must not be able to read journal entries.

**Mechanism.**
1. **Onboarding** generates a BIP-39 12-word mnemonic in the browser using `@scure/bip39`. The mnemonic is shown once; the user is told to write it down. It never leaves the browser.
2. The mnemonic is hashed (HKDF-SHA256) into a 32-byte **salt**, which is sent to the server and stored in `users.salt`. The salt is not secret on its own.
3. The user picks a passphrase. PBKDF2-SHA256 with **600,000 iterations** (OWASP 2026) derives a 32-byte key from `passphrase + salt`. Iteration count is hardcoded in `src/lib/crypto/kdf.ts` and validated server-side in `src/app/api/setup-user/route.ts`.
4. The key encrypts a fixed plaintext `"OK"` and stores the result as `users.sentinel`. Future logins decrypt this sentinel to verify the passphrase before the user can do anything else.
5. Every subsequent write encrypts the entry with AES-256-GCM (`@noble/ciphers/aes`), prefixes it with `ENC:`, and stores it. Each encryption uses a fresh 12-byte IV.
6. The derived key lives in **IndexedDB** (per-device) and **React Context** (per-tab). It is never sent over the network.

**Recovery.** If the user loses the passphrase but keeps the mnemonic, the salt can be re-derived and the key recomputed. If both are lost, the data is permanently inaccessible. There is no "forgot password" — by design.

Files: `src/lib/crypto/{bip39,kdf,aes}.ts`, `src/lib/auth/{passphrase-flow,session-store}.ts`, `src/components/PassphraseGate.tsx`.

---

## Two-variant UI system

Every screen exists in two parallel implementations under `src/app/v/<variant>/<screen>/`:

- **`bold-v1`** — Magazine cover. Boldonse + Caveat fonts, hand-drawn flower SVGs, cream paper sections, accent red.
- **`chrome-v2`** — Apple Vision. Cormorant Garamond + JetBrains Mono, glass-morphic dark, numbered sections (CSS `counter()`), Baby Blue accent.

A cookie `sb-variant-v1` holds the user's choice. The middleware reads it and rewrites legacy paths (`/dashboard`, `/check-in`) to `/v/<variant>/...`. The variant toggle in the sidebar swaps the cookie.

**Why two variants?** Originally an A/B test before committing to one design. The author kept both because they exercise different design vocabularies and showcase how a single business-logic layer (`src/lib/`) can drive radically different UIs.

**Trade-off.** The four largest screen components (`CheckOutClient`, `TydzienPlanClient`, `DzienPlanClient`, `DashboardClient`) are ~91% duplicated between variants. Extracting shared logic into hooks would cut ~6000 LOC but break the design intent of "two parallel takes on the same data". A future refactor candidate.

---

## Cascade planning data model

The planning hierarchy is **Year → Quarter → Month → Week → Day**. Each plan row in the `plans` table has a `level` column and an optional `parent_plan_id` foreign key (added in migration 012).

```
year_plan
  ├── q1_plan (parent_plan_id = year_plan.id)
  │     ├── month1_plan
  │     │     ├── week1_plan
  │     │     │     ├── day1_plan
  │     │     │     ├── day2_plan
  │     │     │     ...
  │     │     ├── week2_plan
  │     │     ...
  │     ├── month2_plan
  │     ...
  ├── q2_plan
  ...
```

A weekly plan can backlink to "P1/P2/P3 from this quarter" via the `weeklyPriority` field on each task — surfacing cascade in the UI without joins. The day plan does the same against the week.

Per-level types and validators live in `src/lib/plan/tydzien-types.ts` (week) and `src/lib/plan/parse-tydzien.ts`. UI under `src/app/v/<variant>/plan/<level>/`.

---

## Demo mode

`NEXT_PUBLIC_DEMO_MODE` (default `true`) gates all Supabase calls. When on:

1. **Middleware** injects a synthetic `DEMO_USER` instead of calling `auth.getUser()`. No redirect to login.
2. **`createClient()`** (both server- and browser-side wrappers in `src/lib/supabase/`) returns a `MockSupabaseClient` from `src/lib/supabase/mock-client.ts` instead of a real Supabase client.
3. **`PassphraseGate`** has an early `if (DEMO_MODE) return <>{children}</>` and skips the entire crypto-setup flow.
4. **`/api/setup-user`** returns `{ ok: true, demo: true }` immediately.
5. **`/auth/callback`** redirects without exchanging any code.

The mock client implements the subset of the Supabase API actually used by this app: `auth.getUser` / `signInWithOtp` / `signOut` / `exchangeCodeForSession`, plus a chainable `from(table)` query builder where every terminal method (`single`, `maybeSingle`, `await`) returns `{ data: null | [], error: null }`. Reads return empty; writes are no-ops.

This means: in demo mode the UI fully renders, navigation works, all forms accept input, but nothing persists. The intent is to showcase the architecture and design without requiring a backend.

---

## Server vs Client Components

- **Server Components by default.** Routes under `src/app/v/<variant>/<screen>/page.tsx` are server-rendered.
- **Client Components are explicit** (`"use client"` directive) and live alongside their server-component page as `<Screen>Client.tsx`.
- **Server Actions** (`"use server"` files in `src/lib/supabase/`) handle every mutation. They run on the server, validate auth, and write to Supabase. In demo mode they return success synchronously without doing anything.
- **`PassphraseGate`** is the boundary: above it, server components render protected content; below it, the client receives the decrypted key.

---

## Security headers

`next.config.ts` configures (active for non-demo deployments):
- `Content-Security-Policy` with `script-src 'unsafe-inline'` (still required for Next.js hydration chunks pre-nonce migration)
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` denying camera / microphone / geolocation

PBKDF2 iteration count is server-validated (`/api/setup-user/route.ts`) — clients can't downgrade.

---

## Open architectural debt

These were intentionally not addressed in the public-demo build:

1. **CSP nonce migration** — current CSP relies on `'unsafe-inline'` for Next.js hydration. Next 16.x doesn't yet have first-class nonce support without custom server.
2. **Two-variant duplication** — see "Two-variant UI system" above.
3. **AI coach implementation** — placeholder routes exist; actual Claude API integration is intentionally left out (see CUSTOMIZATION.md).
4. **Drag & drop in plan/dzien** — uses `@dnd-kit`; React 19 compatibility was OK at time of build but worth re-checking on dep updates.
