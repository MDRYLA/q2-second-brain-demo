import { fetchPlan } from "@/lib/supabase/plans";
import { periodForLevel, formatPeriodLabel, parseISODate, addQuarters } from "@/lib/date/period";
import { ChromeV2PlanLevelClient } from "../PlanLevelClient";

interface PageProps {
  searchParams?: Promise<{ date?: string }>;
}

export default async function ChromeV2KwartalPage({ searchParams }: PageProps) {
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
    <ChromeV2PlanLevelClient
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
      prevHref={`/v/chrome-v2/plan/kwartal?date=${addQuarters(start, -1)}`}
      nextHref={`/v/chrome-v2/plan/kwartal?date=${addQuarters(start, 1)}`}
      todayHref="/v/chrome-v2/plan/kwartal"
      isCurrentPeriod={isCurrentPeriod}
      parentPlan={parentPlan}
      parentLabel={`Plan roczny ${rokPeriod.start.slice(0, 4)}`}
    />
  );
}
