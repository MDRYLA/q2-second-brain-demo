import { fetchEntry } from "@/lib/supabase/entries";
import { fetchPlan } from "@/lib/supabase/plans";
import { getLogicalDateString } from "@/lib/date/day-boundary";
import { periodForLevel, dayIndexMon0 } from "@/lib/date/period";
import { ChromeV2CheckOutClient } from "./CheckOutClient";

interface PageProps {
  searchParams?: Promise<{ date?: string }>;
}

export default async function ChromeV2CheckOutPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const entryDate = params?.date ?? getLogicalDateString();
  const refDate = new Date(entryDate + "T12:00:00");
  const weekPeriod = periodForLevel("tydzien", refDate);
  const [initialEntry, checkInEntry, quickTickEntry, weekPlan] = await Promise.all([
    fetchEntry("checkout", entryDate),
    fetchEntry("checkin", entryDate),
    fetchEntry("quick_tick", entryDate),
    fetchPlan("tydzien", weekPeriod.start),
  ]);

  return (
    <ChromeV2CheckOutClient
      initialEntry={initialEntry}
      quickTickEntry={quickTickEntry}
      checkInEntry={checkInEntry}
      entryDate={entryDate}
      weekPlan={weekPlan}
      weekStart={weekPeriod.start}
      weekEnd={weekPeriod.end}
      dayIdx={dayIndexMon0(refDate)}
    />
  );
}
