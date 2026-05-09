import { Suspense } from "react";
import { fetchEntry } from "@/lib/supabase/entries";
import { fetchPlan } from "@/lib/supabase/plans";
import { fetchSnapshotCiphertext } from "@/lib/supabase/snapshots";
import { getSeedContent } from "@/lib/seed/initial-content";
import { getLogicalDateString } from "@/lib/date/day-boundary";
import { periodForLevel, dayIndexMon0 } from "@/lib/date/period";
import { BoldV1DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function BoldV1DashboardPage() {
  const entryDate = getLogicalDateString();
  const ref = new Date();
  const weekPeriod = periodForLevel("tydzien", ref);
  const [checkIn, checkOut, quickTick, weekPlan, cytatyCiphertext, cytatySeed] = await Promise.all([
    fetchEntry("checkin", entryDate),
    fetchEntry("checkout", entryDate),
    fetchEntry("quick_tick", entryDate),
    fetchPlan("tydzien", weekPeriod.start),
    fetchSnapshotCiphertext("cytaty"),
    getSeedContent("cytaty"),
  ]);

  return (
    <Suspense fallback={null}>
      <BoldV1DashboardClient
        entryDate={entryDate}
        checkInExists={!!checkIn}
        checkOutExists={!!checkOut}
        checkInCiphertext={checkIn?.ciphertext ?? null}
        quickTickCiphertext={quickTick?.ciphertext ?? null}
        weekPlanCiphertext={weekPlan?.ciphertext ?? null}
        weekStart={weekPeriod.start}
        weekEnd={weekPeriod.end}
        todayIdx={dayIndexMon0(ref)}
        cytatyCiphertext={cytatyCiphertext}
        cytatySeed={cytatySeed ?? ""}
      />
    </Suspense>
  );
}
