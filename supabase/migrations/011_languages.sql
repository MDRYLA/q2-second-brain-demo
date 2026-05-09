-- 011: moduł nauki języków (sesja 14 Faza C-W1).
-- MVP scope: 1 język (angielski) + vocabulary harvest. FSRS review w W2.
-- Schema multi-language ready (faza 2 = INSERT row hiszpański, zero migracji).
--
-- E2E encryption: ciphertext zawiera słowo/definicję/przykład (PII).
-- FSRS metadata (next_review_at, difficulty, stability) plain — używane w SQL
-- WHERE clause dla "kart do review dziś".

CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,                 -- ISO 639-1: 'en', 'es', ...
  ciphertext TEXT NOT NULL,           -- ENC({ name, currentLevel, targetLevel, dailyMinutesTarget })
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, code)              -- jeden record per (user, language)
);

CREATE TABLE IF NOT EXISTS public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  ciphertext TEXT NOT NULL,           -- ENC({ word, definition, example, source?, pronunciation? })
  -- FSRS metadata (plain — needed for SQL queries):
  fsrs_difficulty REAL NOT NULL DEFAULT 0,
  fsrs_stability REAL NOT NULL DEFAULT 0,
  fsrs_retrievability REAL NOT NULL DEFAULT 1,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reps INT NOT NULL DEFAULT 0,
  lapses INT NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'new',  -- 'new' | 'learning' | 'review' | 'relearning'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_user_review
  ON public.vocabulary (user_id, next_review_at);

CREATE INDEX IF NOT EXISTS idx_vocabulary_language
  ON public.vocabulary (user_id, language_id, created_at DESC);

-- RLS — user widzi tylko własne dane
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "languages_select_own"
  ON public.languages FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "languages_insert_own"
  ON public.languages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "languages_update_own"
  ON public.languages FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "languages_delete_own"
  ON public.languages FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "vocabulary_select_own"
  ON public.vocabulary FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "vocabulary_insert_own"
  ON public.vocabulary FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "vocabulary_update_own"
  ON public.vocabulary FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "vocabulary_delete_own"
  ON public.vocabulary FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

COMMENT ON TABLE public.languages IS 'Moduł nauki języków (sesja 14). Multi-language ready. ciphertext zawiera nazwę i poziomy.';
COMMENT ON TABLE public.vocabulary IS 'Słownictwo z FSRS metadata. ciphertext zawiera word/definition/example. next_review_at plain dla queries.';
