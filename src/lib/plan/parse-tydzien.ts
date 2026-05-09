// Wcześniej DashboardClient parsował tylko 5 pól (theme/priorities/otherTasks/days/notes), zatem
// save z dashboardu (np. toggle TaskStatus) **tracił** sharpenSaw / sharpenSawStatus / prioritiesStatus /
// priorityRoles / otherTasksV2 / weeklyCut / closingObstacles / closingChange. Ten helper parsuje pełne
// dane (defensive) — używany teraz w TydzienPlanClient + DashboardClient + check-out (mirror UI).

import type { TaskStatus } from "@/lib/plan/task-status";
import type {
  TydzienPlanData,
  WeeklyRole,
  OtherTaskQuadrant,
  OtherTaskItem,
  SharpenSawDimensions,
  SharpenSawPlanned,
  SharpenSawStatusMap,
  SharpenSawTasksMap,
  WeeklyCut,
  WeeklyCutStatus,
  TydzienTask,
  TaskNoteEntry,
} from "@/lib/plan/tydzien-types";

const PRIORITIES_MAX = 5;
const PRIORITIES_DEFAULT_VISIBLE = 3;

const EMPTY_SHARPEN_SAW: SharpenSawDimensions = {
  physical: "",
  mental: "",
  social: "",
  spiritual: "",
};

const EMPTY_SHARPEN_SAW_PLANNED: SharpenSawPlanned = {
  physical: false,
  mental: false,
  social: false,
  spiritual: false,
};

const EMPTY_SHARPEN_SAW_STATUS: SharpenSawStatusMap = {
  physical: null,
  mental: null,
  social: null,
  spiritual: null,
};

const EMPTY_WEEKLY_CUT: WeeklyCut = {
  activity: "",
  reason: "",
  status: null,
};

export const EMPTY_TYDZIEN_DATA: TydzienPlanData = {
  theme: "",
  priorities: ["", "", ""],
  priorityRoles: [null, null, null],
  prioritiesStatus: [null, null, null],
  prioritiesNotes: [[], [], []],
  otherTasks: [],
  otherTasksV2: [],
  days: [[], [], [], [], [], [], []],
  notes: "",
  sharpenSaw: { ...EMPTY_SHARPEN_SAW },
  sharpenSawPlanned: { ...EMPTY_SHARPEN_SAW_PLANNED },
  sharpenSawStatus: { ...EMPTY_SHARPEN_SAW_STATUS },
  sharpenSawTasks: { physical: [], mental: [], social: [], spiritual: [] },
  weeklyCut: { ...EMPTY_WEEKLY_CUT },
  closingObstacles: "",
  closingChange: "",
};

function parseRole(r: unknown): WeeklyRole | null {
  return r === "bliska" || r === "tworca" || r === "sportowiec" || r === "przyszlosc" ? r : null;
}

function parseStatus(s: unknown): TaskStatus | null {
  return s === "todo" || s === "partial" || s === "done" || s === "skipped" ? s : null;
}

function parseQuadrant(q: unknown): OtherTaskQuadrant {
  return q === "q1" || q === "q3" || q === "q4" ? q : null;
}

function parseCutStatus(s: unknown): WeeklyCutStatus {
  return s === "frozen" || s === "returned" || s === "continuing" ? s : null;
}

// prioritiesNotes, parseTask). v3 fix: deterministyczny fallback id (legacy-{ts}-{idx}).
function parseTaskNotesEarly(raw: unknown): TaskNoteEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter((n): n is { id?: unknown; text?: unknown; timestamp?: unknown; status?: unknown } =>
      typeof n === "object" && n !== null,
    )
    .map((n, idx) => ({
      id: typeof n.id === "string" && n.id.length > 0
        ? n.id
        : `legacy-${typeof n.timestamp === "string" ? n.timestamp : "x"}-${idx}`,
      text: typeof n.text === "string" ? n.text : "",
      timestamp: typeof n.timestamp === "string" ? n.timestamp : "",
      status: parseStatus(n.status) ?? undefined,
    }))
    .filter((n) => n.text.length > 0);
}

/**
 * Parsuje pełny TydzienPlanData z dowolnego (potencjalnie legacy) JSON.
 * Wszystkie nowe pola defensywnie defaultują dla starych planów.
 */
export function parseTydzienData(plain: Partial<TydzienPlanData> | null | undefined): TydzienPlanData {
  if (!plain || typeof plain !== "object") return { ...EMPTY_TYDZIEN_DATA };

  // Priorities — sliced do MAX, pad do DEFAULT_VISIBLE.
  const incomingPriorities = Array.isArray(plain.priorities) ? plain.priorities.slice(0, PRIORITIES_MAX) : [];
  const priorities: string[] = [];
  for (let i = 0; i < Math.max(PRIORITIES_DEFAULT_VISIBLE, incomingPriorities.length); i++) {
    priorities.push(incomingPriorities[i] ?? "");
  }

  // Roles — wyrównane do priorities length.
  const incomingRoles = Array.isArray(plain.priorityRoles) ? plain.priorityRoles : [];
  const priorityRoles: (WeeklyRole | null)[] = priorities.map((_, i) => parseRole(incomingRoles[i]));

  // Statuses — wyrównane do priorities length.
  const incomingStatus = Array.isArray(plain.prioritiesStatus) ? plain.prioritiesStatus : [];
  const prioritiesStatus: (TaskStatus | null)[] = priorities.map((_, i) => parseStatus(incomingStatus[i]));

  const incomingPrioritiesNotes = Array.isArray(plain.prioritiesNotes) ? plain.prioritiesNotes : [];
  const prioritiesNotes: TaskNoteEntry[][] = priorities.map(
    (_, i) => parseTaskNotesEarly(incomingPrioritiesNotes[i]) ?? [],
  );

  // OtherTasks — V2 ma priorytet, fallback na legacy string[].
  const legacyOther = Array.isArray(plain.otherTasks) ? plain.otherTasks : [];
  const incomingV2 = Array.isArray(plain.otherTasksV2) ? plain.otherTasksV2 : [];
  const otherTasksV2: OtherTaskItem[] =
    incomingV2.length > 0
      ? incomingV2.map((item) => ({
          text: typeof item?.text === "string" ? item.text : "",
          quadrant: parseQuadrant(item?.quadrant),
          status: parseStatus(item?.status) ?? undefined,
          notes: parseTaskNotesEarly((item as Partial<OtherTaskItem>)?.notes),
        }))
      : legacyOther.map((t) => ({ text: t, quadrant: null as OtherTaskQuadrant }));

  // Sharpen saw status per dimension.
  const sharpenSawStatus: SharpenSawStatusMap = {
    physical: parseStatus(plain.sharpenSawStatus?.physical),
    mental: parseStatus(plain.sharpenSawStatus?.mental),
    social: parseStatus(plain.sharpenSawStatus?.social),
    spiritual: parseStatus(plain.sharpenSawStatus?.spiritual),
  };

  const parseTaskNotes = parseTaskNotesEarly;
  const parseTask = (raw: Partial<TydzienTask>): TydzienTask => ({
    ...(raw as TydzienTask),
    notes: parseTaskNotes(raw.notes),
  });

  return {
    theme: plain.theme ?? "",
    priorities,
    priorityRoles,
    prioritiesStatus,
    prioritiesNotes,
    otherTasks: legacyOther,
    otherTasksV2,
    days: Array.from({ length: 7 }, (_, i) => (plain.days?.[i] ?? []).map(parseTask)),
    notes: plain.notes ?? "",
    sharpenSaw: {
      physical: plain.sharpenSaw?.physical ?? "",
      mental: plain.sharpenSaw?.mental ?? "",
      social: plain.sharpenSaw?.social ?? "",
      spiritual: plain.sharpenSaw?.spiritual ?? "",
    },
    sharpenSawPlanned: {
      physical: plain.sharpenSawPlanned?.physical === true,
      mental: plain.sharpenSawPlanned?.mental === true,
      social: plain.sharpenSawPlanned?.social === true,
      spiritual: plain.sharpenSawPlanned?.spiritual === true,
    },
    sharpenSawStatus,
    sharpenSawTasks: {
      physical: Array.isArray(plain.sharpenSawTasks?.physical)
        ? plain.sharpenSawTasks.physical.map(parseTask)
        : [],
      mental: Array.isArray(plain.sharpenSawTasks?.mental)
        ? plain.sharpenSawTasks.mental.map(parseTask)
        : [],
      social: Array.isArray(plain.sharpenSawTasks?.social)
        ? plain.sharpenSawTasks.social.map(parseTask)
        : [],
      spiritual: Array.isArray(plain.sharpenSawTasks?.spiritual)
        ? plain.sharpenSawTasks.spiritual.map(parseTask)
        : [],
    } as SharpenSawTasksMap,
    weeklyCut: {
      activity: plain.weeklyCut?.activity ?? "",
      reason: plain.weeklyCut?.reason ?? "",
      status: parseCutStatus(plain.weeklyCut?.status),
    },
    closingObstacles: plain.closingObstacles ?? "",
    closingChange: plain.closingChange ?? "",
  };
}
