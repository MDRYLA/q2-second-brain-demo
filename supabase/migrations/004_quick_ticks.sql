-- N5+ feature: quick-tick entries on dashboard.
-- Adds 'quick_tick' to allowed entry_types so user can mark mid-day actions
-- (stretching, gym, cycling, non-fiction reading, fiction reading) without
-- waiting until check-out. Stored as one encrypted entry per day per user.

ALTER TABLE public.entries DROP CONSTRAINT entries_entry_type_check;

ALTER TABLE public.entries ADD CONSTRAINT entries_entry_type_check
  CHECK (entry_type IN (
    'checkin',
    'checkout',
    'idea',
    'gym',
    'plan',
    'knowledge',
    'quick_tick'
  ));
