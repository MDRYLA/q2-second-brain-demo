"use server";

import { createClient } from "@/lib/supabase/server";

export interface LanguageRow {
  id: string;
  code: string;
  ciphertext: string; // ENC({ name, currentLevel, targetLevel, dailyMinutesTarget })
  created_at: string;
}

export interface VocabularyRow {
  id: string;
  language_id: string;
  ciphertext: string; // ENC({ word, definition, example?, source?, pronunciation? })
  fsrs_difficulty: number;
  fsrs_stability: number;
  fsrs_retrievability: number;
  next_review_at: string;
  reps: number;
  lapses: number;
  state: "new" | "learning" | "review" | "relearning";
  created_at: string;
  updated_at: string;
}

export async function fetchLanguages(): Promise<LanguageRow[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("languages")
      .select("id, code, ciphertext, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) return [];
    return (data ?? []) as LanguageRow[];
  } catch {
    return [];
  }
}

export async function createLanguage(
  code: string,
  ciphertext: string
): Promise<{ id: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { id: null, error: "Brak sesji użytkownika." };

    const { data, error } = await supabase
      .from("languages")
      .insert({ user_id: user.id, code, ciphertext })
      .select("id")
      .single();

    if (error) return { id: null, error: error.message };
    return { id: data?.id ?? null, error: null };
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : "Błąd zapisu." };
  }
}

export async function updateLanguage(
  id: string,
  ciphertext: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak sesji." };

    const { error } = await supabase
      .from("languages")
      .update({ ciphertext })
      .eq("user_id", user.id)
      .eq("id", id);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Błąd zapisu." };
  }
}

export async function fetchVocabulary(
  languageId: string,
  limit = 200
): Promise<VocabularyRow[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("vocabulary")
      .select(
        "id, language_id, ciphertext, fsrs_difficulty, fsrs_stability, fsrs_retrievability, next_review_at, reps, lapses, state, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .eq("language_id", languageId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as VocabularyRow[];
  } catch {
    return [];
  }
}

export async function createVocabulary(
  languageId: string,
  ciphertext: string
): Promise<{ id: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { id: null, error: "Brak sesji." };

    const { data, error } = await supabase
      .from("vocabulary")
      .insert({ user_id: user.id, language_id: languageId, ciphertext })
      .select("id")
      .single();

    if (error) return { id: null, error: error.message };
    return { id: data?.id ?? null, error: null };
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : "Błąd zapisu." };
  }
}

export async function deleteVocabulary(
  id: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak sesji." };

    const { error } = await supabase
      .from("vocabulary")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Błąd usuwania." };
  }
}
