-- Migration 007: Knowledge notes for /wiedza module (sesja 9.5).
-- E2E AES-GCM encrypted ciphertext (jak entries, plans, training_sessions).
-- tags_hash[] dla LIKE search bez decryption (MVP — uproszczone, plain hash).

CREATE TABLE IF NOT EXISTS knowledge_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ciphertext TEXT NOT NULL,                -- {title, body, tags[]} encrypted
  tags_hash TEXT[] DEFAULT '{}',           -- (MVP: empty na start, search lokalnie po decrypt)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_notes_user_updated_idx
  ON knowledge_notes (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS knowledge_notes_user_tags_idx
  ON knowledge_notes USING GIN (tags_hash);

ALTER TABLE knowledge_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "knowledge_notes_select_own" ON knowledge_notes;
CREATE POLICY "knowledge_notes_select_own" ON knowledge_notes
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "knowledge_notes_insert_own" ON knowledge_notes;
CREATE POLICY "knowledge_notes_insert_own" ON knowledge_notes
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "knowledge_notes_update_own" ON knowledge_notes;
CREATE POLICY "knowledge_notes_update_own" ON knowledge_notes
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "knowledge_notes_delete_own" ON knowledge_notes;
CREATE POLICY "knowledge_notes_delete_own" ON knowledge_notes
  FOR DELETE USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS knowledge_notes_set_updated_at ON knowledge_notes;
CREATE TRIGGER knowledge_notes_set_updated_at
  BEFORE UPDATE ON knowledge_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
