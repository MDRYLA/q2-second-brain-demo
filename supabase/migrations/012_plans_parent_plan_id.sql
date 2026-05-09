-- Faza 7 hardening (2026-05-08, security audit DB-2):
-- Migration 012 was previously applied via Supabase MCP/dashboard directly, bypassing
-- migration system. Plik nie istniał w repo — fresh env (local dev, CI, nowa maszyna)
-- nie miałyby kolumny → runtime error w plans.ts (PLAN_SELECT hardcodes parent_plan_id).
--
-- This SQL is idempotent (IF NOT EXISTS) — safe to apply on prod (no-op) and fresh envs.
-- Sesja 19 Sprint 1.5 #10 — kaskada P1/P2/P3 backlink (year → quarter → month → week parent).

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS parent_plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_plans_parent_plan_id ON public.plans(parent_plan_id);
