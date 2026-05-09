-- N5: unique constraint on entries (user_id, entry_date, entry_type)
-- Required for upsert pattern (one checkin/checkout per user per day).
-- Applied after 001_schema.sql + 002_rls.sql.

ALTER TABLE public.entries
  ADD CONSTRAINT entries_user_date_type_unique
  UNIQUE (user_id, entry_date, entry_type);
