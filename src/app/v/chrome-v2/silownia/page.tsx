import { ChromeV2SilowniaClient } from "./SilowniaClient";
import { fetchSessions, fetchLastSessionByType } from "@/lib/supabase/training";

export const dynamic = "force-dynamic";

export default async function ChromeV2SilowniaPage() {
  const [sessions, lastPush, lastPull, lastLegs] = await Promise.all([
    fetchSessions(30),
    fetchLastSessionByType("push"),
    fetchLastSessionByType("pull"),
    fetchLastSessionByType("legs"),
  ]);

  return (
    <ChromeV2SilowniaClient
      sessions={sessions}
      lastPush={lastPush}
      lastPull={lastPull}
      lastLegs={lastLegs}
    />
  );
}
