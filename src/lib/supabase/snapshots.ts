"use server";

import { createClient } from "@/lib/supabase/server";

export type SnapshotType = "konstytucja" | "o_mnie_teraz" | "cytaty";

export async function fetchSnapshotCiphertext(
  type: SnapshotType
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("snapshots")
      .select("ciphertext")
      .eq("user_id", user.id)
      .eq("snapshot_type", type)
      .single();

    if (error) return null;
    return data?.ciphertext ?? null;
  } catch {
    return null;
  }
}

export async function saveSnapshotCiphertext(
  type: SnapshotType,
  ciphertext: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Brak sesji użytkownika." };

    const { error } = await supabase.from("snapshots").upsert(
      {
        user_id: user.id,
        snapshot_type: type,
        ciphertext,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,snapshot_type" }
    );

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Nieznany błąd zapisu.",
    };
  }
}
