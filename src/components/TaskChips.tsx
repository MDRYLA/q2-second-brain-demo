"use client";

import {
  STATUS_ICONS,
  STATUS_LABELS,
  type TaskStatus,
} from "@/lib/plan/task-status";

interface Props {
  status: TaskStatus;
  onChange?: (s: TaskStatus) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
  alwaysEmit?: boolean;
}

// Default — klik na aktywny chip wraca do "todo" (toggle off, np. plan dnia bez popupu).
// alwaysEmit=true — klik aktywnego chipa emituje status ponownie (popup-driven flow:
// priorytety/Inne/Saw przez TaskStatusPopup. Drugi klik = otworz popup ponownie =
// dodaj kolejny komentarz zamiast odhaczyc).
const VISIBLE_STATUSES: TaskStatus[] = ["done", "partial", "skipped"];

export function TaskChips({
  status,
  onChange,
  readOnly = false,
  size = "md",
  alwaysEmit = false,
}: Props) {
  return (
    <div className={`task-chips task-chips-${size}`}>
      {VISIBLE_STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          disabled={readOnly}
          className={`task-chip task-chip-${s}${status === s ? " active" : ""}`}
          onClick={
            readOnly || !onChange
              ? undefined
              : () => onChange(alwaysEmit ? s : status === s ? "todo" : s)
          }
          aria-label={STATUS_LABELS[s]}
          title={STATUS_LABELS[s]}
        >
          {STATUS_ICONS[s]}
        </button>
      ))}
    </div>
  );
}
