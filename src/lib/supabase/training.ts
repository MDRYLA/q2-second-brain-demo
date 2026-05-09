"use server";

import { createClient } from "@/lib/supabase/server";

export type SessionType = "push" | "pull" | "legs" | "custom";

export interface ExerciseSet {
  reps: number;
  weight: number;  // kg
  rpe?: number;    // 1-10 optional
}

export interface SessionExercise {
  id: string;            // uuid client-side
  exerciseId: string;    // 'bench-press' z library albo 'custom-XXX'
  name: string;          // 'Bench Press' (denormalized — backward compat jesli library zmieni)
  plannedSets: number;   // ile serii planowanych
  plannedReps: number;   // ile reps planowanych
  sets: ExerciseSet[];   // actual completed
  notes?: string;
}

export interface TrainingSessionData {
  exercises: SessionExercise[];
  notes?: string;
  lengthMinutes?: number; // sesja 14 — czas trwania sesji (opcjonalny, dla session-RPE)
}

export interface TrainingSessionRow {
  id: string;
  session_date: string;
  session_type: SessionType;
  ciphertext: string;
  created_at: string;
  updated_at: string;
}

export async function fetchSessions(limit = 30): Promise<TrainingSessionRow[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("training_sessions")
      .select("id, session_date, session_type, ciphertext, created_at, updated_at")
      .eq("user_id", user.id)
      .order("session_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as TrainingSessionRow[];
  } catch {
    return [];
  }
}

export async function fetchSession(id: string): Promise<TrainingSessionRow | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("training_sessions")
      .select("id, session_date, session_type, ciphertext, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("id", id)
      .single();

    if (error) return null;
    return data as TrainingSessionRow;
  } catch {
    return null;
  }
}

export async function fetchLastSessionByType(
  type: SessionType,
): Promise<TrainingSessionRow | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("training_sessions")
      .select("id, session_date, session_type, ciphertext, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("session_type", type)
      .order("session_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data as TrainingSessionRow | null;
  } catch {
    return null;
  }
}

export async function createSession(
  sessionDate: string,
  sessionType: SessionType,
  ciphertext: string,
): Promise<{ id: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { id: null, error: "Brak sesji uzytkownika." };

    const { data, error } = await supabase
      .from("training_sessions")
      .insert({
        user_id: user.id,
        session_date: sessionDate,
        session_type: sessionType,
        ciphertext,
      })
      .select("id")
      .single();

    if (error) return { id: null, error: error.message };
    return { id: data?.id ?? null, error: null };
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : "Blad zapisu." };
  }
}

export async function updateSession(
  id: string,
  ciphertext: string,
  sessionType?: SessionType,
  sessionDate?: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak sesji uzytkownika." };

    const patch: {
      ciphertext: string;
      session_type?: string;
      session_date?: string;
    } = { ciphertext };
    if (sessionType) patch.session_type = sessionType;
    if (sessionDate) patch.session_date = sessionDate;

    const { error } = await supabase
      .from("training_sessions")
      .update(patch)
      .eq("user_id", user.id)
      .eq("id", id);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Blad zapisu." };
  }
}

export async function deleteSession(id: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak sesji uzytkownika." };

    const { error } = await supabase
      .from("training_sessions")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Blad usuwania." };
  }
}
