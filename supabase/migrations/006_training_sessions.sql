-- Migration 006: Training sessions for /silownia DUP push-pull-legs tracker.
-- 'plan + execute' pattern (similar to Strong / Hevy training apps).
-- Encrypted ciphertext column (E2E client-side AES-GCM, same as entries and plans).

CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('push','pull','legs','custom')),
  ciphertext TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS training_sessions_user_date_idx
  ON training_sessions (user_id, session_date DESC);

CREATE INDEX IF NOT EXISTS training_sessions_user_type_idx
  ON training_sessions (user_id, session_type, session_date DESC);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "training_sessions_select_own" ON training_sessions;
CREATE POLICY "training_sessions_select_own" ON training_sessions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "training_sessions_insert_own" ON training_sessions;
CREATE POLICY "training_sessions_insert_own" ON training_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "training_sessions_update_own" ON training_sessions;
CREATE POLICY "training_sessions_update_own" ON training_sessions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "training_sessions_delete_own" ON training_sessions;
CREATE POLICY "training_sessions_delete_own" ON training_sessions
  FOR DELETE USING (user_id = auth.uid());

-- Trigger to auto-update updated_at on UPDATE.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS training_sessions_set_updated_at ON training_sessions;
CREATE TRIGGER training_sessions_set_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
