-- 010: dodaj users.sentinel — encrypted "OK" probe do verify klucza po deriveKey.
-- Bez tego mobile login pokazuje generic "Nieprawidłowe hasło" bez rozróżnienia
-- czy hasło źle, czy salt fetch padł, czy IndexedDB padło (sesja 14 root cause).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS sentinel TEXT;

COMMENT ON COLUMN public.users.sentinel IS
  'AES-GCM(passphrase-derived-key)("OK"). NULL = legacy user (pre-sesja-14). Verify w loginWithPassphrase.';
