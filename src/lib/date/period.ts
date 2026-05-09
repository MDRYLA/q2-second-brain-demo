// Period helpers for cascading plans (Rok/Kwartał/Miesiąc/Tydzień/Dzień).
// All functions work on local time and return YYYY-MM-DD strings.

export type PlanLevel = "rok" | "kwartal" | "miesiac" | "tydzien" | "dzien";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** ISO week (1-53) for a given date — Monday is the first day of the week. */
function getISOWeek(date: Date): number {
  return getISOWeekParts(date).isoWeek;
}

/** ISO week + ISO year (year of the Thursday in that week — handles edge cases like 2025-12-31 → 2026-W01). */
export function getISOWeekParts(date: Date): { isoYear: number; isoWeek: number } {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1...Sun=7)
  const dayNum = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() + 4 - dayNum);
  const isoYear = d.getFullYear();
  const yearStart = new Date(isoYear, 0, 1);
  const isoWeek = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { isoYear, isoWeek };
}

/** Public re-export of week boundaries for use in pages/components. */
export { startOfWeek, endOfWeek };

/** Quarter (1-4) for a given month (0-11). */
function getQuarter(month0: number): 1 | 2 | 3 | 4 {
  return (Math.floor(month0 / 3) + 1) as 1 | 2 | 3 | 4;
}

/** Monday of the week containing `date` (or `date` itself if Monday). */
function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay() === 0 ? 7 : d.getDay(); // Sun=7, Mon=1...Sat=6
  d.setDate(d.getDate() - (day - 1));
  return d;
}

/** Sunday of the week containing `date`. */
function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  start.setDate(start.getDate() + 6);
  return start;
}

/** Returns the period boundaries (period_start, period_end) for a given level. */
export function periodForLevel(level: PlanLevel, ref: Date = new Date()): {
  start: string;
  end: string;
} {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  switch (level) {
    case "rok": {
      return { start: `${year}-01-01`, end: `${year}-12-31` };
    }
    case "kwartal": {
      const q = getQuarter(month);
      const startMonth = (q - 1) * 3;
      const endMonth = startMonth + 2;
      const endDate = new Date(year, endMonth + 1, 0).getDate();
      return {
        start: `${year}-${pad(startMonth + 1)}-01`,
        end: `${year}-${pad(endMonth + 1)}-${pad(endDate)}`,
      };
    }
    case "miesiac": {
      const endDay = new Date(year, month + 1, 0).getDate();
      return {
        start: `${year}-${pad(month + 1)}-01`,
        end: `${year}-${pad(month + 1)}-${pad(endDay)}`,
      };
    }
    case "tydzien": {
      return { start: toDateString(startOfWeek(ref)), end: toDateString(endOfWeek(ref)) };
    }
    case "dzien": {
      const s = toDateString(ref);
      return { start: s, end: s };
    }
  }
}

/** Polish display label for a period (e.g. "Tydzień 17 · 20–26 kwietnia 2026"). */
export function formatPeriodLabel(level: PlanLevel, ref: Date = new Date()): string {
  const months = [
    "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
    "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
  ];
  const year = ref.getFullYear();
  switch (level) {
    case "rok":
      return `Rok ${year}`;
    case "kwartal":
      return `Q${getQuarter(ref.getMonth())} ${year}`;
    case "miesiac":
      return `${months[ref.getMonth()]} ${year}`.replace(/^\w/, (c) => c.toUpperCase());
    case "tydzien": {
      const s = startOfWeek(ref);
      const e = endOfWeek(ref);
      const sameMonth = s.getMonth() === e.getMonth();
      const sd = `${s.getDate()}`;
      const ed = `${e.getDate()} ${months[e.getMonth()]}`;
      return sameMonth
        ? `Tydzień ${getISOWeek(ref)} · ${sd}–${ed} ${year}`
        : `Tydzień ${getISOWeek(ref)} · ${sd} ${months[s.getMonth()]} – ${ed} ${year}`;
    }
    case "dzien": {
      const days = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
      return `${days[ref.getDay()]}, ${ref.getDate()} ${months[ref.getMonth()]}`.replace(/^\w/, (c) => c.toUpperCase());
    }
  }
}

/** Days of the week (Monday-Sunday) Polish short labels. */
export const WEEK_DAYS_PL_SHORT = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"] as const;
export const WEEK_DAYS_PL_LONG = [
  "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela",
] as const;

/** dayIndex 0..6 for Monday..Sunday given a date. */
export function dayIndexMon0(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

/** Parse YYYY-MM-DD safely (returns null if invalid). Sesja 18 — używane w nawigacji /plan/tydzien i /plan/miesiac. */
export function parseISODate(iso: string | undefined | null): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(iso + "T12:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Add N weeks to a YYYY-MM-DD string (returns YYYY-MM-DD). Sesja 18 — Pomysł #18 nawigacja tygodni. */
export function addWeeks(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n * 7);
  return toDateString(d);
}

/** Add N months to a YYYY-MM-DD string, snapping to the 1st of the resulting month. Sesja 18 — Pomysł #19 nawigacja miesięcy. */
export function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(1); // avoid edge cases jak 2026-01-31 + 1m -> March (Date overflow)
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

/** Add N quarters (=3 months) to a YYYY-MM-DD, snapping do 1-stego dnia kwartału. Sesja 19 Krok 9. */
export function addQuarters(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(1);
  d.setMonth(d.getMonth() + n * 3);
  // snap to start of quarter (Jan/Apr/Jul/Oct)
  const m = d.getMonth();
  const qStartMonth = m - (m % 3);
  return `${d.getFullYear()}-${pad(qStartMonth + 1)}-01`;
}

/** Add N years to a YYYY-MM-DD, snapping do 1 stycznia. Sesja 19 Krok 9. */
export function addYears(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  return `${d.getFullYear() + n}-01-01`;
}
