import { fetchNotes } from "@/lib/supabase/knowledge";
import { fetchAllIdeas } from "@/lib/supabase/entries";
import { BoldV1NotatkiClient } from "./NotatkiClient";

export const dynamic = "force-dynamic";

export default async function BoldV1NotatkiPage() {
  const [notes, ideas] = await Promise.all([fetchNotes(100), fetchAllIdeas()]);
  return <BoldV1NotatkiClient initialNotes={notes} initialIdeas={ideas} />;
}
