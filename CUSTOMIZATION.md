# Customization Guide

This repo runs in **demo mode** by default — the UI works out-of-the-box with no backend. To turn it into a real personal app you operate yourself, you need to wire three things: a Supabase project, optional Anthropic API access, and a fresh deployment. This guide walks through each.

> ⚠️ **Privacy first.** This app is designed to encrypt everything client-side before it touches the database. The Supabase project you wire here will only ever see `ENC:<base64>` ciphertext. **Do not skip the encryption setup** — without it the journal entries are stored in plaintext.

---

## 1. Fork the repo

```bash
gh repo fork MDRYLA/q2-second-brain-demo --clone --remote
cd q2-second-brain-demo
pnpm install
```

Or use the GitHub UI: Fork → clone your fork.

---

## 2. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com).
2. Create a new project (free tier is fine; pick the EU region for lowest latency from Europe).
3. From the project dashboard:
   - **Project URL** → `Settings → API → Project URL`
   - **anon key** → `Settings → API → Project API keys → anon public`
   - **service_role key** → `Settings → API → Project API keys → service_role` (⚠️ never expose this client-side)

Save these three values; you'll put them in `.env.local` in step 4.

---

## 3. Run the migrations

The schema lives in `supabase/migrations/`. There are two ways to apply it:

**Option A — Supabase CLI (recommended for ongoing dev):**
```bash
brew install supabase/tap/supabase   # macOS
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

**Option B — copy-paste in the SQL editor:**
Open `Supabase dashboard → SQL Editor → New Query`, then paste the contents of each migration file in order (`001_*.sql` through `013_*.sql`), running each one before the next.

After migrations, the database has these tables: `users`, `entries`, `plans`, `snapshots`, `knowledge_notes`, `training_sessions`, `languages`, `vocabulary`. RLS is enabled on each — only the row's owner (matched by `auth.uid()`) can read or write.

---

## 4. Local environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Turn demo mode OFF to use real Supabase
NEXT_PUBLIC_DEMO_MODE=false

NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`.env.local` is gitignored — it will never accidentally end up in version control.

Run the dev server:
```bash
pnpm dev
```

Open `http://localhost:3000`. You should see the login screen (no longer auto-bypassed by demo mode). Sign up with an email — Supabase will send a magic link.

---

## 5. First-time crypto setup

After clicking the magic link and returning to the app:

1. The **PassphraseGate** screen will appear, asking you to set a passphrase. **Pick a strong one** — this is the only thing standing between an attacker who steals your database and your plaintext journal.
2. The app generates a **BIP-39 12-word recovery mnemonic** — write it down on paper, store it somewhere safe (offline). If you lose your passphrase AND your mnemonic, your data is unrecoverable. There is no "forgot password" link.
3. Confirm the passphrase. The app derives an AES-256 key via PBKDF2 (600k iterations, OWASP 2026 baseline) and stores only the salt + a sentinel ciphertext in Supabase.

From this point on, every write is encrypted client-side before being sent to Supabase.

---

## 6. Deploy to Vercel

```bash
npm i -g vercel
vercel link        # creates a new project on your account
```

In the Vercel dashboard, set the same environment variables you put in `.env.local`:

- `NEXT_PUBLIC_DEMO_MODE=false`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL=https://<your-vercel-url>`

Then:
```bash
vercel deploy --prod
```

Update Supabase **Authentication → URL Configuration → Site URL** to match your Vercel URL, otherwise magic links will redirect to localhost.

---

## 7. Optional — wire the AI coach

The app has placeholder routes for an AI coach (weekly/monthly/quarterly review). The implementation is intentionally not bundled in this public repo. To add it:

1. Get an [Anthropic API key](https://console.anthropic.com).
2. Add `ANTHROPIC_API_KEY=sk-ant-...` to your `.env.local` and Vercel env vars.
3. Implement a server route under `src/app/api/coach/route.ts` that takes recent entries (decrypted client-side, sent to the route), runs them through Claude, and streams a response back.

The original private upstream uses a 3-agent architecture (Extractor → Pattern Detector → Confronter). This is left as an exercise.

---

## 8. Customize the design

There are two parallel design variants:

- **`bold-v1`** — Magazine cover, Boldonse + Caveat fonts, hand-drawn flower SVGs, cream paper sections. Tokens in `src/styles/v/bold-v1/`.
- **`chrome-v2`** — Apple Vision, Cormorant Garamond + JetBrains Mono, glass-morphic, numbered sections (CSS counter 001-N). Tokens in `src/styles/v/chrome-v2/`.

To customize:
1. Edit per-variant CSS tokens in `src/styles/v/<variant>/tokens.css`. Don't hardcode colors elsewhere — they should reference these vars.
2. Per-variant atomic components live in `src/components/v/<variant>/`. Keep both variants in sync structurally.
3. To remove one variant entirely, delete its folder and update `src/middleware.ts` to skip the variant cookie.

---

## 9. Customize cascade planning

The cascade planning hierarchy (Year → Quarter → Month → Week → Day) is data-driven. To extend it:

- Types live in `src/lib/plan/tydzien-types.ts` — extend `WeeklyRole`, add new sections, etc.
- The `parent_plan_id` foreign key in `supabase/migrations/012_plans_parent_plan_id.sql` enables linking. Use it to create new cascade levels.
- UI per level is under `src/app/v/<variant>/plan/<level>/`.

---

## 10. Replace the seed content

The Constitution, Quotes, and "About me now" screens load default content from `.seed-input/` on first run. Replace those markdown files with your own — the structure is documented in each file.

---

## Questions?

Open a GitHub issue at [MDRYLA/q2-second-brain-demo](https://github.com/MDRYLA/q2-second-brain-demo/issues). Note that this is a portfolio repo, not a maintained product — response times are best-effort.
