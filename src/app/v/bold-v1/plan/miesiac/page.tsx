import { fetchPlan } from "@/lib/supabase/plans";
import { periodForLevel, formatPeriodLabel, parseISODate, addMonths } from "@/lib/date/period";
import { BoldV1PlanLevelClient } from "../PlanLevelClient";

interface PageProps {
  searchParams?: Promise<{ date?: string }>;
}

export default async function BoldV1MiesiacPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ref = parseISODate(params?.date) ?? new Date();
  const { start, end } = periodForLevel("miesiac", ref);
  const kwartalPeriod = periodForLevel("kwartal", ref);
  const [initialPlan, parentPlan] = await Promise.all([
    fetchPlan("miesiac", start),
    fetchPlan("kwartal", kwartalPeriod.start),
  ]);

  const today = new Date();
  const todayMonthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const isCurrentPeriod = start === todayMonthStart;

  return (
    <BoldV1PlanLevelClient
      level="miesiac"
      periodStart={start}
      periodEnd={end}
      periodLabel={formatPeriodLabel("miesiac", ref)}
      initialPlan={initialPlan}
      bulletsMax={5}
      copy={{
        title: "Plan miesięczny",
        headlinePlaceholder: "Focus miesiąca — jedno zdanie",
        bulletsLabel: "Zobowiązania",
        bulletsHint: "Max 5 konkretnych zobowiązań (NIE 'co muszę' — 'co wybieram'). Co odpuszczasz w sekcji notatek.",
        bulletsPlaceholder: "",
        notesLabel: "Notatki + co odpuszczam",
      }}
      prevHref={`/v/bold-v1/plan/miesiac?date=${addMonths(start, -1)}`}
      nextHref={`/v/bold-v1/plan/miesiac?date=${addMonths(start, 1)}`}
      todayHref="/v/bold-v1/plan/miesiac"
      isCurrentPeriod={isCurrentPeriod}
      parentPlan={parentPlan}
      parentLabel={formatPeriodLabel("kwartal", ref)}
    />
  );
}
