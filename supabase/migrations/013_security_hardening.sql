-- Faza 7 security hardening (2026-05-08).
-- Adresuje findings z security audit Agent 2 (db):
-- 1. Migration 011 (languages, vocabulary) używa auth.users zamiast public.users (regresja
--    fixu z 009 dla M006/M007 — orphaned data risk przy CASCADE z public.users).
-- 2. CHECK ENC:% constraint missing na 4 tabelach (training_sessions, knowledge_notes,
--    languages, vocabulary). Bez tego — silent storage plain PII jeśli encrypt fail.
-- 3. handle_updated_at() bez SECURITY DEFINER + SET search_path = public (M001) —
--    Supabase advisor flag, schema injection theoretical risk.
-- 4. vocabulary brak updated_at trigger.
--
-- Wszystkie zmiany idempotentne (IF NOT EXISTS / DROP IF EXISTS / OR REPLACE).

-- 1) Fix FK na languages + vocabulary (auth.users -> public.users)
DO $$
BEGIN
  -- languages
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'languages' AND c.conname = 'languages_user_id_fkey'
  ) THEN
    ALTER TABLE public.languages DROP CONSTRAINT languages_user_id_fkey;
  END IF;

  ALTER TABLE public.languages
    ADD CONSTRAINT languages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

  -- vocabulary
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'vocabulary' AND c.conname = 'vocabulary_user_id_fkey'
  ) THEN
    ALTER TABLE public.vocabulary DROP CONSTRAINT vocabulary_user_id_fkey;
  END IF;

  ALTER TABLE public.vocabulary
    ADD CONSTRAINT vocabulary_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
END $$;

-- 2) CHECK ENC:% constraint na 4 tabelach (mirror M001/M005/M008 pattern)
DO $$
BEGIN
  -- training_sessions
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'training_sessions_ciphertext_enc') THEN
    ALTER TABLE public.training_sessions
      ADD CONSTRAINT training_sessions_ciphertext_enc
      CHECK (ciphertext LIKE 'ENC:%');
  END IF;

  -- knowledge_notes
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_notes_ciphertext_enc') THEN
    ALTER TABLE public.knowledge_notes
      ADD CONSTRAINT knowledge_notes_ciphertext_enc
      CHECK (ciphertext LIKE 'ENC:%');
  END IF;

  -- languages
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'languages_ciphertext_enc') THEN
    ALTER TABLE public.languages
      ADD CONSTRAINT languages_ciphertext_enc
      CHECK (ciphertext LIKE 'ENC:%');
  END IF;

  -- vocabulary
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vocabulary_ciphertext_enc') THEN
    ALTER TABLE public.vocabulary
      ADD CONSTRAINT vocabulary_ciphertext_enc
      CHECK (ciphertext LIKE 'ENC:%');
  END IF;
END $$;

-- 3) handle_updated_at: SECURITY DEFINER + SET search_path = public
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4) vocabulary updated_at trigger (jeśli set_updated_at istnieje z M006)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS vocabulary_set_updated_at ON public.vocabulary;
    CREATE TRIGGER vocabulary_set_updated_at
      BEFORE UPDATE ON public.vocabulary
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
