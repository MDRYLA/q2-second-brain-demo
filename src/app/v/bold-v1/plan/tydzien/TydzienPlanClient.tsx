"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useRef } from "react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { BoldV1PassphraseGate } from "@/components/v/bold-v1/PassphraseGate";
import { BoldV1Hero } from "@/components/v/bold-v1/Hero";
import { TaskChips } from "@/components/TaskChips";
import { TagPicker } from "@/components/TagPicker";
import { TaskStatusPopup } from "@/components/TaskStatusPopup";
import { DashTaskNoteRow } from "@/components/DashTaskNoteRow";
import { addNote as addTaskNoteHelper, editNote as editTaskNoteHelper, deleteNote as deleteTaskNoteHelper, getNotes as getTaskNotes } from "@/lib/plan/task-notes";
import { parseTydzienData } from "@/lib/plan/parse-tydzien";
import { encrypt, decrypt } from "@/lib/crypto/aes";
import { savePlan } from "@/lib/supabase/plans";
import type { PlanRow } from "@/lib/supabase/plans";
import { WEEK_DAYS_PL_LONG } from "@/lib/date/period";
import { taskStatus, setTaskStatus, type TaskStatus } from "@/lib/plan/task-status";
import { useDebouncedEffect } from "@/lib/hooks/use-debounced-effect";
import { appendTag } from "@/lib/utils/text";

import type {
  TaskQuadrant,
  SharpenSawDim,
  TaskNoteEntry,
  TydzienTask,
  SharpenSawDimensions,
  SharpenSawPlanned,
  SharpenSawStatusMap,
  SharpenSawTasksMap,
  WeeklyCutStatus,
  WeeklyCut,
  OtherTaskQuadrant,
  OtherTaskItem,
  WeeklyRole,
  TydzienPlanData,
} from "@/lib/plan/tydzien-types";
import { WEEKLY_ROLE_LABELS } from "@/lib/plan/tydzien-types";


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

const EMPTY_WEEKLY_CUT: WeeklyCut = {
  activity: "",
  reason: "",
  status: null,
};

const EMPTY_SHARPEN_SAW_STATUS: SharpenSawStatusMap = {
  physical: null,
  mental: null,
  social: null,
  spiritual: null,
};

const EMPTY_DATA: TydzienPlanData = {
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

interface Props {
  periodStart: string;       // monday YYYY-MM-DD
  periodEnd: string;         // sunday YYYY-MM-DD
  periodLabel: string;
  todayIdx: number;          // 0..6 (mon=0); -1 gdy oglądamy inny tydzień (sesja 18 Pomysł #18)
  initialPlan: PlanRow | null;
  monthPlan?: PlanRow | null;    // sesja 9.5 — kaskada inheritance banner
  quarterPlan?: PlanRow | null;
  yearPlan?: PlanRow | null;
  prevWeekHref?: string;
  nextWeekHref?: string;
  isCurrentWeek?: boolean;
}

function makeId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 9);
}

function safeDecryptTheme(plan: PlanRow | null | undefined, key: Uint8Array | null): string {
  if (!plan || !key) return "";
  try {
    const plain = JSON.parse(decrypt(plan.ciphertext, key)) as { theme?: string };
    return plain.theme?.trim() ?? "";
  } catch {
    return "";
  }
}

function TydzienContent({ periodStart, periodEnd, periodLabel, todayIdx, initialPlan, monthPlan, quarterPlan, yearPlan, prevWeekHref, nextWeekHref, isCurrentWeek }: Props) {
  const { key } = useCryptoKey();

  // Wcześniej parseInitial duplikował logikę z parseTydzienData ALE bez .map(parseTask) na days[]
  // — czyli legacy task.note: string nie był migrowany do notes[] przy ładowaniu /plan/tydzien.
  const parseInitial = (): TydzienPlanData => {
    if (!initialPlan || !key) return EMPTY_DATA;
    try {
      const plain = JSON.parse(decrypt(initialPlan.ciphertext, key)) as Partial<TydzienPlanData>;
      return parseTydzienData(plain);
    } catch {
      return EMPTY_DATA;
    }
  };

  const [form, setForm] = useState<TydzienPlanData>(parseInitial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [newTaskByDay, setNewTaskByDay] = useState<string[]>(["", "", "", "", "", "", ""]);
  const isFirstRender = useRef(true);

  useDebouncedEffect(
    () => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      if (!key) return;
      void autoSave(form);
    },
    800,
    [form]
  );

  if (!key) return null;

  const setPriority = (i: number, val: string) => {
    setForm((prev) => ({
      ...prev,
      priorities: prev.priorities.map((p, idx) => (idx === i ? val : p)),
    }));
    setSaved(false);
  };

  const setPriorityRole = (i: number, role: WeeklyRole) => {
    setForm((prev) => {
      const current = prev.priorityRoles ?? prev.priorities.map(() => null);
      // wyrównaj długość roli do priorities (defensive — gdy ktoś dodał slot bez role)
      const padded = prev.priorities.map((_, idx) => current[idx] ?? null);
      padded[i] = padded[i] === role ? null : role;
      return { ...prev, priorityRoles: padded };
    });
    setSaved(false);
  };

  const setPriorityStatus = (i: number, status: TaskStatus) => {
    setForm((prev) => {
      const current = prev.prioritiesStatus ?? prev.priorities.map(() => null);
      const padded: (TaskStatus | null)[] = prev.priorities.map((_, idx) => current[idx] ?? null);
      padded[i] = status;
      return { ...prev, prioritiesStatus: padded };
    });
    setSaved(false);
  };

  const addPrioritySlot = () => {
    setForm((prev) => {
      if (prev.priorities.length >= PRIORITIES_MAX) return prev;
      const roles = prev.priorityRoles ?? prev.priorities.map(() => null);
      const statuses = prev.prioritiesStatus ?? prev.priorities.map(() => null);
      return {
        ...prev,
        priorities: [...prev.priorities, ""],
        priorityRoles: [...roles, null],
        prioritiesStatus: [...statuses, null],
      };
    });
    setSaved(false);
  };

  const removePrioritySlot = (i: number) => {
    setForm((prev) => {
      const roles = prev.priorityRoles ?? prev.priorities.map(() => null);
      const statuses = prev.prioritiesStatus ?? prev.priorities.map(() => null);
      // nie pozwól zejść poniżej domyślnej widoczności
      if (prev.priorities.length <= PRIORITIES_DEFAULT_VISIBLE) {
        return {
          ...prev,
          priorities: prev.priorities.map((p, idx) => (idx === i ? "" : p)),
          priorityRoles: roles.map((r, idx) => (idx === i ? null : r)),
          prioritiesStatus: statuses.map((s, idx) => (idx === i ? null : s)),
        };
      }
      return {
        ...prev,
        priorities: prev.priorities.filter((_, idx) => idx !== i),
        priorityRoles: roles.filter((_, idx) => idx !== i),
        prioritiesStatus: statuses.filter((_, idx) => idx !== i),
      };
    });
    setSaved(false);
  };

  const [newOtherTask, setNewOtherTask] = useState("");

  // Legacy otherTasks zostaje synced (mirror plain text) dla backwards compat zewnętrznych konsumentów.
  const addOtherTask = () => {
    const text = newOtherTask.trim();
    if (!text) return;
    setForm((prev) => {
      const v2 = [...(prev.otherTasksV2 ?? []), { text, quadrant: null as OtherTaskQuadrant }];
      return { ...prev, otherTasksV2: v2, otherTasks: v2.map((t) => t.text) };
    });
    setNewOtherTask("");
    setSaved(false);
  };

  const updateOtherTask = (i: number, val: string) => {
    setForm((prev) => {
      const v2 = (prev.otherTasksV2 ?? []).map((t, idx) => (idx === i ? { ...t, text: val } : t));
      return { ...prev, otherTasksV2: v2, otherTasks: v2.map((t) => t.text) };
    });
    setSaved(false);
  };

  const setOtherTaskQuadrant = (i: number, q: Exclude<OtherTaskQuadrant, null>) => {
    setForm((prev) => {
      const v2 = (prev.otherTasksV2 ?? []).map((t, idx) =>
        idx === i ? { ...t, quadrant: t.quadrant === q ? null : q } : t,
      );
      return { ...prev, otherTasksV2: v2 };
    });
    setSaved(false);
  };

  const setOtherTaskStatus = (i: number, status: TaskStatus) => {
    setForm((prev) => {
      const v2 = (prev.otherTasksV2 ?? []).map((t, idx) =>
        idx === i ? { ...t, status } : t,
      );
      return { ...prev, otherTasksV2: v2 };
    });
    setSaved(false);
  };

  const setSharpenSawStatus = (dim: keyof SharpenSawStatusMap, status: TaskStatus) => {
    setForm((prev) => ({
      ...prev,
      sharpenSawStatus: {
        ...(prev.sharpenSawStatus ?? EMPTY_SHARPEN_SAW_STATUS),
        [dim]: status,
      },
    }));
    setSaved(false);
  };

  type SawDim = "physical" | "mental" | "social" | "spiritual";
  const SAW_DIMS: { key: SawDim; label: string }[] = [
    { key: "physical", label: "Fizyczny" },
    { key: "mental", label: "Mentalny" },
    { key: "social", label: "Społeczno-emocjonalny" },
    { key: "spiritual", label: "Duchowy" },
  ];

  const [newSawTaskByDim, setNewSawTaskByDim] = useState<Record<SawDim, string>>({
    physical: "", mental: "", social: "", spiritual: "",
  });

  const addSharpenSawTask = (dim: SawDim) => {
    const text = newSawTaskByDim[dim].trim();
    if (!text) return;
    setForm((prev) => {
      const current = prev.sharpenSawTasks?.[dim] ?? [];
      return {
        ...prev,
        sharpenSawTasks: {
          ...(prev.sharpenSawTasks ?? {}),
          [dim]: [...current, { id: makeId(), text, done: false }],
        },
      };
    });
    setNewSawTaskByDim((prev) => ({ ...prev, [dim]: "" }));
    setSaved(false);
  };

  const removeSharpenSawTask = (dim: SawDim, taskId: string) => {
    setForm((prev) => ({
      ...prev,
      sharpenSawTasks: {
        ...(prev.sharpenSawTasks ?? {}),
        [dim]: (prev.sharpenSawTasks?.[dim] ?? []).filter((t) => t.id !== taskId),
      },
    }));
    setSaved(false);
  };

  const mutateSharpenSawTask = (dim: SawDim, taskId: string, mutator: (t: TydzienTask) => TydzienTask) => {
    setForm((prev) => ({
      ...prev,
      sharpenSawTasks: {
        ...(prev.sharpenSawTasks ?? {}),
        [dim]: (prev.sharpenSawTasks?.[dim] ?? []).map((t) => (t.id === taskId ? mutator(t) : t)),
      },
    }));
    setSaved(false);
  };

  // Popup state dla Sharpen Saw zadań (zmiana statusu z opcjonalnym komentarzem).
  const [sawPopupDim, setSawPopupDim] = useState<SawDim | null>(null);
  const [sawPopupTaskId, setSawPopupTaskId] = useState<string | null>(null);
  const [sawPopupPendingStatus, setSawPopupPendingStatus] = useState<TaskStatus>("todo");

  const openSawStatusPopup = (dim: SawDim, taskId: string, newStatus: TaskStatus) => {
    setSawPopupDim(dim);
    setSawPopupTaskId(taskId);
    setSawPopupPendingStatus(newStatus);
  };

  const closeSawStatusPopup = () => {
    setSawPopupDim(null);
    setSawPopupTaskId(null);
  };

  const saveSawPopupStatus = (status: TaskStatus, comment: string) => {
    if (!sawPopupDim || !sawPopupTaskId) return;
    const trimmed = comment.trim();
    mutateSharpenSawTask(sawPopupDim, sawPopupTaskId, (t) => {
      let updated = setTaskStatus(t, status);
      if (trimmed) updated = addTaskNoteHelper(updated, trimmed, status);
      return updated;
    });
    closeSawStatusPopup();
  };

  const sawPopupTask = sawPopupDim && sawPopupTaskId
    ? form.sharpenSawTasks?.[sawPopupDim]?.find((t) => t.id === sawPopupTaskId) ?? null
    : null;

  type WeeklyPopupKind = "priority" | "other";
  const [weeklyPopupKind, setWeeklyPopupKind] = useState<WeeklyPopupKind | null>(null);
  const [weeklyPopupIdx, setWeeklyPopupIdx] = useState<number>(-1);
  const [weeklyPopupPendingStatus, setWeeklyPopupPendingStatus] = useState<TaskStatus>("todo");

  const openPriorityPopup = (i: number, newStatus: TaskStatus) => {
    setWeeklyPopupKind("priority");
    setWeeklyPopupIdx(i);
    setWeeklyPopupPendingStatus(newStatus);
  };

  const openOtherTaskPopup = (i: number, newStatus: TaskStatus) => {
    setWeeklyPopupKind("other");
    setWeeklyPopupIdx(i);
    setWeeklyPopupPendingStatus(newStatus);
  };

  const closeWeeklyPopup = () => {
    setWeeklyPopupKind(null);
    setWeeklyPopupIdx(-1);
  };

  const saveWeeklyPopupStatus = (status: TaskStatus, comment: string) => {
    if (weeklyPopupKind === null || weeklyPopupIdx < 0) return;
    const trimmed = comment.trim();
    // Wcześniej 2 osobne setForm → debounce auto-save mógł złapać tylko jedno z 2 update'ów.
    setForm((prev) => {
      if (weeklyPopupKind === "priority") {
        const currentStatus = prev.prioritiesStatus ?? prev.priorities.map(() => null);
        const paddedStatus: (TaskStatus | null)[] = prev.priorities.map(
          (_, idx) => currentStatus[idx] ?? null,
        );
        paddedStatus[weeklyPopupIdx] = status;
        const currentNotes = prev.prioritiesNotes ?? prev.priorities.map(() => []);
        let paddedNotes: TaskNoteEntry[][] = prev.priorities.map((_, idx) => currentNotes[idx] ?? []);
        if (trimmed) {
          const newNote: TaskNoteEntry = {
            id: makeId(),
            text: trimmed,
            timestamp: new Date().toISOString(),
            status,
          };
          paddedNotes = paddedNotes.map((notes, idx) =>
            idx === weeklyPopupIdx ? [...notes, newNote] : notes,
          );
        }
        return { ...prev, prioritiesStatus: paddedStatus, prioritiesNotes: paddedNotes };
      } else {
        const v2 = (prev.otherTasksV2 ?? []).map((t, idx) => {
          if (idx !== weeklyPopupIdx) return t;
          const updated = { ...t, status };
          if (trimmed) {
            const newNote: TaskNoteEntry = {
              id: makeId(),
              text: trimmed,
              timestamp: new Date().toISOString(),
              status,
            };
            updated.notes = [...(t.notes ?? []), newNote];
          }
          return updated;
        });
        return { ...prev, otherTasksV2: v2 };
      }
    });
    setSaved(false);
    closeWeeklyPopup();
  };

  const weeklyPopupTask = (() => {
    if (weeklyPopupKind === "priority" && weeklyPopupIdx >= 0) {
      return {
        text: form.priorities[weeklyPopupIdx] ?? "",
        notes: form.prioritiesNotes?.[weeklyPopupIdx] ?? [],
      };
    }
    if (weeklyPopupKind === "other" && weeklyPopupIdx >= 0) {
      const item = form.otherTasksV2?.[weeklyPopupIdx];
      return { text: item?.text ?? "", notes: item?.notes ?? [] };
    }
    return null;
  })();

  const removeOtherTask = (i: number) => {
    setForm((prev) => {
      const v2 = (prev.otherTasksV2 ?? []).filter((_, idx) => idx !== i);
      return { ...prev, otherTasksV2: v2, otherTasks: v2.map((t) => t.text) };
    });
    setSaved(false);
  };

  const addTask = (dayIdx: number) => {
    const text = newTaskByDay[dayIdx].trim();
    if (!text) return;
    setForm((prev) => ({
      ...prev,
      days: prev.days.map((arr, i) =>
        i === dayIdx ? [...arr, { id: makeId(), text, done: false }] : arr
      ),
    }));
    setNewTaskByDay((prev) => prev.map((t, i) => (i === dayIdx ? "" : t)));
    setSaved(false);
  };

  const setTaskStatusFor = (dayIdx: number, taskId: string, newStatus: TaskStatus) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.map((arr, i) =>
        i === dayIdx
          ? arr.map((t) => (t.id === taskId ? setTaskStatus(t, newStatus) : t))
          : arr
      ),
    }));
    setSaved(false);
  };

  const removeTask = (dayIdx: number, taskId: string) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.map((arr, i) =>
        i === dayIdx ? arr.filter((t) => t.id !== taskId) : arr
      ),
    }));
    setSaved(false);
  };

  const cleanForm = (data: TydzienPlanData): TydzienPlanData => {
    const trimmedPriorities = data.priorities.map((p) => p.trim());
    const minLen = PRIORITIES_DEFAULT_VISIBLE;
    while (trimmedPriorities.length < minLen) trimmedPriorities.push("");
    const rolesIn = data.priorityRoles ?? [];
    const trimmedRoles: (WeeklyRole | null)[] = trimmedPriorities.map((_, i) => rolesIn[i] ?? null);
    const statusIn = data.prioritiesStatus ?? [];
    const trimmedStatus: (TaskStatus | null)[] = trimmedPriorities.map((_, i) => statusIn[i] ?? null);
    // wcześniej GUBIŁO te dane przy manual save → komentarze do P1-P5 tracone).
    const notesIn = data.prioritiesNotes ?? [];
    const trimmedNotes: TaskNoteEntry[][] = trimmedPriorities.map((_, i) => notesIn[i] ?? []);
    // v4 fix: zachowaj notes na każdym item (wcześniej cleanForm gubił komentarze do "Inne zadań").
    const cleanedV2 = (data.otherTasksV2 ?? [])
      .map((t) => ({ text: t.text.trim(), quadrant: t.quadrant, status: t.status, notes: t.notes }))
      .filter((t) => t.text.length > 0);
    return {
      theme: data.theme.trim(),
      priorities: trimmedPriorities,
      priorityRoles: trimmedRoles,
      prioritiesStatus: trimmedStatus,
      prioritiesNotes: trimmedNotes,
      otherTasks: cleanedV2.map((t) => t.text), // legacy mirror dla starych konsumentów
      otherTasksV2: cleanedV2,
      days: data.days.map((arr) =>
        arr
          .map((t) => ({ ...t, text: t.text.trim() }))
          .filter((t) => t.text.length > 0)
      ),
      notes: data.notes.trim(),
      sharpenSaw: data.sharpenSaw,
      sharpenSawPlanned: data.sharpenSawPlanned,
      sharpenSawStatus: data.sharpenSawStatus,
      sharpenSawTasks: data.sharpenSawTasks,
      weeklyCut: data.weeklyCut
        ? {
            activity: data.weeklyCut.activity.trim(),
            reason: data.weeklyCut.reason.trim(),
            status: data.weeklyCut.status,
          }
        : undefined,
      closingObstacles: data.closingObstacles?.trim() ?? "",
      closingChange: data.closingChange?.trim() ?? "",
    };
  };

  const hasAnyContent = (data: TydzienPlanData): boolean =>
    data.theme.length > 0 ||
    data.priorities.some((p) => p.length > 0) ||
    (data.otherTasksV2?.some((t) => t.text.length > 0) ?? false) ||
    data.otherTasks.length > 0 ||
    data.days.some((d) => d.length > 0) ||
    (data.weeklyCut?.activity.trim().length ?? 0) > 0 ||
    (data.closingObstacles?.trim().length ?? 0) > 0 ||
    (data.closingChange?.trim().length ?? 0) > 0;

  async function autoSave(data: TydzienPlanData): Promise<void> {
    if (!key) return;
    const cleaned = cleanForm(data);
    if (!hasAnyContent(cleaned)) return;
    setSaving(true);
    try {
      const ciphertext = encrypt(JSON.stringify(cleaned), key);
      const result = await savePlan("tydzien", periodStart, periodEnd, ciphertext);
      if (result.error) {
        // Silent log — auto-save nie pokazuje usere errora (toast byłby spam).
        console.error("[TydzienPlan] auto-save fail:", result.error);
      } else {
        setSaved(true);
      }
    } catch (e) {
      console.error("[TydzienPlan] auto-save exception:", e);
    } finally {
      setSaving(false);
    }
  }

  // Manualny button — force flush + walidacja + user-facing error.
  const handleSave = async () => {
    setError("");
    const cleaned = cleanForm(form);
    if (!hasAnyContent(cleaned)) {
      setError("Wpisz przynajmniej temat, priorytet lub jedno zadanie.");
      return;
    }
    setSaving(true);
    try {
      const ciphertext = encrypt(JSON.stringify(cleaned), key);
      const result = await savePlan("tydzien", periodStart, periodEnd, ciphertext);
      if (result.error) throw new Error(result.error);
      setSaved(true);
      setForm(cleaned);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd zapisu planu.");
    } finally {
      setSaving(false);
    }
  };

  // do planowania miesiąca jeszcze nie doszliśmy). Schema/decrypt zostają, tylko render OFF.
  const monthTheme = ""; // safeDecryptTheme(monthPlan, key);
  const quarterTheme = safeDecryptTheme(quarterPlan, key);
  const yearTheme = safeDecryptTheme(yearPlan, key);
  const hasInheritance = monthTheme || quarterTheme || yearTheme;

  return (
    <div className="bv1-form-screen">
      <BoldV1Hero
        eyebrow={periodLabel}
        title="Plan tygodnia."
        illuSrc="/v/bold-v1/icons/flower-red.png"
        illuFilter="hue-rotate(60deg) saturate(1.4) brightness(1.05)"
      >
        {(prevWeekHref || nextWeekHref) && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16, flexWrap: "wrap" }}>
            {prevWeekHref && (
              <Link href={prevWeekHref as Route} className="btn-edit" aria-label="Poprzedni tydzień">
                ← Poprzedni
              </Link>
            )}
            {nextWeekHref && (
              <Link href={nextWeekHref as Route} className="btn-edit" aria-label="Następny tydzień">
                Następny →
              </Link>
            )}
            {!isCurrentWeek && (
              <Link href="/v/bold-v1/plan/tydzien" className="btn-edit" aria-label="Wróć do bieżącego tygodnia">
                Dziś
              </Link>
            )}
          </div>
        )}
      </BoldV1Hero>

      {hasInheritance && (
        <div className="kaskada-banner">
          <p className="kaskada-banner-title">Kaskada — wyższe poziomy</p>
          <ul className="kaskada-banner-list">
            {yearTheme && (
              <li><strong>Rok:</strong> {yearTheme}</li>
            )}
            {quarterTheme && (
              <li><strong>Kwartał:</strong> {quarterTheme}</li>
            )}
            {monthTheme && (
              <li><strong>Miesiąc:</strong> {monthTheme}</li>
            )}
          </ul>
          <p className="kaskada-banner-hint">
            Tydzień powinien być spójny z wyższymi celami. Edytuj <a href="/v/bold-v1/plan/rok" className="dash-card-link">rok</a>
            {" / "}<a href="/v/bold-v1/plan/kwartal" className="dash-card-link">kwartał</a>
            {" / "}<a href="/v/bold-v1/plan/miesiac" className="dash-card-link">miesiąc</a> jeśli się rozjeżdża.
          </p>
        </div>
      )}

      <div className="plan-form">
        <section className="bv1-form-section">
          <label className="ci-field-label" htmlFor="tyd-theme">Temat tygodnia</label>
          <textarea
            id="tyd-theme"
            className="ci-input ci-input-wide ci-input-multiline"
            placeholder=""
            maxLength={140}
            rows={2}
            value={form.theme}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, theme: e.target.value }));
              setSaved(false);
            }}
          />
        </section>

        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Priorytety tygodnia (Q2 — ważne, niepilne)</h2>
          <ul className="plan-bullets">
            {form.priorities.map((p, i) => {
              const currentRole = form.priorityRoles?.[i] ?? null;
              const currentStatus = (form.prioritiesStatus?.[i] as TaskStatus | null) ?? "todo";
              const hasText = p.trim().length > 0;
              return (
                <li key={i} className="plan-bullet-row" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                  <span className="plan-bullet-bullet">{i + 1}.</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <textarea
                      className="ci-input ci-input-wide ci-input-multiline"
                      placeholder=""
                      value={p}
                      onChange={(e) => setPriority(i, e.target.value)}
                      maxLength={200}
                      rows={2}
                    />
                    {hasText && (
                      <>
                        <div className="ci-word-choice" style={{ marginTop: 6 }}>
                          {(Object.keys(WEEKLY_ROLE_LABELS) as WeeklyRole[]).map((role) => {
                            const isActive = currentRole === role;
                            return (
                              <button
                                key={role}
                                type="button"
                                className={`ci-word-btn${isActive ? " active" : ""}`}
                                onClick={() => setPriorityRole(i, role)}
                                aria-pressed={isActive}
                              >
                                {WEEKLY_ROLE_LABELS[role]}
                              </button>
                            );
                          })}
                        </div>
                        {/* Sesja 19 post-handoff (2026-05-06) — odhaczanie priorytetu (4-state). */}
                        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="text-muted" style={{ fontSize: 12 }}>Status:</span>
                          <TaskChips status={currentStatus} onChange={(s) => openPriorityPopup(i, s)} size="sm" alwaysEmit />
                        </div>
                        {/* Sesja 19 post-handoff v5 (2026-05-06) — DashTaskNoteRow viewer pod priorytetem. */}
                        {(form.prioritiesNotes?.[i] ?? []).length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <DashTaskNoteRow
                              taskId={`priority-${i}`}
                              taskText={p}
                              status={currentStatus}
                              notes={form.prioritiesNotes?.[i] ?? []}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {i >= PRIORITIES_DEFAULT_VISIBLE && (
                    <button
                      type="button"
                      className="plan-bullet-remove"
                      onClick={() => removePrioritySlot(i)}
                      aria-label={`Usuń priorytet ${i + 1}`}
                    >
                      ×
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {form.priorities.length < PRIORITIES_MAX && (
            <button
              type="button"
              className="btn-edit"
              onClick={addPrioritySlot}
              style={{ marginTop: 8 }}
            >
              + Dodaj kolejny priorytet
            </button>
          )}
        </section>

        <section className="bv1-form-section">
          <div className="bv1-form-section-titlebar">
            <h2 className="bv1-form-section-title">Inne zadania tygodnia</h2>
            <span className="bv1-form-section-aside">poza Q2</span>
          </div>
          <ul className="plan-bullets">
            {(form.otherTasksV2 ?? []).map((item, i) => {
              const hasText = item.text.trim().length > 0;
              const currentItemStatus = (item.status as TaskStatus | undefined) ?? "todo";
              return (
                <li key={i} className="plan-bullet-row" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                  <span className="plan-bullet-bullet">·</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <textarea
                      className="ci-input ci-input-wide ci-input-multiline"
                      value={item.text}
                      onChange={(e) => updateOtherTask(i, e.target.value)}
                      maxLength={200}
                      rows={2}
                    />
                    {hasText && (
                      <>
                        <div className="ci-word-choice" style={{ marginTop: 6 }}>
                          {(["q1", "q3", "q4"] as const).map((q) => {
                            const isActive = item.quadrant === q;
                            const label = q === "q1" ? "Q1 ważne+pilne" : q === "q3" ? "Q3 pilne (cudza)" : "Q4 ani";
                            return (
                              <button
                                key={q}
                                type="button"
                                className={`ci-word-btn${isActive ? " active" : ""}`}
                                onClick={() => setOtherTaskQuadrant(i, q)}
                                aria-pressed={isActive}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        {/* Sesja 19 post-handoff (2026-05-06) — odhaczanie zadania innego (4-state). */}
                        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="text-muted" style={{ fontSize: 12 }}>Status:</span>
                          <TaskChips status={currentItemStatus} onChange={(s) => openOtherTaskPopup(i, s)} size="sm" alwaysEmit />
                        </div>
                        {/* Sesja 19 post-handoff v5 (2026-05-06) — DashTaskNoteRow viewer pod Inne zadaniem. */}
                        {(item.notes ?? []).length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <DashTaskNoteRow
                              taskId={`other-${i}`}
                              taskText={item.text}
                              status={currentItemStatus}
                              notes={item.notes ?? []}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    className="plan-bullet-remove"
                    onClick={() => removeOtherTask(i)}
                    aria-label={`Usuń zadanie ${i + 1}`}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              type="text"
              className="ci-input ci-input-wide"
              placeholder="Dodaj zadanie…"
              value={newOtherTask}
              onChange={(e) => setNewOtherTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOtherTask();
                }
              }}
              maxLength={200}
            />
            <button type="button" className="btn-edit" onClick={addOtherTask}>
              +
            </button>
          </div>
        </section>

        {/* Sesja 19 post-handoff v3 (2026-05-06) — Ostrzenie piły jako 4 listy zadań (jak Q2 / poza Q2).
            Każdy wymiar ma multiple tasków: text + status (popup) + multi-comment + delete. */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Ostrzenie piły — odnowa w 4 wymiarach</h2>
          <div className="sharpen-saw-grid">
            {SAW_DIMS.map(({ key: dim, label }) => {
              const tasksList = form.sharpenSawTasks?.[dim] ?? [];
              return (
                <div key={dim} className="sharpen-saw-field">
                  <label className="ci-field-label" htmlFor={`ss-${dim}-input`}>{label}</label>
                  {tasksList.length > 0 && (
                    <ul className="tyd-day-tasks" style={{ marginBottom: 6 }}>
                      {tasksList.map((task) => {
                        const status = taskStatus(task);
                        const sawNotes = getTaskNotes(task);
                        return (
                          <li key={task.id} className={`tyd-task tyd-task-${status}`} style={{ flexDirection: "column", alignItems: "stretch" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <TaskChips
                                status={status}
                                onChange={(s) => openSawStatusPopup(dim, task.id, s)}
                                size="sm"
                                alwaysEmit
                              />
                              <span className="tyd-task-text" style={{ flex: 1 }}>{task.text}</span>
                              <button
                                type="button"
                                className="plan-bullet-remove"
                                onClick={() => removeSharpenSawTask(dim, task.id)}
                                aria-label="Usuń zadanie"
                              >
                                ×
                              </button>
                            </div>
                            {/* Sesja 19 post-handoff v5 (2026-05-06) — DashTaskNoteRow viewer pod Sharpen Saw zadaniem. */}
                            {sawNotes.length > 0 && (
                              <div style={{ marginTop: 6 }}>
                                <DashTaskNoteRow
                                  taskId={`saw-${dim}-${task.id}`}
                                  taskText={task.text}
                                  status={status}
                                  notes={sawNotes}
                                />
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="tyd-day-add">
                    <input
                      id={`ss-${dim}-input`}
                      type="text"
                      className="ci-input"
                      placeholder="Dodaj zadanie…"
                      value={newSawTaskByDim[dim]}
                      onChange={(e) =>
                        setNewSawTaskByDim((prev) => ({ ...prev, [dim]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSharpenSawTask(dim);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => addSharpenSawTask(dim)}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sesja 19 Krok 2 — Cuts (via negativa, R15 Kondo "zamrożenie") */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Coś co na mnie źle wpływa i chcę to zmienić</h2>
          <div className="ci-field">
            <input
              id="cut-activity"
              type="text"
              className="ci-input ci-input-wide"
              placeholder=""
              maxLength={200}
              value={form.weeklyCut?.activity ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  weeklyCut: { ...(prev.weeklyCut ?? EMPTY_WEEKLY_CUT), activity: val },
                }));
                setSaved(false);
              }}
            />
          </div>
          {(form.weeklyCut?.activity ?? "").trim() && (
            <>
              <div className="ci-field" style={{ marginTop: 8 }}>
                <label className="ci-field-label" htmlFor="cut-reason">Dlaczego kosztuje więcej niż daje</label>
                <textarea
                  id="cut-reason"
                  className="ci-textarea ci-textarea-sm"
                  rows={2}
                  maxLength={400}
                  value={form.weeklyCut?.reason ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      weeklyCut: { ...(prev.weeklyCut ?? EMPTY_WEEKLY_CUT), reason: val },
                    }));
                    setSaved(false);
                  }}
                />
              </div>
              <div className="ci-field" style={{ marginTop: 8 }}>
                <span className="ci-field-label">Status (sprawdzasz w przyszłym tygodniu)</span>
                <div className="ci-word-choice">
                  {(
                    [
                      ["frozen", "zamrażam dalej"],
                      ["returned", "wróciło"],
                      ["continuing", "nie wróciło"],
                    ] as const
                  ).map(([code, label]) => {
                    const isActive = form.weeklyCut?.status === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        className={`ci-word-btn${isActive ? " active" : ""}`}
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            weeklyCut: {
                              ...(prev.weeklyCut ?? EMPTY_WEEKLY_CUT),
                              status: isActive ? null : code,
                            },
                          }));
                          setSaved(false);
                        }}
                        aria-pressed={isActive}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>

        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Zadania per dzień</h2>

          <div className="tyd-days-grid">
            {WEEK_DAYS_PL_LONG.map((dayLabel, dayIdx) => (
              <div
                key={dayIdx}
                className={`tyd-day${dayIdx === todayIdx ? " today" : ""}`}
              >
                <div className="tyd-day-header">
                  <span className="tyd-day-name">{dayLabel}</span>
                  {dayIdx === todayIdx && <span className="tyd-day-badge">dziś</span>}
                </div>

                <ul className="tyd-day-tasks">
                  {form.days[dayIdx].map((task) => {
                    const status = taskStatus(task);
                    // (kwadrant + Sharpen Saw). Edycja przez plan dnia (modal).
                    const quadLabel: Record<Exclude<TaskQuadrant, null>, string> = {
                      q1: "Q1", q2: "Q2", q3: "Q3", q4: "Q4",
                    };
                    const sawLabel: Record<Exclude<SharpenSawDim, null>, string> = {
                      physical: "Fiz", mental: "Ment", social: "Społ", spiritual: "Duch",
                    };
                    return (
                      <li key={task.id} className={`tyd-task tyd-task-${status}`}>
                        <TaskChips
                          status={status}
                          onChange={(s) => setTaskStatusFor(dayIdx, task.id, s)}
                          size="sm"
                        />
                        <span className="tyd-task-text">
                          {task.text}
                          {task.quadrant && (
                            <span className="tyd-task-tag tyd-task-tag-q" title="Kwadrant Eisenhowera">
                              {quadLabel[task.quadrant]}
                            </span>
                          )}
                          {task.sharpenSawDimension && (
                            <span className="tyd-task-tag tyd-task-tag-saw" title="Ostrzenie piły">
                              {sawLabel[task.sharpenSawDimension]}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          className="plan-bullet-remove"
                          onClick={() => removeTask(dayIdx, task.id)}
                          aria-label="Usuń zadanie"
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="tyd-day-add">
                  <input
                    type="text"
                    className="ci-input"
                    placeholder="Dodaj zadanie…"
                    value={newTaskByDay[dayIdx]}
                    onChange={(e) =>
                      setNewTaskByDay((prev) =>
                        prev.map((t, i) => (i === dayIdx ? e.target.value : t))
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTask(dayIdx);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => addTask(dayIdx)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bv1-form-section">
          <label className="ci-field-label" htmlFor="tyd-notes">Notatki tygodnia (opcjonalne)</label>
          <textarea
            id="tyd-notes"
            className="ci-textarea"
            placeholder=""
            maxLength={2000}
            value={form.notes}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, notes: e.target.value }));
              setSaved(false);
            }}
          />
        </section>

        {error && <p className="login-error">{error}</p>}

        <div className="ci-actions">
          <button
            type="button"
            className="bv1-btn bv1-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Zapisuję…" : saved ? "Zapisano ✓" : "Zapisz plan tygodnia"}
          </button>
        </div>
      </div>

      {/* Sesja 19 post-handoff v3 (2026-05-06) — popup modal do zmiany statusu Sharpen Saw zadań. */}
      <TaskStatusPopup
        open={sawPopupTaskId !== null && sawPopupTask !== null}
        taskText={sawPopupTask?.text ?? ""}
        pendingStatus={sawPopupPendingStatus}
        notes={sawPopupTask ? getTaskNotes(sawPopupTask) : []}
        onSave={saveSawPopupStatus}
        onCancel={closeSawStatusPopup}
        onEditNote={(noteId, text) => {
          if (sawPopupDim && sawPopupTaskId) {
            mutateSharpenSawTask(sawPopupDim, sawPopupTaskId, (t) => editTaskNoteHelper(t, noteId, text));
          }
        }}
        onDeleteNote={(noteId) => {
          if (sawPopupDim && sawPopupTaskId) {
            mutateSharpenSawTask(sawPopupDim, sawPopupTaskId, (t) => deleteTaskNoteHelper(t, noteId));
          }
        }}
      />

      {/* Sesja 19 post-handoff v4 (2026-05-06) — popup dla Q2 priorytetów + Inne zadań. */}
      <TaskStatusPopup
        open={weeklyPopupKind !== null && weeklyPopupTask !== null}
        taskText={weeklyPopupTask?.text ?? ""}
        pendingStatus={weeklyPopupPendingStatus}
        notes={weeklyPopupTask?.notes ?? []}
        onSave={saveWeeklyPopupStatus}
        onCancel={closeWeeklyPopup}
        onEditNote={(noteId, text) => {
          if (weeklyPopupKind === "priority") {
            setForm((prev) => {
              const arr = prev.prioritiesNotes ?? [];
              const updated = arr.map((notes, idx) =>
                idx === weeklyPopupIdx ? notes.map((n) => (n.id === noteId ? { ...n, text } : n)) : notes,
              );
              return { ...prev, prioritiesNotes: updated };
            });
          } else if (weeklyPopupKind === "other") {
            setForm((prev) => {
              const v2 = (prev.otherTasksV2 ?? []).map((t, idx) =>
                idx === weeklyPopupIdx
                  ? { ...t, notes: (t.notes ?? []).map((n) => (n.id === noteId ? { ...n, text } : n)) }
                  : t,
              );
              return { ...prev, otherTasksV2: v2 };
            });
          }
          setSaved(false);
        }}
        onDeleteNote={(noteId) => {
          if (weeklyPopupKind === "priority") {
            setForm((prev) => {
              const arr = prev.prioritiesNotes ?? [];
              const updated = arr.map((notes, idx) =>
                idx === weeklyPopupIdx ? notes.filter((n) => n.id !== noteId) : notes,
              );
              return { ...prev, prioritiesNotes: updated };
            });
          } else if (weeklyPopupKind === "other") {
            setForm((prev) => {
              const v2 = (prev.otherTasksV2 ?? []).map((t, idx) =>
                idx === weeklyPopupIdx
                  ? { ...t, notes: (t.notes ?? []).filter((n) => n.id !== noteId) }
                  : t,
              );
              return { ...prev, otherTasksV2: v2 };
            });
          }
          setSaved(false);
        }}
      />
    </div>
  );
}

export function BoldV1TydzienPlanClient(props: Props) {
  return (
    <BoldV1PassphraseGate>
      <TydzienContent {...props} />
    </BoldV1PassphraseGate>
  );
}
