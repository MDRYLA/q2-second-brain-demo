-- Second Brain v1 — Row Level Security Policies
-- Iteracja N3 (autopilot accel, 2026-04-23)
-- Pattern: A (per-operation, explicit) — 3/5 Opus consensus (ADR-003-rls.md)
-- Optimization: (SELECT auth.uid()) as initplan — prevents per-row function eval

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: users
-- Client cannot INSERT (signup via service_role Route Handler only).
-- SELECT + UPDATE for own row. No DELETE (losing salt = permanent journal loss).
-- ============================================================
CREATE POLICY "users_select"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "users_update"
  ON public.users FOR UPDATE
  TO authenticated
  USING  (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Prevent client-side INSERT and DELETE — signup/admin via service_role only
REVOKE INSERT, DELETE ON public.users FROM authenticated;

-- ============================================================
-- TABLE: entries
-- Full CRUD for own rows. UPSERT not used (always INSERT new entries).
-- ============================================================
CREATE POLICY "entries_select"
  ON public.entries FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "entries_insert"
  ON public.entries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "entries_update"
  ON public.entries FOR UPDATE
  TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "entries_delete"
  ON public.entries FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- TABLE: snapshots
-- SELECT + UPSERT (INSERT ... ON CONFLICT DO UPDATE).
-- Both INSERT and UPDATE policies required for UPSERT per Agent 5 consensus.
-- No DELETE (Konstytucja reset via UPDATE, not DELETE — guardrail #6).
-- ============================================================
CREATE POLICY "snapshots_select"
  ON public.snapshots FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "snapshots_insert"
  ON public.snapshots FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "snapshots_update"
  ON public.snapshots FOR UPDATE
  TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Explicit: no DELETE on snapshots
REVOKE DELETE ON public.snapshots FROM authenticated;

-- ============================================================
-- TABLE: audit_log — APPEND-ONLY
-- SELECT + INSERT only. Absence of UPDATE/DELETE policies = implicit deny.
-- ALSO: trigger enforces append-only even for service_role (bypasses RLS).
-- ============================================================
CREATE POLICY "audit_log_select"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "audit_log_insert"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Belt-and-suspenders for authenticated role
REVOKE UPDATE, DELETE ON public.audit_log FROM authenticated;

-- Trigger: defend against service_role mutations (RLS bypass does NOT bypass triggers)
CREATE OR REPLACE FUNCTION public.prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only — % denied (id: %)', TG_OP, OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_mutation();
