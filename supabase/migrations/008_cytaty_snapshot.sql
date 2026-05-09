-- Sesja 11 M4 — dodaj 'cytaty' do dozwolonych snapshot_type.
-- Cytaty to lista cytatow (markdown) ktora user edytuje w /cytaty,
-- a dashboard losuje 1 cytat dziennie do wyswietlenia.

ALTER TABLE public.snapshots
DROP CONSTRAINT IF EXISTS snapshots_snapshot_type_check;

ALTER TABLE public.snapshots
ADD CONSTRAINT snapshots_snapshot_type_check
CHECK (snapshot_type IN ('konstytucja', 'o_mnie_teraz', 'cytaty'));
