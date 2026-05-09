// Backwards compat z starym `done: boolean` — taskStatus() helper mapuje.

export type TaskStatus = "todo" | "done" | "partial" | "skipped";

export const STATUS_VALUES = ["todo", "done", "partial", "skipped"] as const;

export const STATUS_ICONS: Record<TaskStatus, string> = {
  todo: "·",
  done: "✓",
  partial: "½",
  skipped: "✕",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Niezrobione",
  done: "Zrobione",
  partial: "W części",
  skipped: "Anulowane / nieaktualne",
};

export interface TaskWithStatus {
  done?: boolean;
  status?: string;
}

/**
 * Zwraca aktualny status zadania (backwards compat z `done: boolean`).
 * - Jesli `t.status` istnieje i jest valid → zwroc go
 * - Jesli `t.done === true` → "done"
 * - Default: "todo"
 */
export function taskStatus(t: TaskWithStatus): TaskStatus {
  if (t.status && (STATUS_VALUES as readonly string[]).includes(t.status)) {
    return t.status as TaskStatus;
  }
  if (t.done === true) return "done";
  return "todo";
}

/**
 * Zwraca nowy task z ustawionym statusem.
 * Utrzymuje `done: boolean` jako mirror dla backwards compat (stare clienty).
 */
export function setTaskStatus<T extends TaskWithStatus>(t: T, s: TaskStatus): T {
  return { ...t, status: s, done: s === "done" };
}
