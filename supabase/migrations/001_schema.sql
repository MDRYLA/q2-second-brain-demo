-- Second Brain v1 — Core Schema
-- Iteracja N3 (autopilot accel, 2026-04-23)
-- Ciphertext format: ENC:base64(JSON) per ADR-001+ADR-002 (JSON envelope {"v":1,"n":"...","ct":"...","t":"..."})
-- Salt strategy: BIP39-derived per ADR-002 (Option C)

-- ============================================================
-- TABLE: users
-- Stores crypto metadata only — no PII. Content encrypted in entries/snapshots.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salt         TEXT NOT NULL,                                        -- HKDF-derived from BIP39 mnemonic (base64)
  pbkdf2_params JSONB NOT NULL DEFAULT                               -- PBKDF2 params snapshot (600k iter)
                  '{"iterations":600000,"hash":"SHA-256","keyLength":32}',
  bip39_hash   TEXT,                                                 -- HMAC-SHA256(mnemonic) for recovery verification
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.users IS 'Crypto metadata per user. No PII stored in plaintext.';
COMMENT ON COLUMN public.users.salt IS 'HKDF-SHA256(mnemonicEntropy, info="second-brain-kdf-salt-v1"), base64. Used as PBKDF2 salt.';
COMMENT ON COLUMN public.users.bip39_hash IS 'HMAC-SHA256(mnemonic, salt) for recovery integrity check — not the mnemonic itself.';

-- ============================================================
-- TABLE: entries
-- Daily journal entries. Content fully encrypted client-side before storage.
-- Metadata (entry_date, entry_type, mood_word) stored in plaintext for
-- dashboard queries — these are low-sensitivity fields (date + one-word mood).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entry_date   DATE NOT NULL,                                        -- 3AM boundary applied client-side (guardrail #5)
  entry_type   TEXT NOT NULL CHECK (
                 entry_type IN ('checkin','checkout','idea','gym','plan','knowledge')
               ),
  mood_word    TEXT,                                                 -- plain: niski/średni/wysoki — never numerical
  ciphertext   TEXT NOT NULL CHECK (ciphertext LIKE 'ENC:%'),         -- ENC:base64(JSON) — Supabase sees only this
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.entries IS 'Encrypted journal entries. Supabase stores ENC:base64(JSON) only.';
COMMENT ON COLUMN public.entries.mood_word IS 'Low-sensitivity label (niski/średni/wysoki). Full emotional content is in ciphertext.';

-- ============================================================
-- TABLE: snapshots
-- Immutable-during-week blocks: Konstytucja + O mnie teraz.
-- One row per (user_id, snapshot_type) — enforced by UNIQUE.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  snapshot_type TEXT NOT NULL CHECK (snapshot_type IN ('konstytucja','o_mnie_teraz')),
  ciphertext    TEXT NOT NULL CHECK (ciphertext LIKE 'ENC:%'),        -- ENC:base64(JSON)
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, snapshot_type)                                    -- upsert-safe; one Konstytucja per user
);

COMMENT ON TABLE public.snapshots IS 'Encrypted snapshots (Konstytucja, O mnie teraz). Weekly-immutable per guardrail #6.';

-- ============================================================
-- TABLE: audit_log
-- Append-only tamper-detection trail. No UPDATE, no DELETE via RLS.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,                                          -- e.g. 'entry.create', 'snapshot.update', 'login'
  target     TEXT NOT NULL,                                          -- e.g. entry UUID or snapshot_type
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_log IS 'Append-only audit trail. RLS blocks UPDATE and DELETE for all users including owner.';

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_entries_user_date
  ON public.entries (user_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_entries_user_type
  ON public.entries (user_id, entry_type);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_created
  ON public.audit_log (user_id, created_at DESC);

-- ============================================================
-- updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER entries_updated_at
  BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER snapshots_updated_at
  BEFORE UPDATE ON public.snapshots
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
