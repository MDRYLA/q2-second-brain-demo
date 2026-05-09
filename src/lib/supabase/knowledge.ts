"use server";

import { createClient } from "@/lib/supabase/server";

export interface KnowledgeNoteData {
  title: string;
  body: string;
  tags: string[];
}

export interface KnowledgeNoteRow {
  id: string;
  ciphertext: string;
  tags_hash: string[];
  created_at: string;
  updated_at: string;
}

export async function fetchNotes(limit = 100): Promise<KnowledgeNoteRow[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("knowledge_notes")
      .select("id, ciphertext, tags_hash, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as KnowledgeNoteRow[];
  } catch {
    return [];
  }
}

export async function fetchNote(id: string): Promise<KnowledgeNoteRow | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("knowledge_notes")
      .select("id, ciphertext, tags_hash, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("id", id)
      .single();

    if (error) return null;
    return data as KnowledgeNoteRow;
  } catch {
    return null;
  }
}

export async function createNote(
  ciphertext: string,
  tagsHash: string[],
): Promise<{ id: string | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { id: null, error: "Brak sesji uzytkownika." };

    const { data, error } = await supabase
      .from("knowledge_notes")
      .insert({ user_id: user.id, ciphertext, tags_hash: tagsHash })
      .select("id")
      .single();

    if (error) return { id: null, error: error.message };
    return { id: data?.id ?? null, error: null };
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : "Blad zapisu." };
  }
}

export async function updateNote(
  id: string,
  ciphertext: string,
  tagsHash: string[],
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak sesji uzytkownika." };

    const { error } = await supabase
      .from("knowledge_notes")
      .update({ ciphertext, tags_hash: tagsHash })
      .eq("user_id", user.id)
      .eq("id", id);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Blad zapisu." };
  }
}

export async function deleteNote(id: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak sesji uzytkownika." };

    const { error } = await supabase
      .from("knowledge_notes")
      .delete()
      .eq("user_id", user.id)
      .eq("id", id);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Blad usuwania." };
  }
}
