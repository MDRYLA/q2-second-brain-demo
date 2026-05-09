import { fetchPlan } from "@/lib/supabase/plans";
import { periodForLevel, formatPeriodLabel, parseISODate, addYears } from "@/lib/date/period";
import { ChromeV2PlanLevelClient } from "../PlanLevelClient";

interface PageProps {
  searchParams?: Promise<{ date?: string }>;
}

export default async function ChromeV2RokPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ref = parseISODate(params?.date) ?? new Date();
  const { start, end } = periodForLevel("rok", ref);
  const initialPlan = await fetchPlan("rok", start);

  const today = new Date();
  const todayYear = `${today.getFullYear()}-01-01`;
  const isCurrentPeriod = start === todayYear;

  return (
    <ChromeV2PlanLevelClient
      level="rok"
      periodStart={start}
      periodEnd={end}
      periodLabel={formatPeriodLabel("rok", ref)}
      initialPlan={initialPlan}
      bulletsMax={5}
      copy={{
        title: "Plan roczny",
        headlinePlaceholder: "Motyw roku — jedno zdanie (np. 'Rok wdrażania, nie konsumowania')",
        bulletsLabel: "Kluczowe wyniki",
        bulletsHint: "3–5 konkretnych rezultatów (NIE emocji). Co realnie się wydarzy do końca roku?",
        bulletsPlaceholder: "",
      }}
      prevHref={`/v/chrome-v2/plan/rok?date=${addYears(start, -1)}`}
      nextHref={`/v/chrome-v2/plan/rok?date=${addYears(start, 1)}`}
      todayHref="/v/chrome-v2/plan/rok"
      isCurrentPeriod={isCurrentPeriod}
    />
  );
}
