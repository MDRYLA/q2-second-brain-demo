import { fetchRecentEntries } from "@/lib/supabase/entries";
import { ChromeV2TimelineClient } from "./TimelineClient";

export default async function ChromeV2TimelinePage() {
  const entries = await fetchRecentEntries(["checkin", "checkout"], 14);
  return <ChromeV2TimelineClient entries={entries} />;
}
