// Day boundary: entries before 03:00 belong to the previous calendar day.
// Guardrail #5 from second-brain-project.md.
export const DAY_BOUNDARY_HOUR = 3;

export function getLogicalDate(now: Date = new Date()): Date {
  const d = new Date(now);
  if (d.getHours() < DAY_BOUNDARY_HOUR) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getLogicalDateString(now: Date = new Date()): string {
  const d = getLogicalDate(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
