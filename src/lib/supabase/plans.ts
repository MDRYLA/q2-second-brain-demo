"use server";

import { createClient } from "@/lib/supabase/server";
import type { PlanLevel } from "@/lib/date/period";
import type { TablesInsert } from "@/types/supabase";
import { getLogicalDateString } from "@/lib/date/day-boundary";

export interface PlanRow {
  id: string;
  plan_level: PlanLevel;
  period_start: string;
  period_end: string;
  ciphertext: string;
  created_at: string;
  updated_at: string;
  parent_plan_id?: string | null; // Sesja 19 Sprint 1.5 #10 — link rok->kwartał->miesiąc->tydzień
}

const PLAN_SELECT =
  "id, plan_level, period_start, period_end, ciphertext, created_at, updated_at, parent_plan_id";

export async function fetchPlan(
  planLevel: PlanLevel,
  periodStart: string
): Promise<PlanRow | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("plans")
      .select(PLAN_SELECT)
      .eq("user_id", user.id)
      .eq("plan_level", planLevel)
      .eq("period_start", periodStart)
      .single();

    if (error) return null;
    return data as PlanRow;
  } catch {
    return null;
  }
}

/** Sesja 19 Sprint 1.5 #10 — fetch wszystkie plany danego poziomu (np. dla wyboru parenta). */
export async function fetchPlansByLevel(
  planLevel: PlanLevel,
  limit = 20
): Promise<PlanRow[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("plans")
      .select(PLAN_SELECT)
      .eq("user_id", user.id)
      .eq("plan_level", planLevel)
      .order("period_start", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as PlanRow[];
  } catch {
    return [];
  }
}

/** Sesja 19 Sprint 1.5 #10 — fetch parent plan po id (read-only dla display "Cel rodzica"). */
export async function fetchPlanById(planId: string): Promise<PlanRow | null> {
  if (!planId) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("plans")
      .select(PLAN_SELECT)
      .eq("user_id", user.id)
      .eq("id", planId)
      .single();
    if (error) return null;
    return data as PlanRow;
  } catch {
    return null;
  }
}

export async function savePlan(
  planLevel: PlanLevel,
  periodStart: string,
  periodEnd: string,
  ciphertext: string,
  parentPlanId?: string | null
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak sesji użytkownika." };

    // Upsert na unique (user_id, plan_level, period_start) z migracji 005.
    // Atomowy — eliminuje race condition przy concurrent save.
    const payload: TablesInsert<"plans"> = {
      user_id: user.id,
      plan_level: planLevel,
      period_start: periodStart,
      period_end: periodEnd,
      ciphertext,
      updated_at: new Date().toISOString(),
      ...(parentPlanId !== undefined ? { parent_plan_id: parentPlanId } : {}),
    };
    const { error } = await supabase.from("plans").upsert(payload, {
      onConflict: "user_id,plan_level,period_start",
    });
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nieznany błąd zapisu planu." };
  }
}

/** Fetch all 5 active plans (containing today). */
export async function fetchActiveHierarchy(): Promise<{
  rok: PlanRow | null;
  kwartal: PlanRow | null;
  miesiac: PlanRow | null;
  tydzien: PlanRow | null;
  dzien: PlanRow | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { rok: null, kwartal: null, miesiac: null, tydzien: null, dzien: null };
    }
    // Day boundary 3:00 AM (guardrail #5) — wpis o 1:30 należy do "wczoraj".
    const todayStr = getLogicalDateString();

    // Fetch the most recent plan per level whose period contains today
    const { data, error } = await supabase
      .from("plans")
      .select(PLAN_SELECT)
      .eq("user_id", user.id)
      .lte("period_start", todayStr)
      .gte("period_end", todayStr);

    if (error) {
      return { rok: null, kwartal: null, miesiac: null, tydzien: null, dzien: null };
    }

    const rows = (data ?? []) as PlanRow[];
    const byLevel = (lvl: PlanLevel) => rows.find((r) => r.plan_level === lvl) ?? null;
    return {
      rok: byLevel("rok"),
      kwartal: byLevel("kwartal"),
      miesiac: byLevel("miesiac"),
      tydzien: byLevel("tydzien"),
      dzien: byLevel("dzien"),
    };
  } catch {
    return { rok: null, kwartal: null, miesiac: null, tydzien: null, dzien: null };
  }
}
