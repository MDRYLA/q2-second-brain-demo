// Wcześniej shared lib/components importowały typy z @/app/v/bold-v1/plan/tydzien/TydzienPlanClient
// — kruche coupling. Teraz źródło prawdy dla typów planu tygodnia.
//
// Identyczne struktury w bold-v1 + chrome-v2 wariantach — re-export z TydzienPlanClient.

import type { TaskStatus } from "@/lib/plan/task-status";

export type TaskQuadrant = "q1" | "q2" | "q3" | "q4" | null;
export type SharpenSawDim = "physical" | "mental" | "social" | "spiritual" | null;

export interface TaskNoteEntry {
  id: string;
  text: string;
  timestamp: string;
  status?: TaskStatus;
}

export interface TydzienTask {
  id: string;
  text: string;
  done?: boolean;
  status?: TaskStatus;
  startTime?: string;
  endTime?: string;
  note?: string;
  notes?: TaskNoteEntry[];
  weeklyPriority?: "P1" | "P2" | "P3" | "P4" | "P5" | null;
  weeklyPriorityCompletion?: "partial" | "full";
  quadrant?: TaskQuadrant;
  sharpenSawDimension?: SharpenSawDim;
  sharpenSawTaskRef?: string | null;
  sharpenSawCompletion?: "partial" | "full";
  /** @deprecated sesja 19 — duplikat z startTime/endTime time-blocking. */
  durationMinutes?: 15 | 30 | 60 | 120;
}

export interface SharpenSawDimensions {
  physical: string;
  mental: string;
  social: string;
  spiritual: string;
}

export interface SharpenSawPlanned {
  physical: boolean;
  mental: boolean;
  social: boolean;
  spiritual: boolean;
}

export interface SharpenSawStatusMap {
  physical?: TaskStatus | null;
  mental?: TaskStatus | null;
  social?: TaskStatus | null;
  spiritual?: TaskStatus | null;
}

export interface SharpenSawTasksMap {
  physical?: TydzienTask[];
  mental?: TydzienTask[];
  social?: TydzienTask[];
  spiritual?: TydzienTask[];
}

export type WeeklyCutStatus = "frozen" | "returned" | "continuing" | null;
export interface WeeklyCut {
  activity: string;
  reason: string;
  status: WeeklyCutStatus;
}

export type OtherTaskQuadrant = "q1" | "q3" | "q4" | null;
export interface OtherTaskItem {
  text: string;
  quadrant: OtherTaskQuadrant;
  status?: TaskStatus;
  notes?: TaskNoteEntry[];
}

export type WeeklyRole = "bliska" | "tworca" | "sportowiec" | "przyszlosc";
export const WEEKLY_ROLE_LABELS: Record<WeeklyRole, string> = {
  bliska: "Bliska Osoba",
  tworca: "Twórca",
  sportowiec: "Sportowiec",
  przyszlosc: "Przyszłość",
};

export interface TydzienPlanData {
  theme: string;
  priorities: string[];
  priorityRoles?: (WeeklyRole | null)[];
  prioritiesStatus?: (TaskStatus | null)[];
  prioritiesNotes?: TaskNoteEntry[][];
  otherTasks: string[];
  otherTasksV2?: OtherTaskItem[];
  days: TydzienTask[][];
  notes: string;
  sharpenSaw?: SharpenSawDimensions;
  sharpenSawPlanned?: SharpenSawPlanned;
  sharpenSawStatus?: SharpenSawStatusMap;
  sharpenSawTasks?: SharpenSawTasksMap;
  weeklyCut?: WeeklyCut;
  closingObstacles?: string;
  closingChange?: string;
}
