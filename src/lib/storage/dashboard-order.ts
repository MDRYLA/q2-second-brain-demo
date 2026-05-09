// Dashboard sections order — persisted in localStorage.

export type DashSectionId =
  | "checkin-card"
  | "checkout-card"
  | "next-tasks"       // sesja 10 Plan #9 — REWORK: mini grid 6:00-23:00 (zamiast listy)
  | "weekly-progress"  // sesja 19 post-handoff (2026-05-06) — P1-P5 + sharpen saw + inne (mirror plan tygodnia)
  | "quick-tick"
  | "quick-links";

export const DEFAULT_ORDER: DashSectionId[] = [
  "checkin-card",
  "checkout-card",
  "next-tasks",
  "weekly-progress",
  "quick-tick",
  "quick-links",
];

const STORAGE_KEY = "sb-dashboard-order";
const VALID = new Set<DashSectionId>(DEFAULT_ORDER);

function isValidId(x: unknown): x is DashSectionId {
  return typeof x === "string" && VALID.has(x as DashSectionId);
}

export function getDashboardOrder(): DashSectionId[] {
  if (typeof window === "undefined") return DEFAULT_ORDER;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ORDER;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ORDER;

    const cleaned = parsed.filter(isValidId);
    // Append missing defaults (e.g. after a new section is added in code).
    for (const id of DEFAULT_ORDER) {
      if (!cleaned.includes(id)) cleaned.push(id);
    }
    return cleaned;
  } catch {
    return DEFAULT_ORDER;
  }
}

export function setDashboardOrder(order: DashSectionId[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // localStorage may be disabled (private browsing) — silently ignore.
  }
}

export function resetDashboardOrder(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
