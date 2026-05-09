import { fetchEntry } from "@/lib/supabase/entries";
import { fetchPlan } from "@/lib/supabase/plans";
import { startOfWeek, endOfWeek, getISOWeekParts, formatPeriodLabel } from "@/lib/date/period";
import { BoldV1EksportTydzienClient, type RawDay } from "./EksportTydzienClient";

export const dynamic = "force-dynamic";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(start: Date, days: number): Date {
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

export default async function BoldV1EksportTydzienPage() {
  const ref = new Date();
  const monday = startOfWeek(ref);
  const sunday = endOfWeek(ref);
  const mondayStr = toDateStr(monday);
  const sundayStr = toDateStr(sunday);
  const weekLabel = formatPeriodLabel("tydzien", ref);
  const { isoYear, isoWeek } = getISOWeekParts(ref);

  const dates: string[] = Array.from({ length: 7 }, (_, i) => toDateStr(addDays(monday, i)));

  const fetched = await Promise.all(
    dates.map((date) =>
      Promise.all([
        fetchEntry("checkin", date),
        fetchEntry("checkout", date),
        fetchEntry("quick_tick", date),
        fetchPlan("dzien", date),
      ])
    )
  );

  const weekPlan = await fetchPlan("tydzien", mondayStr);

  const rawDays: RawDay[] = dates.map((date, idx) => {
    const [checkin, checkout, quickTick, dayPlan] = fetched[idx];
    return {
      date,
      checkInCt: checkin?.ciphertext ?? null,
      checkOutCt: checkout?.ciphertext ?? null,
      quickTickCt: quickTick?.ciphertext ?? null,
      dayPlanCt: dayPlan?.ciphertext ?? null,
    };
  });

  return (
    <BoldV1EksportTydzienClient
      isoYear={isoYear}
      isoWeek={isoWeek}
      weekLabel={weekLabel}
      mondayDate={mondayStr}
      sundayDate={sundayStr}
      rawDays={rawDays}
      weekPlanCt={weekPlan?.ciphertext ?? null}
    />
  );
}
