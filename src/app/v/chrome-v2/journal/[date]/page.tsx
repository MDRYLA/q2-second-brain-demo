import { fetchEntry } from "@/lib/supabase/entries";
import { fetchPlan } from "@/lib/supabase/plans";
import { fetchSessions } from "@/lib/supabase/training";
import { ChromeV2JournalDayClient } from "./JournalDayClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function ChromeV2JournalDayPage({ params }: PageProps) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return (
      <div className="page-content">
        <h1>Nieprawidłowa data</h1>
        <p className="text-muted">Format powinien być YYYY-MM-DD.</p>
      </div>
    );
  }

  const [checkin, checkout, plan, quickTick, allSessions] = await Promise.all([
    fetchEntry("checkin", date),
    fetchEntry("checkout", date),
    fetchPlan("dzien", date),
    fetchEntry("quick_tick", date),
    fetchSessions(60),
  ]);

  const sessionsForDate = allSessions.filter((s) => s.session_date === date);

  return (
    <ChromeV2JournalDayClient
      date={date}
      checkin={checkin}
      checkout={checkout}
      plan={plan}
      quickTick={quickTick}
      trainingSessions={sessionsForDate}
    />
  );
}
