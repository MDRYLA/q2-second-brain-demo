-- Faza B: planowanie kaskadowe (Rok → Kwartał → Miesiąc → Tydzień → Dzień)
-- Tabela plans (osobna od entries — uniknięcie kolizji z unique constraint 003).
-- Każdy plan = jeden encrypted ciphertext per (user, level, period_start).

CREATE TABLE IF NOT EXISTS public.plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_level    TEXT NOT NULL CHECK (plan_level IN ('rok','kwartal','miesiac','tydzien','dzien')),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  ciphertext    TEXT NOT NULL CHECK (ciphertext LIKE 'ENC:%'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_level, period_start)
);

COMMENT ON TABLE public.plans IS 'Cascading plans (year→quarter→month→week→day). Encrypted client-side.';
COMMENT ON COLUMN public.plans.period_start IS 'First day of the period: rok=YYYY-01-01, kwartal=YYYY-{01,04,07,10}-01, miesiac=YYYY-MM-01, tydzien=Monday YYYY-MM-DD, dzien=YYYY-MM-DD';

CREATE INDEX IF NOT EXISTS idx_plans_user_level_period
  ON public.plans (user_id, plan_level, period_start DESC);

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select"
  ON public.plans FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "plans_insert"
  ON public.plans FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "plans_update"
  ON public.plans FOR UPDATE TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "plans_delete"
  ON public.plans FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
