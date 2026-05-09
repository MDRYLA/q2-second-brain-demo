-- Migracja 009 — sesja 12 cleanup (Agent 4 audit findings):
--
-- 1) FK fix: M006/M007 (training_sessions, knowledge_notes) referencowaly
--    auth.users(id) zamiast public.users(id) — niespojne z M001-M005.
--    Bez ON DELETE CASCADE — orphan rows przy DELETE auth user.
--    Fix: drop FK + recreate z REFERENCES public.users(id) ON DELETE CASCADE.
--
-- 2) DROP audit_log table — 0 callerow w kodzie (sprawdzone grep "from(\"audit_log\"").
--    Zaplanowana w M002 ale nigdy nie zaimplementowana w kliencie.
--    Storage + RLS + trigger overhead bez benefitu. Dodamy gdy bedzie potrzebne.
--
-- Safe for solo-user MVP — no orphan data, no entry loss.

-- ============================================================================
-- 1. FK fix: training_sessions
-- ============================================================================
ALTER TABLE public.training_sessions
  DROP CONSTRAINT IF EXISTS training_sessions_user_id_fkey;

ALTER TABLE public.training_sessions
  ADD CONSTRAINT training_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ============================================================================
-- 2. FK fix: knowledge_notes
-- ============================================================================
ALTER TABLE public.knowledge_notes
  DROP CONSTRAINT IF EXISTS knowledge_notes_user_id_fkey;

ALTER TABLE public.knowledge_notes
  ADD CONSTRAINT knowledge_notes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ============================================================================
-- 3. DROP audit_log + dependencies (RLS policies, indexes, triggers)
-- ============================================================================
DROP TABLE IF EXISTS public.audit_log CASCADE;
