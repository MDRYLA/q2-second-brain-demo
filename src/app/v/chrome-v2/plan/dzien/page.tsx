import { fetchPlan } from "@/lib/supabase/plans";
import {
  periodForLevel,
  formatPeriodLabel,
  dayIndexMon0,
} from "@/lib/date/period";
import { ChromeV2DzienPlanClient } from "./DzienPlanClient";

interface PageProps {
  searchParams?: Promise<{ date?: string }>;
}

export default async function ChromeV2DzienPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ref = params?.date ? new Date(params.date + "T12:00:00") : new Date();
  const dayPeriod = periodForLevel("dzien", ref);
  const weekPeriod = periodForLevel("tydzien", ref);
  const [weekPlan, dayPlan] = await Promise.all([
    fetchPlan("tydzien", weekPeriod.start),
    fetchPlan("dzien", dayPeriod.start),
  ]);
  return (
    <ChromeV2DzienPlanClient
      todayDate={dayPeriod.start}
      todayLabel={formatPeriodLabel("dzien", ref)}
      todayIdx={dayIndexMon0(ref)}
      weekStart={weekPeriod.start}
      weekEnd={weekPeriod.end}
      weekPlan={weekPlan}
      dayPlan={dayPlan}
    />
  );
}
