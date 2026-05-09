import { fetchRecentEntries } from "@/lib/supabase/entries";
import { BoldV1TimelineClient } from "./TimelineClient";

export default async function BoldV1TimelinePage() {
  const entries = await fetchRecentEntries(["checkin", "checkout"], 14);
  return <BoldV1TimelineClient entries={entries} />;
}
