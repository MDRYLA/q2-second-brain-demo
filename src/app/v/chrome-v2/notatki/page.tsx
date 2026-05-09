import { fetchNotes } from "@/lib/supabase/knowledge";
import { fetchAllIdeas } from "@/lib/supabase/entries";
import { ChromeV2NotatkiClient } from "./NotatkiClient";

export const dynamic = "force-dynamic";

export default async function ChromeV2NotatkiPage() {
  const [notes, ideas] = await Promise.all([fetchNotes(100), fetchAllIdeas()]);
  return <ChromeV2NotatkiClient initialNotes={notes} initialIdeas={ideas} />;
}
