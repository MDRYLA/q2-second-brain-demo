import { fetchPlan } from "@/lib/supabase/plans";
import { periodForLevel, formatPeriodLabel, parseISODate, addQuarters } from "@/lib/date/period";
import { BoldV1PlanLevelClient } from "../PlanLevelClient";

interface PageProps {
  searchParams?: Promise<{ date?: string }>;
}

export default async function BoldV1KwartalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ref = parseISODate(params?.date) ?? new Date();
  const { start, end } = periodForLevel("kwartal", ref);
  const rokPeriod = periodForLevel("rok", ref);
  const [initialPlan, parentPlan] = await Promise.all([
    fetchPlan("kwartal", start),
    fetchPlan("rok", rokPeriod.start),
  ]);

  const today = new Date();
  const todayQuarter = periodForLevel("kwartal", today);
  const isCurrentPeriod = start === todayQuarter.start;

  return (
    <BoldV1PlanLevelClient
      level="kwartal"
      periodStart={start}
      periodEnd={end}
      periodLabel={formatPeriodLabel("kwartal", ref)}
      initialPlan={initialPlan}
      bulletsMax={4}
      copy={{
        title: "Plan kwartalny",
        headlinePlaceholder: "Główny focus kwartału — jedno zdanie",
        bulletsLabel: "Milestones",
        bulletsHint: "2–4 mierzalne rezultaty na koniec kwartału. Jak ten Q wpisuje się w plan roku?",
        bulletsPlaceholder: "",
      }}
      prevHref={`/v/bold-v1/plan/kwartal?date=${addQuarters(start, -1)}`}
      nextHref={`/v/bold-v1/plan/kwartal?date=${addQuarters(start, 1)}`}
      todayHref="/v/bold-v1/plan/kwartal"
      isCurrentPeriod={isCurrentPeriod}
      parentPlan={parentPlan}
      parentLabel={`Plan roczny ${rokPeriod.start.slice(0, 4)}`}
    />
  );
}
