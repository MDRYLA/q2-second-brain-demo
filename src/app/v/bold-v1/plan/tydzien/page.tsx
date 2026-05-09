import { fetchPlan } from "@/lib/supabase/plans";
import {
  periodForLevel,
  formatPeriodLabel,
  dayIndexMon0,
  parseISODate,
  addWeeks,
} from "@/lib/date/period";
import { BoldV1TydzienPlanClient } from "./TydzienPlanClient";

interface PageProps {
  searchParams?: Promise<{ date?: string }>;
}

export default async function BoldV1TydzienPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ref = parseISODate(params?.date) ?? new Date();
  const { start, end } = periodForLevel("tydzien", ref);
  const monthPeriod = periodForLevel("miesiac", ref);
  const quarterPeriod = periodForLevel("kwartal", ref);
  const yearPeriod = periodForLevel("rok", ref);
  const [initialPlan, monthPlan, quarterPlan, yearPlan] = await Promise.all([
    fetchPlan("tydzien", start),
    fetchPlan("miesiac", monthPeriod.start),
    fetchPlan("kwartal", quarterPeriod.start),
    fetchPlan("rok", yearPeriod.start),
  ]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isCurrentWeek = todayStr >= start && todayStr <= end;
  const todayIdx = isCurrentWeek ? dayIndexMon0(today) : -1;

  return (
    <BoldV1TydzienPlanClient
      periodStart={start}
      periodEnd={end}
      periodLabel={formatPeriodLabel("tydzien", ref)}
      todayIdx={todayIdx}
      initialPlan={initialPlan}
      monthPlan={monthPlan}
      quarterPlan={quarterPlan}
      yearPlan={yearPlan}
      prevWeekHref={`/v/bold-v1/plan/tydzien?date=${addWeeks(start, -1)}`}
      nextWeekHref={`/v/bold-v1/plan/tydzien?date=${addWeeks(start, 1)}`}
      isCurrentWeek={isCurrentWeek}
    />
  );
}
