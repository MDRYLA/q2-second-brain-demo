"use server";

import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";

export type SeedContentType = "konstytucja" | "o_mnie_teraz" | "cytaty";

/**
 * Returns raw markdown from .seed-input/ for client-side encryption.
 * Called once after first passphrase setup to populate empty snapshots.
 *
 * Faza 7 hardening: getUser() guard. Bez tego "use server" znaczyło że KAŻDY niezalogowany
 * caller (przez Server Action RPC) mógł odczytać surowy plaintext .seed-input/konstytucja.md.
 */
export async function getSeedContent(
  type: SeedContentType
): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const filename =
    type === "konstytucja" ? "konstytucja.md"
      : type === "cytaty" ? "cytaty.md"
        : "o-mnie-teraz.md";
  const seedPath = path.join(process.cwd(), ".seed-input", filename);
  try {
    const content = fs.readFileSync(seedPath, "utf-8");
    // Return null if it's a placeholder (starts with "# TODO" or is very short)
    if (content.trim().length < 50 || content.trim().startsWith("# TODO")) {
      return null;
    }
    return content;
  } catch {
    return null;
  }
}

/**
 * Check if the user already has both snapshots set up.
 * Returns true if seeding is needed (no snapshots exist).
 */
export async function needsSeeding(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { count } = await supabase
      .from("snapshots")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    return (count ?? 0) === 0;
  } catch {
    return false;
  }
}
