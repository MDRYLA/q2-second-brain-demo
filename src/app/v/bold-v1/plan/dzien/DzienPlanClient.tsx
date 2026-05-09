"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trash2, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { BoldV1PassphraseGate } from "@/components/v/bold-v1/PassphraseGate";
import { BoldV1Hero } from "@/components/v/bold-v1/Hero";
import { TimePicker } from "@/components/TimePicker";
import { TaskChips } from "@/components/TaskChips";
import { encrypt, decrypt } from "@/lib/crypto/aes";
import { savePlan, fetchPlan } from "@/lib/supabase/plans";
import type { PlanRow } from "@/lib/supabase/plans";
import type { TydzienPlanData, TydzienTask, TaskQuadrant, SharpenSawDim } from "@/lib/plan/tydzien-types";
import { parseTydzienData } from "@/lib/plan/parse-tydzien";
import { taskStatus, setTaskStatus, type TaskStatus } from "@/lib/plan/task-status";
import { addNote as addTaskNoteHelper, editNote as editTaskNoteHelper, deleteNote as deleteTaskNoteHelper, getNotes } from "@/lib/plan/task-notes";
import { TaskStatusPopup } from "@/components/TaskStatusPopup";
import { getLogicalDateString } from "@/lib/date/day-boundary";

interface DzienNotesData {
  notes: string;
}

interface Props {
  todayDate: string;
  todayLabel: string;
  todayIdx: number;
  weekStart: string;
  weekEnd: string;
  weekPlan: PlanRow | null;
  dayPlan: PlanRow | null;
}

const HOUR_START = 6;
const HOUR_END = 23;
const HOUR_HEIGHT = 80;
const SLOT_DURATION_MINUTES = 15;
const SLOTS_PER_HOUR = 60 / SLOT_DURATION_MINUTES;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

function makeId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 9);
}

function parseTime(t?: string): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Wpis o 01:30 należy do "poprzedniego dnia" — przycisk "Dziś" musi to respektować.
function todayDateStr(): string {
  return getLogicalDateString();
}

function dateOffset(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatLabel(iso: string): string {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function dayIdxMon0(iso: string): number {
  const d = new Date(iso + "T12:00:00").getDay();
  // JS: Sun=0, Mon=1 ... Sat=6 -> Mon=0 ... Sun=6
  return (d + 6) % 7;
}

function getMondayISO(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const idx = dayIdxMon0(iso);
  d.setDate(d.getDate() - idx);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getSundayISO(iso: string): string {
  const monday = getMondayISO(iso);
  return dateOffset(monday, 6);
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function DzienContent({
  todayDate,
  weekStart,
  weekEnd,
  weekPlan,
  dayPlan,
}: Props) {
  const { key } = useCryptoKey();

  // Selected date — start with today, allow date picker for any day
  const [selDate, setSelDate] = useState<string>(todayDate);

  const parseWeek = (initial: PlanRow | null): TydzienPlanData => {
    if (!initial || !key) {
      return { theme: "", priorities: [], otherTasks: [], days: [[], [], [], [], [], [], []], notes: "" };
    }
    try {
      // Wcześniej DzienPlanClient tracił sharpenSaw / sharpenSawStatus / prioritiesStatus / priorityRoles /
      // otherTasksV2 / weeklyCut / closingObstacles przy każdym save z tego widoku.
      const plain = JSON.parse(decrypt(initial.ciphertext, key)) as Partial<TydzienPlanData>;
      return parseTydzienData(plain);
    } catch {
      return { theme: "", priorities: [], otherTasks: [], days: [[], [], [], [], [], [], []], notes: "" };
    }
  };

  const parseNotes = (initial: PlanRow | null): string => {
    if (!initial || !key) return "";
    try {
      const plain = JSON.parse(decrypt(initial.ciphertext, key)) as DzienNotesData;
      return plain.notes ?? "";
    } catch {
      return "";
    }
  };

  const [week, setWeek] = useState<TydzienPlanData>(() => parseWeek(weekPlan));
  const [activeWeekStart, setActiveWeekStart] = useState<string>(weekStart);
  const [activeWeekEnd, setActiveWeekEnd] = useState<string>(weekEnd);
  const [notes, setNotes] = useState<string>(() => parseNotes(dayPlan));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftStart, setDraftStart] = useState<string>("");
  const [draftEnd, setDraftEnd] = useState<string>("");
  const [draftText, setDraftText] = useState<string>("");
  const [draftNote, setDraftNote] = useState<string>("");
  const [draftStatus, setDraftStatus] = useState<TaskStatus>("todo");
  const [draftWeeklyPriority, setDraftWeeklyPriority] = useState<"P1" | "P2" | "P3" | "P4" | "P5" | null>(null);
  const [untimedDraft, setUntimedDraft] = useState<string>("");
  const [draftQuadrant, setDraftQuadrant] = useState<TaskQuadrant>(null);
  const [draftSharpenSawDim, setDraftSharpenSawDim] = useState<SharpenSawDim>(null);
  const [draftSawTaskRef, setDraftSawTaskRef] = useState<string | null>(null);
  const [draftSawCompletion, setDraftSawCompletion] = useState<"partial" | "full">("partial");
  const [draftWeeklyPriorityCompletion, setDraftWeeklyPriorityCompletion] = useState<"partial" | "full">("partial");

  // Liczba aktywnych priorytetów w plan tygodnia (dla dynamicznych chipów P1..PN).
  const activePrioritiesCount = (week.priorities ?? []).filter((p) => p.trim().length > 0).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  if (!key) return null;

  // When user switches selDate, reload week+notes if needed
  const switchDate = async (newDate: string) => {
    setSelDate(newDate);
    setEditingId(null);
    const newWeekStart = getMondayISO(newDate);
    const newWeekEnd = getSundayISO(newDate);
    if (newWeekStart !== activeWeekStart) {
      const fetched = await fetchPlan("tydzien", newWeekStart);
      setWeek(parseWeek(fetched));
      setActiveWeekStart(newWeekStart);
      setActiveWeekEnd(newWeekEnd);
    }
    const dayFetched = await fetchPlan("dzien", newDate);
    setNotes(parseNotes(dayFetched));
  };

  const dayIdx = dayIdxMon0(selDate);
  const tasks = week.days[dayIdx] ?? [];

  // Tasks with valid times — for grid rendering
  const timedTasks = useMemo(() => {
    return tasks
      .map((t) => ({
        ...t,
        startMin: parseTime(t.startTime),
        endMin: parseTime(t.endTime),
      }))
      .filter((t) => t.startMin !== null && t.endMin !== null && t.endMin > t.startMin)
      .sort((a, b) => (a.startMin! - b.startMin!));
  }, [tasks]);

  const untimedTasks = tasks.filter((t) => parseTime(t.startTime) === null || parseTime(t.endTime) === null);

  const persistWeek = async (next: TydzienPlanData) => {
    setError("");
    setSaving(true);
    try {
      const ciphertext = encrypt(JSON.stringify(next), key);
      const result = await savePlan("tydzien", activeWeekStart, activeWeekEnd, ciphertext);
      if (result.error) throw new Error(result.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Blad zapisu.");
    } finally {
      setSaving(false);
    }
  };

  const persistNotes = async (newNotes: string) => {
    setError("");
    setSaving(true);
    try {
      const ciphertext = encrypt(JSON.stringify({ notes: newNotes }), key);
      const result = await savePlan("dzien", selDate, selDate, ciphertext);
      if (result.error) throw new Error(result.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Blad zapisu.");
    } finally {
      setSaving(false);
    }
  };

  // Check if a proposed range overlaps with any existing timed task (excluding optional excludeId)
  const hasOverlap = (startMin: number, endMin: number, excludeId?: string): boolean => {
    return timedTasks.some(
      (t) => t.id !== excludeId && rangesOverlap(startMin, endMin, t.startMin!, t.endMin!),
    );
  };

  const beginAddSlot = (hour: number, minute: number) => {
    const startMin = hour * 60 + minute;
    const endMin = startMin + SLOT_DURATION_MINUTES;
    if (hasOverlap(startMin, endMin)) {
      setError(`Slot ${formatMinutes(startMin)}-${formatMinutes(endMin)} się nakłada — wybierz inny.`);
      return;
    }
    setError("");
    setEditingId("__new");
    setDraftStart(formatMinutes(startMin));
    setDraftEnd(formatMinutes(endMin));
    setDraftText("");
    setDraftNote("");
    setDraftStatus("todo");
    setDraftWeeklyPriority(null);
    setDraftQuadrant(null);
    setDraftSharpenSawDim(null);
    setDraftSawTaskRef(null);
    setDraftSawCompletion("partial");
    setDraftWeeklyPriorityCompletion("partial");
  };

  const beginEdit = (task: TydzienTask) => {
    setEditingId(task.id);
    setDraftStart(task.startTime ?? "");
    setDraftEnd(task.endTime ?? "");
    setDraftText(task.text);
    setDraftNote(task.note ?? "");
    setDraftStatus(taskStatus(task));
    setDraftWeeklyPriority(task.weeklyPriority ?? null);
    // żeby toggle "poza Q2" działał deterministycznie. Bez tego klik "poza Q2" gdy task ma q3/q4
    // (active state) → toggluje na null → zapis nadpisywał oryginalny q3/q4 na nic.
    const taskQuadrant: TaskQuadrant = task.quadrant ?? null;
    const mappedQuadrant: TaskQuadrant =
      taskQuadrant === "q3" || taskQuadrant === "q4" ? "q1" : taskQuadrant;
    setDraftQuadrant(mappedQuadrant);
    setDraftSharpenSawDim(task.sharpenSawDimension ?? null);
    setDraftSawTaskRef(task.sharpenSawTaskRef ?? null);
    setDraftSawCompletion(task.sharpenSawCompletion ?? "partial");
    setDraftWeeklyPriorityCompletion(task.weeklyPriorityCompletion ?? "partial");
  };

  const saveDraft = async () => {
    const sMin = parseTime(draftStart);
    const eMin = parseTime(draftEnd);
    const text = draftText.trim();
    if (!text) {
      setError("Wpisz treść zadania.");
      return;
    }
    if (sMin !== null && eMin !== null && eMin <= sMin) {
      setError("Koniec musi być po starcie.");
      return;
    }
    if (sMin !== null && eMin !== null && hasOverlap(sMin, eMin, editingId === "__new" ? undefined : editingId ?? undefined)) {
      setError("Nakłada się na inne zadanie. Wybierz inny czas.");
      return;
    }

    if (editingId === "__new") {
      const newTask: TydzienTask = {
        id: makeId(),
        text,
        done: false,
        startTime: draftStart || undefined,
        endTime: draftEnd || undefined,
        weeklyPriority: draftWeeklyPriority ?? undefined,
        weeklyPriorityCompletion: draftWeeklyPriority ? draftWeeklyPriorityCompletion : undefined,
        quadrant: draftQuadrant ?? undefined,
        sharpenSawDimension: draftSharpenSawDim ?? undefined,
        sharpenSawTaskRef: draftSawTaskRef ?? undefined,
        sharpenSawCompletion: draftSawTaskRef ? draftSawCompletion : undefined,
      };
      // gdy zadanie podpięte pod priorytet tygodniowy (P1-P5).
      let nextWeek: TydzienPlanData = {
        ...week,
        days: week.days.map((arr, i) => (i === dayIdx ? [...arr, newTask] : arr)),
      };
      if (draftWeeklyPriority) {
        const priorityIdx = Number(draftWeeklyPriority.slice(1)) - 1;
        const noteText = `📌 ${text} — ${draftWeeklyPriorityCompletion === "full" ? "całościowo" : "częściowo"}`;
        const newNote = {
          id: makeId(),
          text: noteText,
          timestamp: new Date().toISOString(),
        };
        const currentNotes = nextWeek.prioritiesNotes ?? nextWeek.priorities.map(() => []);
        const paddedNotes = nextWeek.priorities.map((_, idx) => currentNotes[idx] ?? []);
        paddedNotes[priorityIdx] = [...(paddedNotes[priorityIdx] ?? []), newNote];
        nextWeek = { ...nextWeek, prioritiesNotes: paddedNotes };
      }
      // Auto-add note do sharpenSawTask gdy zadanie podpięte (analogicznie do priorytetu).
      if (draftSawTaskRef && draftSharpenSawDim) {
        const noteText = `📌 ${text} — ${draftSawCompletion === "full" ? "całościowo" : "częściowo"}`;
        const newNote = {
          id: makeId(),
          text: noteText,
          timestamp: new Date().toISOString(),
        };
        const sawTasks = nextWeek.sharpenSawTasks?.[draftSharpenSawDim] ?? [];
        const updatedSawTasks = sawTasks.map((t) => {
          if (t.id !== draftSawTaskRef) return t;
          return { ...t, notes: [...(t.notes ?? []), newNote] };
        });
        nextWeek = {
          ...nextWeek,
          sharpenSawTasks: { ...(nextWeek.sharpenSawTasks ?? {}), [draftSharpenSawDim]: updatedSawTasks },
        };
      }
      setWeek(nextWeek);
      await persistWeek(nextWeek);
    } else if (editingId) {
      const next: TydzienPlanData = {
        ...week,
        days: week.days.map((arr, i) =>
          i === dayIdx
            ? arr.map((t) => {
                if (t.id !== editingId) return t;
                const updated = setTaskStatus(
                  {
                    ...t,
                    text,
                    startTime: draftStart || undefined,
                    endTime: draftEnd || undefined,
                    note: draftNote.trim() || undefined,
                    weeklyPriority: draftWeeklyPriority ?? undefined,
                    weeklyPriorityCompletion: draftWeeklyPriority ? draftWeeklyPriorityCompletion : undefined,
                    quadrant: draftQuadrant ?? undefined,
                    sharpenSawDimension: draftSharpenSawDim ?? undefined,
                    sharpenSawTaskRef: draftSawTaskRef ?? undefined,
                    sharpenSawCompletion: draftSawTaskRef ? draftSawCompletion : undefined,
                  },
                  draftStatus,
                );
                return updated;
              })
            : arr,
        ),
      };
      setWeek(next);
      await persistWeek(next);
    }
    setEditingId(null);
  };

  const cancelDraft = () => {
    setEditingId(null);
    setError("");
  };

  const setStatusFor = async (taskId: string, newStatus: TaskStatus) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current) return;
    const next: TydzienPlanData = {
      ...week,
      days: week.days.map((arr, i) =>
        i === dayIdx ? arr.map((t) => (t.id === taskId ? setTaskStatus(t, newStatus) : t)) : arr,
      ),
    };
    setWeek(next);
    await persistWeek(next);
  };

  const [popupTaskId, setPopupTaskId] = useState<string | null>(null);
  const [popupPendingStatus, setPopupPendingStatus] = useState<TaskStatus>("todo");

  const openStatusPopup = (taskId: string, newStatus: TaskStatus) => {
    setPopupTaskId(taskId);
    setPopupPendingStatus(newStatus);
  };

  const persistDayTaskMutation = async (taskId: string, mutator: (t: TydzienTask) => TydzienTask) => {
    const next: TydzienPlanData = {
      ...week,
      days: week.days.map((arr, i) =>
        i === dayIdx ? arr.map((t) => (t.id === taskId ? mutator(t) : t)) : arr,
      ),
    };
    setWeek(next);
    await persistWeek(next);
  };

  const savePopupStatus = async (status: TaskStatus, comment: string) => {
    if (!popupTaskId) return;
    const trimmed = comment.trim();
    await persistDayTaskMutation(popupTaskId, (t) => {
      let updated = setTaskStatus(t, status);
      if (trimmed) updated = addTaskNoteHelper(updated, trimmed, status);
      return updated;
    });
    setPopupTaskId(null);
  };

  const editPopupNote = async (noteId: string, text: string) => {
    if (!popupTaskId) return;
    await persistDayTaskMutation(popupTaskId, (t) => editTaskNoteHelper(t, noteId, text));
  };

  const deletePopupNote = async (noteId: string) => {
    if (!popupTaskId) return;
    await persistDayTaskMutation(popupTaskId, (t) => deleteTaskNoteHelper(t, noteId));
  };

  const popupTask = popupTaskId ? tasks.find((t) => t.id === popupTaskId) : null;

  const removeTask = async (taskId: string) => {
    const next: TydzienPlanData = {
      ...week,
      days: week.days.map((arr, i) => (i === dayIdx ? arr.filter((t) => t.id !== taskId) : arr)),
    };
    setWeek(next);
    if (editingId === taskId) setEditingId(null);
    await persistWeek(next);
  };

  const addUntimedTask = async () => {
    const text = untimedDraft.trim();
    if (!text) return;
    const newTask: TydzienTask = { id: makeId(), text, done: false };
    const next: TydzienPlanData = {
      ...week,
      days: week.days.map((arr, i) => (i === dayIdx ? [...arr, newTask] : arr)),
    };
    setWeek(next);
    setUntimedDraft("");
    await persistWeek(next);
  };

  // Drag&drop timeline blocks — snap do SLOT_DURATION_MINUTES, preserve duration, walidacja overlap.
  // Functional setWeek (race condition fix per code-reviewer): operuje na latest state,
  // nie na stale closure przy szybkich drag-and-drop.
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const taskId = String(active.id);
    const deltaMin = Math.round((delta.y / HOUR_HEIGHT) * 60 / SLOT_DURATION_MINUTES) * SLOT_DURATION_MINUTES;
    if (deltaMin === 0) return;

    setWeek((prev) => {
      const dayTasks = prev.days[dayIdx] ?? [];
      const task = dayTasks.find((t) => t.id === taskId);
      if (!task) return prev;
      const startMin = parseTime(task.startTime);
      const endMin = parseTime(task.endTime);
      if (startMin === null || endMin === null) return prev;

      const newStartMin = startMin + deltaMin;
      const newEndMin = endMin + deltaMin;
      const dayStart = HOUR_START * 60;
      const dayEnd = (HOUR_END + 1) * 60;

      if (newStartMin < dayStart || newEndMin > dayEnd) {
        setError(`Poza zakresem ${HOUR_START}:00-${HOUR_END + 1}:00.`);
        return prev;
      }

      // Overlap check vs latest state (excluding self)
      const overlapsLatest = dayTasks.some((t) => {
        if (t.id === taskId) return false;
        const tStart = parseTime(t.startTime);
        const tEnd = parseTime(t.endTime);
        if (tStart === null || tEnd === null) return false;
        return rangesOverlap(newStartMin, newEndMin, tStart, tEnd);
      });
      if (overlapsLatest) {
        setError("Nakłada się na inne zadanie. Wybierz inny czas.");
        return prev;
      }

      setError("");
      const next: TydzienPlanData = {
        ...prev,
        days: prev.days.map((arr, i) =>
          i === dayIdx
            ? arr.map((t) =>
                t.id === taskId
                  ? { ...t, startTime: formatMinutes(newStartMin), endTime: formatMinutes(newEndMin) }
                  : t,
              )
            : arr,
        ),
      };
      void persistWeek(next);
      return next;
    });
  };

  const totalGridHeight = (HOUR_END - HOUR_START + 1) * HOUR_HEIGHT;

  return (
    <div className="bv1-form-screen dzien-page">
      <BoldV1Hero
        eyebrow={formatLabel(selDate)}
        title="Plan dnia."
        illuSrc="/v/bold-v1/icons/flower-red.png"
      />

      <div className="dzien-date-bar">
        <button
          type="button"
          className="dzien-date-nav"
          onClick={() => switchDate(dateOffset(selDate, -1))}
          aria-label="Poprzedni dzień"
        >
          <ChevronLeft size={16} />
        </button>
        <input
          type="date"
          className="ci-input dzien-date-input"
          value={selDate}
          onChange={(e) => switchDate(e.target.value)}
        />
        <button
          type="button"
          className="dzien-date-nav"
          onClick={() => switchDate(dateOffset(selDate, 1))}
          aria-label="Następny dzień"
        >
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          className="btn-edit"
          onClick={() => switchDate(todayDateStr())}
        >
          Dziś
        </button>
      </div>

      {!weekPlan && selDate === todayDate && (
        <div className="ci-banner" style={{ marginBottom: 16 }}>
          Brak planu tygodnia.{" "}
          <Link href="/v/bold-v1/plan/tydzien" className="dash-card-link">
            Zaplanuj tydzień
          </Link>
        </div>
      )}

      {week.theme && (
        <p className="text-muted" style={{ marginBottom: 8 }}>
          <strong>Temat tygodnia:</strong> {week.theme}
        </p>
      )}

      {week.priorities.filter((p) => p.trim()).length > 0 && (
        <div className="dzien-q2-priorities">
          <div className="dzien-q2-priorities-header">
            <span className="dzien-q2-badge">Q2</span>
            <span className="text-muted">Priorytety tygodnia</span>
          </div>
          <ul className="dzien-q2-priorities-list">
            {week.priorities
              .filter((p) => p.trim())
              .map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
          </ul>
        </div>
      )}

      {/* Sesja 19 post-handoff (2026-05-06): sekcja "Bez godziny" — zadania bez konkretnej godziny, nad gridem. */}
      <div className="dzien-untimed-section">
        <div className="dzien-untimed-header">
          <span className="text-muted">Bez godziny</span>
          {untimedTasks.length > 0 && (
            <span className="dzien-untimed-count">{untimedTasks.length}</span>
          )}
        </div>
        <div className="dzien-untimed-add">
          <input
            type="text"
            className="ci-input ci-input-wide"
            placeholder="Dodaj zadanie bez konkretnej godziny..."
            value={untimedDraft}
            onChange={(e) => setUntimedDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addUntimedTask();
              }
            }}
          />
          <button
            type="button"
            className="btn-primary dzien-untimed-add-btn"
            onClick={() => void addUntimedTask()}
            disabled={!untimedDraft.trim()}
            aria-label="Dodaj zadanie bez godziny"
          >
            +
          </button>
        </div>
        {untimedTasks.length > 0 && (
          <ul className="dzien-untimed-list">
            {untimedTasks.map((task) => (
              <li key={task.id} className="dzien-untimed-item">
                <TaskChips
                  status={taskStatus(task)}
                  onChange={(s) => openStatusPopup(task.id, s)}
                  size="sm"
                />
                <span
                  className={`dzien-untimed-text${taskStatus(task) === "done" ? " dzien-untimed-text-done" : ""}`}
                  onClick={() => beginEdit(task)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      beginEdit(task);
                    }
                  }}
                >
                  {task.text}
                </span>
                <button
                  type="button"
                  className="dzien-untimed-remove"
                  onClick={() => void removeTask(task.id)}
                  aria-label="Usuń"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="dzien-grid-wrap">
          <div className="dzien-grid" style={{ height: totalGridHeight }}>
            {/* Hour gutter */}
            <div className="dzien-grid-hours">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="dzien-grid-hour-label"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Slots column (clickable empty space) */}
            <div className="dzien-grid-slots">
              {HOURS.map((h) => (
                <div key={h} className="dzien-grid-hour-row" style={{ height: HOUR_HEIGHT }}>
                  {Array.from({ length: SLOTS_PER_HOUR }).map((_, slotIdx) => {
                    const minute = slotIdx * SLOT_DURATION_MINUTES;
                    return (
                      <button
                        key={slotIdx}
                        type="button"
                        className="dzien-grid-slot"
                        onClick={() => beginAddSlot(h, minute)}
                        aria-label={`Dodaj zadanie o ${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`}
                        style={{ height: HOUR_HEIGHT / SLOTS_PER_HOUR }}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Timed tasks rendered as absolute, draggable blocks */}
              {timedTasks.map((task) => {
                const startMin = task.startMin!;
                const endMin = task.endMin!;
                const top = ((startMin - HOUR_START * 60) / 60) * HOUR_HEIGHT;
                const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
                if (top < 0 || top > totalGridHeight) return null;
                return (
                  <DraggableBlock
                    key={task.id}
                    id={task.id}
                    top={top}
                    height={height}
                    status={taskStatus(task)}
                    editing={editingId === task.id}
                    timeLabel={`${formatMinutes(startMin)}–${formatMinutes(endMin)}`}
                    text={task.text}
                    onClickEdit={() => beginEdit(task)}
                    onChangeStatus={(s) => openStatusPopup(task.id, s)}
                    onRemove={() => removeTask(task.id)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </DndContext>

      {/* Sesja 14: Edit form jako modal centered (zamiast scroll do dołu) */}
      {editingId && (
        <div
          className="dzien-edit-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelDraft();
          }}
        >
        <div className="dzien-edit-form">
          <h3 className="bv1-form-section-title">
            {editingId === "__new" ? "Nowe zadanie" : "Edycja zadania"}
          </h3>
          <div className="dzien-edit-row">
            <TimePicker value={draftStart} onChange={setDraftStart} ariaLabel="Start" />
            <span className="dzien-edit-sep">–</span>
            <TimePicker value={draftEnd} onChange={setDraftEnd} ariaLabel="Koniec" />
            <input
              type="text"
              className="ci-input ci-input-wide"
              placeholder="Treść zadania"
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveDraft();
                }
                if (e.key === "Escape") cancelDraft();
              }}
            />
          </div>
          {/* Sesja 15 N2b: status + notka tylko dla istniejących zadań (nie __new) */}
          {editingId !== "__new" && (
            <div className="dzien-edit-meta">
              <div className="dzien-edit-status-row">
                <span className="dzien-edit-status-label">Status:</span>
                <TaskChips status={draftStatus} onChange={setDraftStatus} size="sm" />
              </div>
              {(draftStatus === "partial" || draftStatus === "skipped") && (
                <textarea
                  className="dzien-edit-note"
                  placeholder="Krótka notka — dlaczego (opcjonalne)"
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                />
              )}
            </div>
          )}
          {/* Sesja 19 Krok 6 — chip P1..PN (dynamicznie z plan tygodnia, max 5).
              Krok 7 durationMinutes WYCOFANY 5.05 — duplikat z TimePicker start+end.
              5.05 user feedback: hover/title pokazuje tekst priorytetu (mobile + desktop). */}
          {activePrioritiesCount > 0 && (
            <div className="dzien-edit-meta" style={{ marginTop: 8 }}>
              <div className="dzien-edit-status-row" style={{ flexWrap: "wrap" }}>
                <span className="dzien-edit-status-label">Priorytet tygodnia:</span>
                <div className="ci-word-choice">
                  {(["P1", "P2", "P3", "P4", "P5"] as const).slice(0, activePrioritiesCount).map((p, i) => {
                    const isActive = draftWeeklyPriority === p;
                    const priorityText = (week.priorities[i] ?? "").trim();
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`ci-word-btn priority-chip-tooltip${isActive ? " active" : ""}`}
                        onClick={() => setDraftWeeklyPriority(isActive ? null : p)}
                        aria-pressed={isActive}
                        data-tooltip={priorityText || `Priorytet ${p} — pusty slot`}
                        aria-label={`${p}: ${priorityText || "(pusty)"}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Mobile-friendly: pokaż tekst wybranego priorytetu pod chipami (title attribute nie działa na touch) */}
              {draftWeeklyPriority && (() => {
                const idx = Number(draftWeeklyPriority.slice(1)) - 1;
                const text = (week.priorities[idx] ?? "").trim();
                return text ? (
                  <p className="text-muted" style={{ marginTop: 6, fontSize: 13, fontStyle: "italic" }}>
                    {draftWeeklyPriority}: „{text}”
                  </p>
                ) : null;
              })()}
              {/* Sesja 19 post-handoff v5 (2026-05-06) — toggle Częściowo/Całościowo dla priorytetu (analogicznie do Sharpen Saw). */}
              {draftWeeklyPriority && (
                <div style={{ marginTop: 8 }}>
                  <span className="dzien-edit-status-label" style={{ display: "block", marginBottom: 4 }}>
                    Stopień realizacji:
                  </span>
                  <div className="ci-word-choice">
                    <button
                      type="button"
                      className={`ci-word-btn${draftWeeklyPriorityCompletion === "partial" ? " active" : ""}`}
                      onClick={() => setDraftWeeklyPriorityCompletion("partial")}
                      aria-pressed={draftWeeklyPriorityCompletion === "partial"}
                    >
                      Częściowo
                    </button>
                    <button
                      type="button"
                      className={`ci-word-btn${draftWeeklyPriorityCompletion === "full" ? " active" : ""}`}
                      onClick={() => setDraftWeeklyPriorityCompletion("full")}
                      aria-pressed={draftWeeklyPriorityCompletion === "full"}
                    >
                      Całościowo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Sesja 19 post-handoff (2026-05-06) — tag kwadrantu Eisenhowera (Q1/Q2/Q3/Q4). */}
          {/* Sesja 19 post-handoff v5 (2026-05-06) — Kwadrant 3 chipy (Q2 / poza Q2 / nie dotyczy). */}
          <div className="dzien-edit-meta" style={{ marginTop: 8 }}>
            <div className="dzien-edit-status-row" style={{ flexWrap: "wrap" }}>
              <span className="dzien-edit-status-label">Kwadrant:</span>
              <div className="ci-word-choice">
                {(
                  [
                    ["q2", "Q2"],
                    ["other", "poza Q2"],
                    ["none", "nie dotyczy"],
                  ] as const
                ).map(([code, label]) => {
                  const isActive =
                    (code === "q2" && draftQuadrant === "q2") ||
                    (code === "other" && (draftQuadrant === "q1" || draftQuadrant === "q3" || draftQuadrant === "q4")) ||
                    (code === "none" && draftQuadrant === null);
                  return (
                    <button
                      key={code}
                      type="button"
                      className={`ci-word-btn${isActive ? " active" : ""}`}
                      onClick={() => {
                        if (code === "q2") {
                          setDraftQuadrant(isActive ? null : "q2");
                        } else if (code === "other") {
                          setDraftQuadrant(isActive ? null : "q1");
                        } else {
                          // "nie dotyczy" — clear (null)
                          setDraftQuadrant(null);
                        }
                      }}
                      aria-pressed={isActive}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Sesja 19 post-handoff v4 (2026-05-06) — Sharpen Saw: wybór wymiaru → rozwija listę
              zadań tygodnia + 'Inne' + (gdy podpięte) toggle częściowo/całościowo. */}
          <div className="dzien-edit-meta" style={{ marginTop: 8 }}>
            <div className="dzien-edit-status-row" style={{ flexWrap: "wrap" }}>
              <span className="dzien-edit-status-label">Ostrzenie piły:</span>
              <div className="ci-word-choice">
                {(
                  [
                    ["physical", "Fizyczny"],
                    ["mental", "Mentalny"],
                    ["social", "Społeczny"],
                    ["spiritual", "Duchowy"],
                  ] as const
                ).map(([dim, label]) => {
                  const isActive = draftSharpenSawDim === dim;
                  return (
                    <button
                      key={dim}
                      type="button"
                      className={`ci-word-btn${isActive ? " active" : ""}`}
                      onClick={() => {
                        const newDim = isActive ? null : dim;
                        setDraftSharpenSawDim(newDim);
                        // Reset ref + completion gdy zmiana wymiaru
                        if (newDim !== draftSharpenSawDim) {
                          setDraftSawTaskRef(null);
                          setDraftSawCompletion("partial");
                        }
                      }}
                      aria-pressed={isActive}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            {draftSharpenSawDim && (
              <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: "2px solid var(--accent-dim)" }}>
                <span className="dzien-edit-status-label" style={{ display: "block", marginBottom: 6 }}>
                  Podpiąć pod zadanie z tygodnia?
                </span>
                <div className="ci-word-choice" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                  <button
                    type="button"
                    className={`ci-word-btn${draftSawTaskRef === null ? " active" : ""}`}
                    onClick={() => setDraftSawTaskRef(null)}
                    aria-pressed={draftSawTaskRef === null}
                  >
                    Inne (nie podpinaj)
                  </button>
                  {(week.sharpenSawTasks?.[draftSharpenSawDim] ?? []).map((sawTask) => {
                    const isActive = draftSawTaskRef === sawTask.id;
                    return (
                      <button
                        key={sawTask.id}
                        type="button"
                        className={`ci-word-btn${isActive ? " active" : ""}`}
                        onClick={() => setDraftSawTaskRef(isActive ? null : sawTask.id)}
                        aria-pressed={isActive}
                      >
                        {sawTask.text}
                      </button>
                    );
                  })}
                </div>
                {draftSawTaskRef && (
                  <div style={{ marginTop: 8 }}>
                    <span className="dzien-edit-status-label" style={{ display: "block", marginBottom: 4 }}>
                      Stopień realizacji:
                    </span>
                    <div className="ci-word-choice">
                      <button
                        type="button"
                        className={`ci-word-btn${draftSawCompletion === "partial" ? " active" : ""}`}
                        onClick={() => setDraftSawCompletion("partial")}
                        aria-pressed={draftSawCompletion === "partial"}
                      >
                        Częściowo
                      </button>
                      <button
                        type="button"
                        className={`ci-word-btn${draftSawCompletion === "full" ? " active" : ""}`}
                        onClick={() => setDraftSawCompletion("full")}
                        aria-pressed={draftSawCompletion === "full"}
                      >
                        Całościowo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="dzien-edit-actions">
            <button type="button" className="btn-edit" onClick={saveDraft} disabled={saving}>
              Zapisz
            </button>
            <button type="button" className="btn-edit" onClick={cancelDraft}>
              Anuluj
            </button>
          </div>
          {error && <p className="login-error" style={{ marginTop: 8 }}>{error}</p>}
        </div>
        </div>
      )}

      {/* Untimed tasks (no time slots) — sesja 11 I3: TaskChips zamiast checkbox */}
      {/* Sesja 15 F25 — Ostrzenie piły do zaplanowania (parsuje 4 wymiary z weekPlan) */}
      {(() => {
        const ss = week.sharpenSaw;
        if (!ss) return null;
        const dims: Array<[string, string]> = [
          ["Fizyczny", ss.physical ?? ""],
          ["Mentalny", ss.mental ?? ""],
          ["Społeczno-emocjonalny", ss.social ?? ""],
          ["Duchowy", ss.spiritual ?? ""],
        ];
        const parseItems = (s: string): string[] =>
          s.split(/[,\n]/).map((x) => x.trim()).filter((x) => x.length > 0);
        const allItemsByDim = dims
          .map(([label, content]) => ({ label, items: parseItems(content) }))
          .filter((d) => d.items.length > 0);
        if (allItemsByDim.length === 0) return null;
        const existingTaskTexts = new Set(tasks.map((t) => t.text.toLowerCase().trim()));
        const addItemAsTask = async (text: string) => {
          const newTask: TydzienTask = {
            id: makeId(),
            text,
            done: false,
          };
          const next: TydzienPlanData = {
            ...week,
            days: week.days.map((arr, i) => (i === dayIdx ? [...arr, newTask] : arr)),
          };
          setWeek(next);
          await persistWeek(next);
        };
        return (
          <div className="bv1-form-section">
            <h2 className="bv1-form-section-title">Ostrzenie piły — do zaplanowania</h2>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
              Pozycje z sekcji Ostrzenia piły w planie tygodnia. Kliknij &bdquo;+ dodaj do dnia&rdquo; aby przerzucić na dzisiaj.
            </p>
            <div className="sharpen-saw-day-list">
              {allItemsByDim.map(({ label, items }) => (
                <div key={label} className="sharpen-saw-day-dim">
                  <span className="sharpen-saw-day-label">{label}:</span>
                  <div className="sharpen-saw-day-items">
                    {items.map((it, idx) => {
                      const alreadyAdded = existingTaskTexts.has(it.toLowerCase());
                      return (
                        <button
                          key={`${label}-${idx}`}
                          type="button"
                          className={`sharpen-saw-day-chip${alreadyAdded ? " added" : ""}`}
                          onClick={() => !alreadyAdded && void addItemAsTask(it)}
                          disabled={alreadyAdded}
                          title={alreadyAdded ? "Już dodane do dzisiaj" : "Dodaj do dzisiaj"}
                        >
                          {alreadyAdded ? "✓ " : "+ "}{it}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Sesja 19 post-handoff (2026-05-06) — usunięto stary duplikat sekcji "Bez przypisanego czasu" pod gridem.
          Untimed tasks są obecnie w sekcji "Bez godziny" nad gridem (linia ~537, dzien-untimed-section). */}

      <div className="bv1-form-section">
        <label className="ci-field-label" htmlFor="dzien-notes">Coś ważnego do zapamiętania <span className="opt-tag">opcjonalne</span></label>
        <textarea
          id="dzien-notes"
          className="ci-textarea"
          placeholder=""
          maxLength={1500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="ci-actions" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="btn-edit"
            onClick={() => persistNotes(notes)}
            disabled={saving}
          >
            {saving ? "Zapisuję..." : "Zapisz notatkę"}
          </button>
        </div>
      </div>

      {error && !editingId && <p className="login-error" style={{ marginTop: 8 }}>{error}</p>}

      {/* Sesja 19 post-handoff v3 (2026-05-06) — popup modal do zmiany statusu zadań plan dnia. */}
      <TaskStatusPopup
        open={popupTaskId !== null && popupTask !== null && popupTask !== undefined}
        taskText={popupTask?.text ?? ""}
        pendingStatus={popupPendingStatus}
        notes={popupTask ? getNotes(popupTask) : []}
        onSave={(s, c) => void savePopupStatus(s, c)}
        onCancel={() => setPopupTaskId(null)}
        onEditNote={(noteId, text) => void editPopupNote(noteId, text)}
        onDeleteNote={(noteId) => void deletePopupNote(noteId)}
      />
    </div>
  );
}

export function BoldV1DzienPlanClient(props: Props) {
  return (
    <BoldV1PassphraseGate>
      <DzienContent {...props} />
    </BoldV1PassphraseGate>
  );
}

interface DraggableBlockProps {
  id: string;
  top: number;
  height: number;
  status: TaskStatus;
  editing: boolean;
  timeLabel: string;
  text: string;
  onClickEdit: () => void;
  onChangeStatus: (s: TaskStatus) => void;
  onRemove: () => void;
}

function DraggableBlock({
  id, top, height, status, editing, timeLabel, text,
  onClickEdit, onChangeStatus, onRemove,
}: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style: React.CSSProperties = {
    top,
    height,
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    cursor: isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  // też używały kompaktowego stylu — bez tego text "Wstać i poczytać książkę non fiction" tnie się
  // przy line-clamp:2 + padding 6px+6px = 28px netto na 2 linie (33.8px line-height) → overflow.
  const isShort = height < 50;

  return (
    <div
      ref={setNodeRef}
      className={`dzien-grid-block dzien-grid-block-${status}${editing ? " editing" : ""}${isShort ? " dzien-grid-block-short" : ""}`}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClickEdit}
    >
      <span className="dzien-grid-block-handle" aria-hidden="true">
        <GripVertical size={11} />
      </span>
      <div className="dzien-grid-block-time">{timeLabel}</div>
      <div className="dzien-grid-block-text">{text}</div>
      <div
        className="dzien-grid-block-actions"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <TaskChips status={status} onChange={onChangeStatus} size="sm" />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="dzien-grid-block-remove"
          aria-label="Usuń"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
