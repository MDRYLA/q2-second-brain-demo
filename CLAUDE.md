# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

**Public demo / portfolio version** of "Q2 — Second Brain" — a personal journaling + cascade-planning + AI-coach app built by Kacper Dryla. Original private app lives at `q2.dryla.pl` (closed source, daily-use). **This repo is a sanitized fork** prepared as a code sample for the **Bison Fellowship 2026** application (deadline 2026-05-11).

**This is NOT the live app.** It is a clean snapshot:
- All personal data removed (no real journal entries, no real plans, no PII).
- All credentials replaced with placeholders (no live Supabase URL, no live Anthropic API key).
- Backend disabled by default — runs in **mock localStorage mode** so the committee can clone and `pnpm dev` without setting up Supabase.
- Optional Supabase / Anthropic integration documented in `CUSTOMIZATION.md`.

**The original private repo (`MDRYLA/second-brain`) and the live app (`q2.dryla.pl`) are completely independent.** Do NOT push anything from this repo back to the original. Do NOT use original credentials.

## Mode: production-quality

Pełen quality-first, active challenge, zero Pareto compromises. Apka pokazywana komitetowi Bison — musi być idealna. Hard override security-critical (auth/RLS/Stripe/RODO/PII) zawsze 100% niezależnie od mode — patrz `~/.claude/rules/proactive-core.md`.

## Concept (3 sentences)

Personal "Second Brain + Coach" app. Cascading planning hierarchy (Year → Quarter → Month → Week → Day) + daily check-in/check-out + habit tracker + journal + Claude-powered AI coach that runs weekly/monthly reviews and confronts the user against their own written constitution. Built with **end-to-end client-side encryption** (BIP-39 mnemonic → PBKDF2 → AES-GCM) so the backend only ever stores ciphertext.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript 5.7
- **Styling:** Tailwind CSS v4
- **Encryption:** `@noble/ciphers` (AES-GCM), `@noble/hashes` (PBKDF2), `@scure/bip39` (mnemonic recovery)
- **Drag & drop:** `@dnd-kit/core` + `@dnd-kit/sortable`
- **Backend (optional in this demo):** Supabase (Postgres + Auth + RLS) via `@supabase/ssr` + `@supabase/supabase-js`
- **AI (optional in this demo):** Anthropic Claude API (server-side route, key never reaches client)
- **Tests:** Vitest (unit) + Playwright (e2e)
- **Deploy:** Vercel
- **Node:** ≥22

## Commands

```bash
pnpm install          # or npm install
pnpm dev              # next dev --turbopack — http://localhost:3000
pnpm build            # production build
pnpm start            # serve production build
pnpm lint             # eslint, max-warnings 0
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest watch
pnpm test:run         # vitest run --passWithNoTests
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

When editing a screen, **always edit both variants** unless the change is variant-specific (e.g. a typography token only relevant to `bold-v1`).

### End-to-end encryption flow

User onboarding generates a BIP-39 mnemonic (12 words). The mnemonic is converted to a master key via PBKDF2 (≥600k iterations, salt stored in `users` row). The master key encrypts every journal entry / plan / note client-side as AES-GCM and stores the ciphertext as `ENC:<base64>` in the database. **The server never sees plaintext.** Master key lives in IndexedDB (per-device); recovery requires the mnemonic.

Crypto entry points: `src/lib/crypto/` (mnemonic.ts, derive.ts, aes.ts). Per-tab passphrase staging: `sessionStorage["sb-pp-tmp"]` (cleared on tab close).

### Cascade planning data model

Plans link upward via `parent_plan_id` (FK in DB migration 012). Year plan → Quarter plan(s) → Month plan(s) → Week plan(s) → Day plan(s). Each level can backlink to parent (P1/P2/P3 cascade) and a child marks completion against parent priorities. UI in `src/app/v/<variant>/plan/<level>/` and `src/lib/plan/`.

### Demo mode (mock localStorage)

When `NEXT_PUBLIC_DEMO_MODE=true` (default in `.env.example`), all Supabase calls are stubbed and data persists in `localStorage` only. The auth gate is bypassed (a synthetic demo user is injected). This lets reviewers clone, `pnpm dev`, and click through the app without any backend setup. To enable real Supabase + AI in your own fork: see `CUSTOMIZATION.md`.

### Folder map

- `src/app/` — App Router routes. `auth/`, `api/`, `login/`, and `v/<variant>/<screen>/`.
- `src/components/` — Shared (`form/`, `icons/`) + per-variant atomic primitives in `v/<variant>/`.
- `src/context/` — React Context providers (auth, encryption key).
- `src/lib/` — Pure logic. Notable subfolders:
  - `crypto/` — AES-GCM + BIP-39 + key derivation
  - `auth/` — Supabase auth wrappers + demo-mode shim
  - `storage/` — DB layer (real or mock, behind one interface)
  - `plan/` — Cascade planning types, parsers, validators
  - `journal/` — Journal entry CRUD + legacy migration helpers
  - `tags/`, `cytaty/`, `exercises/` — Domain-specific helpers
- `src/styles/v/<variant>/tokens.css` — Per-variant CSS variables. Override here, never inline.
- `src/middleware.ts` — Variant cookie + auth gate.
- `supabase/migrations/` — SQL migrations (run on a fresh Supabase project, see CUSTOMIZATION.md).
- `tests/` — Vitest unit tests + Playwright e2e specs.

## Important constraints (this repo specifically)

1. **No personal data, ever.** Every seed, fixture, screenshot, comment must be generic. If you see the author's first name, surname, real email, phone number, birth date, or address anywhere — replace with a placeholder. Names of the author's relatives are also off-limits.
2. **No live credentials.** `.env*` files (except `.env.example`) are gitignored. Any `sk-ant-`, `eyJhbGci`, `sbp_`, `sk_live`, `pk_live`, `AIza`, `AKIA` prefix in a tracked file is a CI failure waiting to happen — strip it.
3. **Demo mode is the default.** Don't rip out the `NEXT_PUBLIC_DEMO_MODE` branching. Reviewers must be able to clone → `pnpm install` → `pnpm dev` and have a working app with zero env config.
4. **Don't break both variants.** UI changes touch `bold-v1` AND `chrome-v2` unless explicitly variant-specific.
5. **Don't add gamification.** No streaks, no XP, no badges, no progress bars beyond plain progress indicators. The app is anti-toxic-optimization by design.
6. **Don't change the stack.** Next.js 16 + Supabase + AES-GCM client-side is a deliberate choice. New dependencies require an explicit reason.

## Environment variables

See `.env.example` for the full list. Minimum to run in demo mode: nothing (defaults work). To enable real Supabase + AI:
- `NEXT_PUBLIC_DEMO_MODE=false`
- `NEXT_PUBLIC_SUPABASE_URL=...` + `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...` (server-only, used by API routes)
- `ANTHROPIC_API_KEY=...` (server-only, for the AI coach route)

Full setup walkthrough: `CUSTOMIZATION.md`.

## Capabilities (co Claude może w tym repo)

Pełna lista w `~/.claude/rules/capabilities.md`. Najbardziej relewantne:

- **Agenty lokalne** (`.claude/agents/`): `researcher`, `qa`, `fresh-reviewer`
- **Agenty globalne**: `code-reviewer`, `tech-advisor`, `seo-auditor`, `web-copywriter`, `general-purpose`, `Explore`, `Plan`
- **MCP**: GitHub, Vercel, Supabase, Playwright, Chrome DevTools, Context7, Firecrawl
- **Auto-hook**: `Stop` odpala code-reviewer gdy zmiany w kodzie >5 linii (`.claude/hooks/review-if-code-changed.sh`)

## UI Workflow (auto)

Dla zadań UI (komponent, widok, design):
1. **frontend-design** skill — auto-ładowanie po triggerach ("zbuduj komponent", "zaprojektuj sekcję")
2. **impeccable** skill — uzupełnienie: audit + anti-patterns + 18 komend (polish, critique, layout, typeset, animate, colorize...)
3. Po UI build → skill `polish` + `impeccable-audit` (ostatni szlif)
4. Po commit-ready → hook `Stop` wywołuje `code-reviewer` automatycznie

NIE pytaj — TO AUTOMAT.

**Wyjątek:** zmiany w UI tego repo MUSZĄ touch oba warianty (`bold-v1` + `chrome-v2`) chyba że change jest variant-specific.

## PRD-First Workflow

Ten repo ma już PRD stub w `docs/PRD.md` (krótki — to portfolio artifact). Dla większych zmian:

1. Skill `prd-writer` → update `docs/PRD.md`
2. Skill `design-md` lub ręcznie → update `docs/design-guide.md`
3. Plan Mode (Shift+Tab) → plan implementacji
4. Kodowanie zgodnie z PRD + Design Guide
5. Skill `design-review` po każdym widoku — porównuje z Design Guide

## Project Structure
<!-- docs-structure -->
- `active/` — mid-session worki (drafty, plany w trakcie). Sprzątaj przez `/cleanup`.
- `docs/PRD.md` — co i dlaczego (nietechniczne, przez `prd-writer`)
- `docs/design-guide.md` — system wizualny (przez skill `design-md`)
- `docs/knowledge-context.md` — wiedza z meta-bazy (AUTO przez `/knowledge-scan` — nie edytuj ręcznie)
- `docs/AUTOPILOT-QUEUE.md` — kolejka decyzji z `/autopilot`
- `docs/audits/YYYY-MM-DD-<slug>.md` — raporty z `/check`, `impeccable-audit`, `fresh-reviewer`
- `docs/plans/YYYY-MM-DD-<slug>.md` — plany Plan Mode / pre-refactor
- `docs/handoffs/YYYY-MM-DD-sesja-N.md` — sesyjne handoffy (AUTO przez `/handoff`, `/handoff-full`). Czytaj ostatni przed pracą
- `docs/qa/` — TESTING-*.md po sesji
- `docs/ops/` — DNS-*, deployment notes
- `docs/decisions/` — architectural choices (rzadko)

### Naming Conventions
<!-- naming-conventions -->
Pliki robocze trafiają do właściwych folderów (egzekwowane przez `/cleanup` + hooki):

| Wzorzec | Lokalizacja |
|---|---|
| `DRAFT-*.md` | `.gitignored` (planning/ folder lokalnie, TTL <7 dni) |
| `PLAN-feature*.md` | `~/.claude/plans/<projekt>/` (NIE w repo root) |
| `HANDOFF-*.md` | `docs/handoffs/` |
| `DNS-*.md` | `docs/ops/` |
| `TESTING-*.md`, `TEST-PLAN-*.md` | `docs/qa/` |
| Mid-session work | `active/` |

Sprzątanie ad-hoc: `/cleanup` (3 fan-out agenty, reversible przez `git tag pre-cleanup-YYYY-MM-DD`).
<!-- /naming-conventions -->

### Konwencja zapisu raportów (AUTO — nie pytaj Kacpra)
- Raport z `/check` → `docs/audits/YYYY-MM-DD-check.md`
- Plan Mode → `docs/plans/YYYY-MM-DD-<slug>.md`
- Review od `fresh-reviewer` / `code-reviewer` → `docs/audits/YYYY-MM-DD-review-<slug>.md`
- NIE zapisuj raportów w root projektu. NIE tylko do chatu.

## Handoffs

Przed pracą — przeczytaj **ostatni handoff** dla kontekstu poprzedniej sesji:
`docs/handoffs/` (sortowane po dacie).

Recent (max 10 — starsze tylko w folderze):
_(pusta — zapełni się przez `/handoff` lub `/handoff-full`)_

Pełne archiwum: `ls docs/handoffs/`.

## Learned Rules

(dopisuj gdy Kacper cię poprawi — zgodnie z `~/.claude/rules/auto-learned-rules.md` + `.claude/learned-rules.md` + `.claude/anti-patterns.md`)

## Status & history

This repo was created on 2026-05-10 from a sanitized snapshot of the private upstream. It is **not actively developed** — it is a portfolio artifact. Bug fixes welcome via PR; feature work happens in the private upstream.

Original architectural decisions (12 ADRs) and detailed session history live in the private repo. This CLAUDE.md is the single source of truth for the public version.
