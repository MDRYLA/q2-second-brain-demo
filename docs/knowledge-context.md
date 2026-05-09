# Knowledge Context — Q2 Second Brain (public demo, Next.js 16 + Supabase + AES-GCM)

> Auto-generated przez `/knowledge-scan` 2026-05-10.
> Źródło: `!claude-nauka-nowe-rzeczy-itp/knowledge/`
> NIE edytuj ręcznie — regeneruj przez `/knowledge-scan`.
> Własne notatki trzymaj w `docs/knowledge-notes.md` (oddzielnie).

## Top wiedzy z bazy

1. **`knowledge/base/17-nextjs16-supabase-checklist.md`** — Next.js 16 + Supabase SSR + Drizzle + Vercel: 11 community-known gotchas (cookies async, getClaims, Turbopack, eslint, in-memory rate-limit, drizzle-kit vs MCP, Server Actions identity verification). Extended 2026-05-06: defense-in-depth, middleware→proxy.ts rename, useSearchParams Suspense, **E2E encrypted schema migration**, type drift after migration. **Direct stack match.**
2. **`knowledge/base/09-security.md`** — 5 vulnerabilities (env vars, RLS, validation, packages, auth). Extended 2026-05-06: CVE 2026 active (CVE-2025-29927, etc.), DAL pattern, **Vercel breach 04/2026**, **SANDWORM/DevTap typosquatting**, 3-warstwy secret scanning. **KRYTYCZNE dla audytu PII/secrets.**
3. **`knowledge/base/08-website-design-deploy.md`** — deployment Netlify/Vercel + Vercel CLI w autopilocie (MCP-free deployment). **Kluczowe dla Phase 5+6 deploy.**
4. **`knowledge/base/04-context-management.md`** — /context, kompresja, primacy bias, compression ratios. **Pomocne podczas długiej autopilot sesji.**
5. **`knowledge/base/19-best-practices-2026.md`** — najnowsze tipy 2026 (audyt totalny).

## Top solutions

1. **`solutions/2026-05-06-aes-256-gcm-pii-template.md`** — AES-256-GCM dla PII at-rest (iv/tag/ciphertext format). **Direct match z `@noble/ciphers` używanym w projekcie.**
2. **`solutions/2026-04-22-auto-load-bloat-architecture.md`** — CLAUDE.md size budget. **Walidacja: właśnie napisałem CLAUDE.md ~7KB, sprawdzić czy zgodne.**
3. **`solutions/2026-04-22-project-mode-flag.md`** — Mode flag (production-quality vs mvp-speed). **Walidacja: właśnie ustawiłem production-quality.**
4. **`solutions/2026-05-06-multi-pronged-fix.md`** — gdy 3 subagenty wskazują 3 root causes → napraw wszystkie 3 (95%+ vs single 35-40%). **Relewantne dla 3-fresh-reviewer pattern w autopilot.**
5. **`solutions/2026-04-16-vercel-subdomain-seo-protection.md`** — 301 redirect domena techniczna → własna (anti SEO duplicate content). **Istotne bo q2.dryla.pl istnieje produkcyjnie — demo subdomena nie może canibalize SEO oryginału.**
6. **`solutions/2026-05-06-debug-db-first.md`** — przy bugu z UI → najpierw `SELECT *` w Supabase MCP. **(Nie aktywne w demo mode — DB wyłączona — ale zostawiam jako reference.)**
7. **`solutions/2026-04-29-supabase-free-tier-pause.md`** — Supabase free tier auto-pause po 7 dniach. **Reference gdyby Kacper jednak zechciał DB-A.**

## Jak używać (per kontekst → który plik)

- **Gdy audytujesz sekrety/PII** → `knowledge/base/09-security.md` (3-warstwy secret scanning + grep patterns)
- **Gdy refaktoryzujesz Supabase calls do warunkowego demo mode** → `knowledge/base/17-nextjs16-supabase-checklist.md` (gotchas)
- **Gdy walidujesz CLAUDE.md size** → `knowledge/solutions/2026-04-22-auto-load-bloat-architecture.md`
- **Gdy odpalasz 3 fresh reviewerów po fazie** → `knowledge/solutions/2026-05-06-multi-pronged-fix.md` (multi-agent fan-out)
- **Gdy deploy do nowej subdomeny Vercel** → `knowledge/base/08-website-design-deploy.md` + `knowledge/solutions/2026-04-16-vercel-subdomain-seo-protection.md`
- **Gdy trafisz na CVE/typosquatting alert** → `knowledge/base/09-security.md` (CVE 2026 active list + SANDWORM/DevTap)

## Gap detection

- **Brakuje:** solution dla "git history sanitization" (BFG Repo-Cleaner / git-filter-repo) — NIE krytyczne, bo strategia to `rm -rf .git && git init` (zero historii oryginału)
- **Brakuje:** solution dla "demo mode pattern" (warunkowy backend on/off via `NEXT_PUBLIC_DEMO_MODE`) — to faktyczna luka, mogę dropnąć insight po sesji
- **Brakuje:** solution dla "MIT LICENSE w polskim kontekście / EU compliance" — minor, default MIT wystarczy
- **Sugerowane akcje:** żadne researcher calls teraz (gap mało krytyczny). Po nocnej sesji dropnij insight "demo-mode-pattern" do `$META_PROJECT/knowledge/insights-to-process/`.
