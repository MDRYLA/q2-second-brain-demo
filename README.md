# Q2 — Second Brain

> A personal journaling, planning and habit-tracker app with end-to-end client-side encryption. Two design variants, one codebase. Submitted to **Bison Fellowship 2026** as a portfolio artifact.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Live demo](https://img.shields.io/badge/demo-live-success)](https://q2-second-brain-demo.vercel.app)

---

## What is Q2

Q2 is a personal "Second Brain + Coach" application. It connects four things that people normally try to track in five different apps:

1. **Cascade planning** — Year → Quarter → Month → Week → Day, with each level linking to the next.
2. **Daily check-in / check-out** — short morning intention, longer evening review, intentionally anti-gamification (no streaks, no XP, no scores).
3. **Knowledge + ideas** — markdown notes with inline `#tags`, freeform journal, quick capture.
4. **An AI coach** (server-side, optional) — Claude API runs weekly/monthly/quarterly reviews and confronts the user against their own written constitution.

The app is built around **end-to-end client-side encryption**: a BIP-39 mnemonic derives an AES-GCM key in the browser; the backend only ever sees `ENC:<base64>` ciphertext. Even the database operator cannot read your journal entries.

It ships with **two parallel design variants** — Magazine cover (`bold-v1`) and Apple Vision (`chrome-v2`) — toggleable via a cookie. Both render every screen, sharing logic but not styling.

## Why this repo is public

This is the **portfolio version** of a private app the author runs daily at `q2.dryla.pl`. The code is the same; the data and credentials are not. Demo mode is the default — clone it, run it, see how it works, no setup required.

The private repository (`MDRYLA/second-brain`) and the live deployment are independent of this one. Bug fixes here are welcome via PR; feature work happens upstream.

## Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) | Server Components + Server Actions = less client JS |
| UI | [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com) | Modern hooks, utility-first styling |
| Type system | [TypeScript 5.7](https://www.typescriptlang.org) | Strict mode, no `any`, no `@ts-ignore` |
| Encryption | [`@noble/ciphers`](https://github.com/paulmillr/noble-ciphers), [`@noble/hashes`](https://github.com/paulmillr/noble-hashes), [`@scure/bip39`](https://github.com/paulmillr/scure-bip39) | Audited cryptography, zero external deps |
| Drag & drop | [`@dnd-kit`](https://dndkit.com) | Accessible, keyboard-friendly |
| Backend (optional) | [Supabase](https://supabase.com) (Postgres + RLS + Auth) | E2E-encrypted storage with row-level security |
| AI (optional) | [Anthropic Claude API](https://www.anthropic.com/api) | Weekly/monthly review agents |
| Tests | [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) | Unit + e2e |
| Hosting | [Vercel](https://vercel.com) | Fluid Compute, edge caching |

## Run locally (zero config)

```bash
git clone https://github.com/MDRYLA/q2-second-brain-demo.git
cd q2-second-brain-demo
pnpm install        # or npm install
pnpm dev            # http://localhost:3000
```

That's it. Demo mode is on by default — no Supabase project, no API keys, no `.env.local` needed. Everything renders against an in-memory mock backend; state lives in React component memory only (refresh = empty).

To enable real persistence with your own Supabase project + AI coach, see **[CUSTOMIZATION.md](./CUSTOMIZATION.md)**.

## What you can click through

Once `pnpm dev` is running, each of these screens is reachable on both design variants:

- **Dashboard** — daily snapshot + cascade widget
- **Check-in / Check-out** — morning intention + evening review (Likert4 + open text)
- **Plan** — Year → Quarter → Month → Week → Day, with parent-child linking
- **Journal** — daily timeline view of past entries
- **Knowledge / Notes** — markdown editor + inline `#tags`
- **Constitution** — long-form personal constitution editor
- **Quotes** — daily rotation
- **Habits / Gym** — DUP push-pull-legs tracker
- **Languages** — vocabulary flashcards
- **Audit** — quarterly self-review widget

Switch between Magazine and Vision designs via the toggle in the sidebar.

## Architecture

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for diagrams and a deeper walk-through of:
- The encryption flow (BIP-39 → PBKDF2 → AES-GCM → ciphertext)
- The two-variant UI system
- Cascade planning data model with `parent_plan_id` linking
- How demo mode swaps Supabase for an in-memory mock
- Server vs Client Component separation

## Project structure

```
src/
├── app/
│   ├── api/                # Route handlers (setup-user, auth callback)
│   ├── auth/               # Magic-link callback
│   ├── login/              # Legacy login redirect
│   └── v/                  # Two variants:
│       ├── bold-v1/        #   Magazine cover (Boldonse, hand-drawn flowers)
│       └── chrome-v2/      #   Apple Vision (Cormorant, glass-morphic, numbered)
├── components/             # Shared atomic components (TagPicker, TaskChips, ...)
│   └── v/                  # Per-variant primitives
├── context/                # React Context providers (CryptoKey, ...)
├── lib/                    # Pure logic
│   ├── auth/               # Passphrase + session-store
│   ├── crypto/             # BIP-39, PBKDF2, AES-GCM
│   ├── date/               # Day-boundary 3:00 AM logic
│   ├── plan/               # Cascade planning types + parsers
│   ├── supabase/           # DB layer + mock client
│   └── utils/              # appendTag, makeId, ...
├── styles/v/               # Per-variant CSS tokens
└── middleware.ts           # Auth gate + variant cookie

supabase/migrations/        # 13 migrations, last is 013_security_hardening
tests/e2e/                  # Playwright specs
.seed-input/                # Default content for Constitution / Quotes / About
```

## Development

```bash
pnpm dev              # next dev --turbopack
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint (errors fail; warnings tracked, see ARCHITECTURE.md debt)
pnpm test             # vitest watch
pnpm test:run         # vitest run, exits non-zero if no tests
pnpm test:e2e         # playwright test
pnpm build            # production build
pnpm preflight        # typecheck + lint + test:run + build (run before commit)
```

## License

[MIT](./LICENSE) © 2026 Kacper Dryla.

## Author

Built by **Kacper Dryla** ([@MDRYLA](https://github.com/MDRYLA)). This is a portfolio artifact — feel free to fork, learn from, adapt for your own use. Not actively maintained as a product; feature work happens in the private upstream.

For questions or to say hello: open a GitHub issue.
