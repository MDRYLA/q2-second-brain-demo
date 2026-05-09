"use server";

import { createClient } from "@/lib/supabase/server";

export type EntryType =
  | "checkin"
  | "checkout"
  | "idea"
  | "gym"
  | "plan"
  | "knowledge"
  | "quick_tick";

export interface QuickTickFlags {
  stretching?: boolean;
  gym?: boolean;
  cycling?: boolean;
  nonFiction?: boolean;
  fiction?: boolean;
  acupressureMat?: boolean; // sesja 14 user feedback — mata akupresury
  other?: boolean; // sesja 10 Plan #6 — generic "inne" (spacer/bieg/basen)
  otherText?: string; // LEGACY (sesja 11 v1) — backwards compat
  otherTexts?: string[]; // sesja 11 v2 — multi-add z + button (user feedback)
}

export interface EntryMeta {
  id: string;
  entry_date: string;
  entry_type: EntryType;
  mood_word: string | null;
  ciphertext: string;
  created_at: string;
}

export async function fetchEntry(
  entryType: EntryType,
  entryDate: string
): Promise<EntryMeta | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("entries")
      .select("id, entry_date, entry_type, mood_word, ciphertext, created_at")
      .eq("user_id", user.id)
      .eq("entry_date", entryDate)
      .eq("entry_type", entryType)
      .single();

    if (error) return null;
    return data as EntryMeta;
  } catch {
    return null;
  }
}

export async function saveEntry(
  entryType: EntryType,
  entryDate: string,
  moodWord: string | null,
  ciphertext: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Brak sesji użytkownika." };

    // Upsert na unique (user_id, entry_date, entry_type) z migracji 003.
    // Atomowy — eliminuje race condition przy double-submit z 2 zakładek.
    const { error } = await supabase.from("entries").upsert(
      {
        user_id: user.id,
        entry_date: entryDate,
        entry_type: entryType,
        mood_word: moodWord,
        ciphertext,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,entry_date,entry_type" }
    );
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nieznany błąd zapisu." };
  }
}

export async function addIdea(
  entryDate: string,
  ciphertext: string
): Promise<{ id: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { id: null, error: "Brak sesji użytkownika." };

    const { data, error } = await supabase
      .from("entries")
      .insert({
        user_id: user.id,
        entry_date: entryDate,
        entry_type: "idea" as EntryType,
        ciphertext,
      })
      .select("id")
      .single();

    if (error) return { id: null, error: error.message };
    return { id: data.id, error: null };
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : "Nieznany błąd zapisu." };
  }
}

export async function fetchAllIdeas(): Promise<EntryMeta[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("entries")
      .select("id, entry_date, entry_type, mood_word, ciphertext, created_at")
      .eq("user_id", user.id)
      .eq("entry_type", "idea")
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data ?? []) as EntryMeta[];
  } catch {
    return [];
  }
}

export async function deleteIdea(id: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Brak sesji użytkownika." };

    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("entry_type", "idea");

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Nieznany błąd usuwania." };
  }
}

// Fetch quick_tick entry for a specific date (used by /silownia auto-prefill).
export async function fetchQuickTickEntry(date: string): Promise<EntryMeta | null> {
  return fetchEntry("quick_tick", date);
}

export async function fetchRecentEntries(
  types: EntryType[],
  daysBack: number = 14
): Promise<EntryMeta[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("entries")
      .select("id, entry_date, entry_type, mood_word, ciphertext, created_at")
      .eq("user_id", user.id)
      .in("entry_type", types)
      .gte("entry_date", cutoffStr)
      .order("entry_date", { ascending: false })
      .order("entry_type", { ascending: true });

    if (error) return [];
    return (data ?? []) as EntryMeta[];
  } catch {
    return [];
  }
}
