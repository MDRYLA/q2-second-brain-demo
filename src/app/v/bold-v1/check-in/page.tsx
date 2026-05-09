import { fetchEntry } from "@/lib/supabase/entries";
import { fetchPlan } from "@/lib/supabase/plans";
import { getLogicalDateString } from "@/lib/date/day-boundary";
import { periodForLevel } from "@/lib/date/period";
import { BoldV1CheckInClient } from "./CheckInClient";

interface PageProps {
  searchParams?: Promise<{ date?: string }>;
}

export default async function BoldV1CheckInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const today = getLogicalDateString();
  const entryDate = params?.date ?? today;

  const initialEntry = await fetchEntry("checkin", entryDate);
  const dayPlan = await fetchPlan("dzien", entryDate);
  const ref = new Date(entryDate + "T12:00:00");
  const { start: weekStart } = periodForLevel("tydzien", ref);
  const weekPlan = await fetchPlan("tydzien", weekStart);

  return (
    <BoldV1CheckInClient
      initialEntry={initialEntry}
      entryDate={entryDate}
      dayPlan={dayPlan}
      weekPlan={weekPlan}
    />
  );
}
