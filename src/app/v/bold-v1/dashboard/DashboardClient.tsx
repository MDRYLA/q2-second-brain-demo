"use client";

import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { BoldV1PassphraseGate } from "@/components/v/bold-v1/PassphraseGate";
import { DayMiniGrid } from "@/components/DayMiniGrid";
import { DashTaskNoteRow } from "@/components/DashTaskNoteRow";
import { TaskStatusPopup } from "@/components/TaskStatusPopup";
import { TaskChips } from "@/components/TaskChips";
import { encrypt, decrypt } from "@/lib/crypto/aes";
import { saveEntry, type QuickTickFlags } from "@/lib/supabase/entries";
import { savePlan } from "@/lib/supabase/plans";
import { taskStatus, setTaskStatus, type TaskStatus } from "@/lib/plan/task-status";
import { addNote, editNote, deleteNote, getNotes } from "@/lib/plan/task-notes";
import { parseTydzienData } from "@/lib/plan/parse-tydzien";
import { parseQuotes } from "@/lib/cytaty/parse";
import type { TydzienPlanData, TydzienTask } from "@/lib/plan/tydzien-types";
import {
  FlowerStretch,
  FlowerGym,
  FlowerCycle,
  FlowerBook,
  FlowerMat,
  FlowerOther,
} from "@/components/v/bold-v1/illustrations/TickIcons";

interface Props {
  entryDate: string;
  checkInExists: boolean;
  checkOutExists: boolean;
  checkInCiphertext: string | null;
  quickTickCiphertext: string | null;
  weekPlanCiphertext: string | null;
  weekStart: string;
  weekEnd: string;
  todayIdx: number;
  cytatyCiphertext?: string | null;
  cytatySeed?: string;
}

const QUICK_TICK_ITEMS: {
  key: keyof QuickTickFlags;
  label: string;
  Icon: (p: { size?: number; className?: string }) => React.ReactElement;
}[] = [
  { key: "stretching", label: "Rozciąganie", Icon: FlowerStretch },
  { key: "gym", label: "Siłownia", Icon: FlowerGym },
  { key: "cycling", label: "Rower", Icon: FlowerCycle },
  { key: "nonFiction", label: "Czytanie non-fiction", Icon: FlowerBook },
  { key: "acupressureMat", label: "Mata akupresury", Icon: FlowerMat },
  { key: "other", label: "Inne (spacer/bieg)", Icon: FlowerOther },
];

function formatPolishDate(iso: string): string {
  const months = [
    "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
    "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
  ];
  const days = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
  const d = new Date(iso + "T12:00:00");
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

export function BoldV1DashboardClient(props: Props) {
  return (
    <BoldV1PassphraseGate>
      <BoldV1DashboardContent {...props} />
    </BoldV1PassphraseGate>
  );
}

function BoldV1DashboardContent({
  entryDate,
  checkInExists,
  checkOutExists,
  checkInCiphertext,
  quickTickCiphertext,
  weekPlanCiphertext,
  weekStart,
  weekEnd,
  todayIdx,
  cytatyCiphertext,
  cytatySeed,
}: Props) {
  const { key } = useCryptoKey();
  const [, startTransition] = useTransition();

  const morningContext = useMemo(() => {
    if (!checkInCiphertext || !key) return null;
    try {
      const plain = JSON.parse(decrypt(checkInCiphertext, key)) as {
        morningIntention?: string;
        mainPriority?: string;
      };
      const mi = (plain.morningIntention ?? "").trim();
      const mp = (plain.mainPriority ?? "").trim();
      if (!mi && !mp) return null;
      return { morningIntention: mi, mainPriority: mp };
    } catch {
      return null;
    }
  }, [checkInCiphertext, key]);

  const initialWeek = useMemo<TydzienPlanData | null>(() => {
    if (!weekPlanCiphertext || !key) return null;
    try {
      const plain = JSON.parse(decrypt(weekPlanCiphertext, key)) as Partial<TydzienPlanData>;
      return parseTydzienData(plain);
    } catch {
      return null;
    }
  }, [weekPlanCiphertext, key]);
  const [week, setWeek] = useState<TydzienPlanData | null>(initialWeek);
  useEffect(() => setWeek(initialWeek), [initialWeek]);

  const initialFlags = useMemo<QuickTickFlags>(() => {
    if (!quickTickCiphertext || !key) return {};
    try {
      const data = JSON.parse(decrypt(quickTickCiphertext, key)) as QuickTickFlags;
      if (typeof data.otherText === "string" && data.otherText && !data.otherTexts) {
        data.otherTexts = [data.otherText];
      }
      return data;
    } catch {
      return {};
    }
  }, [quickTickCiphertext, key]);
  const [flags, setFlags] = useState<QuickTickFlags>(initialFlags);
  useEffect(() => setFlags(initialFlags), [initialFlags]);

  const allQuotes = useMemo(() => {
    if (!key) return [];
    let md = "";
    if (cytatyCiphertext) {
      try {
        md = decrypt(cytatyCiphertext, key);
      } catch {
        md = cytatySeed ?? "";
      }
    } else {
      md = cytatySeed ?? "";
    }
    return md.trim() ? parseQuotes(md) : [];
  }, [cytatyCiphertext, cytatySeed, key]);

  const [quoteIdx, setQuoteIdx] = useState(0);
  useEffect(() => {
    if (allQuotes.length === 0) return;
    setQuoteIdx(Math.floor(Math.random() * allQuotes.length));
    if (allQuotes.length < 2) return;
    const interval = setInterval(() => {
      setQuoteIdx((prev) => {
        if (allQuotes.length === 1) return 0;
        let next = Math.floor(Math.random() * allQuotes.length);
        if (next === prev) next = (next + 1) % allQuotes.length;
        return next;
      });
    }, 10_000);
    return () => clearInterval(interval);
  }, [allQuotes.length]);
  const quote = allQuotes[quoteIdx] ?? null;

  const [viewedDayIdx, setViewedDayIdx] = useState<number>(todayIdx);
  const todayPlanTasks = week?.days?.[viewedDayIdx] ?? [];
  const dayDelta = viewedDayIdx - todayIdx;
  const dayLabel =
    dayDelta === 0 ? "Dzisiaj"
    : dayDelta === -1 ? "Wczoraj"
    : dayDelta === 1 ? "Jutro"
    : ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"][viewedDayIdx];

  const toggleTick = (tickKey: keyof QuickTickFlags) => {
    if (!key) return;
    const currentValue = flags[tickKey];
    const nextValue = typeof currentValue === "boolean" ? !currentValue : true;
    const next: QuickTickFlags = { ...flags, [tickKey]: nextValue };
    if (tickKey === "other" && !nextValue) next.otherText = "";
    setFlags(next);
    startTransition(async () => {
      try {
        const ciphertext = encrypt(JSON.stringify(next), key);
        const result = await saveEntry("quick_tick", entryDate, null, ciphertext);
        if (result.error) setFlags(flags);
      } catch {
        setFlags(flags);
      }
    });
  };

  const persistDayTaskMutation = (mutator: (task: TydzienTask) => TydzienTask) => (taskId: string) => {
    if (!key || !week) return;
    const next: TydzienPlanData = {
      ...week,
      days: week.days.map((arr, i) =>
        i === viewedDayIdx ? arr.map((t) => (t.id === taskId ? mutator(t) : t)) : arr,
      ),
    };
    const prevWeek = week;
    setWeek(next);
    startTransition(async () => {
      try {
        const ciphertext = encrypt(JSON.stringify(next), key);
        const result = await savePlan("tydzien", weekStart, weekEnd, ciphertext);
        if (result.error) setWeek(prevWeek);
      } catch {
        setWeek(prevWeek);
      }
    });
  };

  const [popupTaskId, setPopupTaskId] = useState<string | null>(null);
  const [popupPendingStatus, setPopupPendingStatus] = useState<TaskStatus>("todo");
  const [notesSectionExpanded, setNotesSectionExpanded] = useState<boolean>(false);

  const openStatusPopup = (taskId: string, newStatus: TaskStatus) => {
    setPopupTaskId(taskId);
    setPopupPendingStatus(newStatus);
  };
  const closeStatusPopup = () => setPopupTaskId(null);

  const savePopupStatus = (status: TaskStatus, comment: string) => {
    if (!popupTaskId) return;
    const trimmed = comment.trim();
    persistDayTaskMutation((t) => {
      let updated = setTaskStatus(t, status);
      if (trimmed) updated = addNote(updated, trimmed, status);
      return updated;
    })(popupTaskId);
    closeStatusPopup();
  };

  const editTaskNoteOnDashboard = (taskId: string, noteId: string, text: string) => {
    persistDayTaskMutation((t) => editNote(t, noteId, text))(taskId);
  };
  const deleteTaskNoteOnDashboard = (taskId: string, noteId: string) => {
    persistDayTaskMutation((t) => deleteNote(t, noteId))(taskId);
  };

  const popupTask = popupTaskId ? week?.days[viewedDayIdx]?.find((t) => t.id === popupTaskId) : null;

  // Sharpen Saw popup
  type SawDim = "physical" | "mental" | "social" | "spiritual";
  const [sawPopupDim, setSawPopupDim] = useState<SawDim | null>(null);
  const [sawPopupTaskId, setSawPopupTaskId] = useState<string | null>(null);
  const [sawPopupPendingStatus, setSawPopupPendingStatus] = useState<TaskStatus>("todo");

  const openSawStatusPopupDash = (dim: SawDim, taskId: string, newStatus: TaskStatus) => {
    setSawPopupDim(dim);
    setSawPopupTaskId(taskId);
    setSawPopupPendingStatus(newStatus);
  };
  const closeSawStatusPopupDash = () => {
    setSawPopupDim(null);
    setSawPopupTaskId(null);
  };

  const persistSawTaskMutation = (dim: SawDim, taskId: string, mutator: (t: TydzienTask) => TydzienTask) => {
    if (!key || !week) return;
    const next: TydzienPlanData = {
      ...week,
      sharpenSawTasks: {
        ...(week.sharpenSawTasks ?? {}),
        [dim]: (week.sharpenSawTasks?.[dim] ?? []).map((t) => (t.id === taskId ? mutator(t) : t)),
      },
    };
    const prevWeek = week;
    setWeek(next);
    startTransition(async () => {
      try {
        const ciphertext = encrypt(JSON.stringify(next), key);
        const result = await savePlan("tydzien", weekStart, weekEnd, ciphertext);
        if (result.error) setWeek(prevWeek);
      } catch {
        setWeek(prevWeek);
      }
    });
  };

  const saveSawPopupStatusDash = (status: TaskStatus, comment: string) => {
    if (!sawPopupDim || !sawPopupTaskId) return;
    const trimmed = comment.trim();
    persistSawTaskMutation(sawPopupDim, sawPopupTaskId, (t) => {
      let updated = setTaskStatus(t, status);
      if (trimmed) updated = addNote(updated, trimmed, status);
      return updated;
    });
    closeSawStatusPopupDash();
  };

  const sawPopupTask = sawPopupDim && sawPopupTaskId
    ? week?.sharpenSawTasks?.[sawPopupDim]?.find((t) => t.id === sawPopupTaskId) ?? null
    : null;

  // Weekly priorities + Other tasks popup
  type WeeklyPopupKind = "priority" | "other";
  const [weeklyPopupKind, setWeeklyPopupKind] = useState<WeeklyPopupKind | null>(null);
  const [weeklyPopupIdx, setWeeklyPopupIdx] = useState<number>(-1);
  const [weeklyPopupPendingStatus, setWeeklyPopupPendingStatus] = useState<TaskStatus>("todo");

  const openPriorityPopupDash = (i: number, newStatus: TaskStatus) => {
    setWeeklyPopupKind("priority");
    setWeeklyPopupIdx(i);
    setWeeklyPopupPendingStatus(newStatus);
  };
  const openOtherTaskPopupDash = (i: number, newStatus: TaskStatus) => {
    setWeeklyPopupKind("other");
    setWeeklyPopupIdx(i);
    setWeeklyPopupPendingStatus(newStatus);
  };
  const closeWeeklyPopupDash = () => {
    setWeeklyPopupKind(null);
    setWeeklyPopupIdx(-1);
  };

  const persistWeeklyMutation = (mutator: (w: TydzienPlanData) => TydzienPlanData) => {
    if (!key || !week) return;
    const next = mutator(week);
    const prevWeek = week;
    setWeek(next);
    startTransition(async () => {
      try {
        const ciphertext = encrypt(JSON.stringify(next), key);
        const result = await savePlan("tydzien", weekStart, weekEnd, ciphertext);
        if (result.error) setWeek(prevWeek);
      } catch {
        setWeek(prevWeek);
      }
    });
  };

  const saveWeeklyPopupStatusDash = (status: TaskStatus, comment: string) => {
    if (weeklyPopupKind === null || weeklyPopupIdx < 0 || !week) return;
    const trimmed = comment.trim();
    persistWeeklyMutation((w) => {
      if (weeklyPopupKind === "priority") {
        const currentStatus = w.prioritiesStatus ?? w.priorities.map(() => null);
        const padded: (TaskStatus | null)[] = w.priorities.map((_, idx) => currentStatus[idx] ?? null);
        padded[weeklyPopupIdx] = status;
        let nextNotes = w.prioritiesNotes ?? w.priorities.map(() => []);
        nextNotes = w.priorities.map((_, idx) => nextNotes?.[idx] ?? []);
        if (trimmed) {
          const newNote = {
            id: crypto.randomUUID().replace(/-/g, "").slice(0, 9),
            text: trimmed,
            timestamp: new Date().toISOString(),
            status,
          };
          nextNotes = nextNotes.map((notes, idx) =>
            idx === weeklyPopupIdx ? [...notes, newNote] : notes,
          );
        }
        return { ...w, prioritiesStatus: padded, prioritiesNotes: nextNotes };
      } else {
        const v2 = (w.otherTasksV2 ?? []).map((t, idx) => {
          if (idx !== weeklyPopupIdx) return t;
          const updated = { ...t, status };
          if (trimmed) {
            const newNote = {
              id: crypto.randomUUID().replace(/-/g, "").slice(0, 9),
              text: trimmed,
              timestamp: new Date().toISOString(),
              status,
            };
            updated.notes = [...(t.notes ?? []), newNote];
          }
          return updated;
        });
        return { ...w, otherTasksV2: v2 };
      }
    });
    closeWeeklyPopupDash();
  };

  const weeklyPopupTaskDash = (() => {
    if (!week) return null;
    if (weeklyPopupKind === "priority" && weeklyPopupIdx >= 0) {
      return {
        text: week.priorities[weeklyPopupIdx] ?? "",
        notes: week.prioritiesNotes?.[weeklyPopupIdx] ?? [],
      };
    }
    if (weeklyPopupKind === "other" && weeklyPopupIdx >= 0) {
      const item = week.otherTasksV2?.[weeklyPopupIdx];
      return { text: item?.text ?? "", notes: item?.notes ?? [] };
    }
    return null;
  })();

  const dateLabel = useMemo(() => formatPolishDate(entryDate), [entryDate]);

  return (
    <div className="bv1-form-screen">
      {/* Hero — magazine cover */}
      <section className="bv1-section bv1-hero-with-illu">
        <div>
          <div className="bv1-eyebrow" style={{ marginBottom: 8 }}>
            {dateLabel}
          </div>
          <h1 className="bv1-hero-title">Dzisiaj.</h1>
          {morningContext?.morningIntention && (
            <div className="bv1-handwritten" style={{ marginTop: 16, maxWidth: 720 }}>
              „{morningContext.morningIntention}"
            </div>
          )}
          {morningContext?.mainPriority && (
            <div style={{ marginTop: 12, color: "var(--bv1-text-muted-on-deep)", fontSize: 14 }}>
              Priorytet:{" "}
              <span style={{ color: "var(--bv1-accent-yellow)", fontWeight: 600 }}>
                {morningContext.mainPriority}
              </span>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            <span
              className="bv1-pill"
              style={{
                background: checkInExists ? "var(--bv1-accent-yellow)" : "rgba(251,248,238,0.12)",
                color: checkInExists ? "var(--bv1-text-on-card)" : "var(--bv1-text-muted-on-deep)",
              }}
            >
              {checkInExists ? "✓ Check-in" : "○ Check-in pending"}
            </span>
            <span
              className="bv1-pill"
              style={{
                background: checkOutExists ? "var(--bv1-accent-yellow)" : "rgba(251,248,238,0.12)",
                color: checkOutExists ? "var(--bv1-text-on-card)" : "var(--bv1-text-muted-on-deep)",
              }}
            >
              {checkOutExists ? "✓ Check-out" : "○ Check-out wieczorem"}
            </span>
          </div>
        </div>
        <Image
          src="/v/bold-v1/icons/tulip-glass.png"
          alt=""
          width={120}
          height={200}
          priority
          unoptimized
          className="bv1-illu-img bv1-hero-illu"
          style={{ width: 120, height: "auto" }}
        />
      </section>

      {/* Quote of the day */}
      {quote && (
        <section className="bv1-section">
          <div className="bv1-card-hero" style={{ maxWidth: 760, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                top: -22,
                right: 28,
                background: "var(--bv1-bg-card)",
                padding: 6,
                borderRadius: "50%",
                boxShadow: "var(--bv1-shadow-card)",
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 60 54" fill="none" aria-hidden>
                <path
                  d="M 30 50 C 30 50 6 36 6 20 C 6 12 12 6 20 6 C 25 6 28 9 30 13 C 32 9 35 6 40 6 C 48 6 54 12 54 20 C 54 36 30 50 30 50 Z"
                  fill="var(--bv1-accent-yellow)"
                  stroke="var(--bv1-text-on-card)"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="bv1-eyebrow" style={{ marginBottom: 12 }}>
              Cytat dnia
            </div>
            <div
              className="bv1-handwritten bv1-quote-text"
              style={{
                fontSize: "clamp(20px, 3vw, 28px)",
                lineHeight: 1.4,
                color: "var(--bv1-text-on-card)",
                marginBottom: 0,
              }}
            >
              „{quote.text}"
            </div>
          </div>
        </section>
      )}

      {/* Plan dnia — grid godzinowy 6:00-23:00 */}
      <section className="bv1-section">
        <div className="bv1-section-header">
          <h2 className="bv1-section-title">Plan dnia</h2>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div className="bv1-day-nav">
              <button
                type="button"
                className="bv1-day-nav-btn"
                onClick={() => setViewedDayIdx((d) => Math.max(0, d - 1))}
                disabled={viewedDayIdx === 0}
                aria-label="Poprzedni dzień"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="bv1-day-nav-label">{dayLabel}</span>
              <button
                type="button"
                className="bv1-day-nav-btn"
                onClick={() => setViewedDayIdx((d) => Math.min(6, d + 1))}
                disabled={viewedDayIdx === 6}
                aria-label="Następny dzień"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <Link href={"/v/bold-v1/plan/dzien" as Route} className="bv1-section-link">
              Edytuj →
            </Link>
          </div>
        </div>
        {todayPlanTasks.length === 0 ? (
          <div className="bv1-empty">
            Brak zaplanowanych zadań.{" "}
            <Link
              href={"/v/bold-v1/plan/dzien" as Route}
              style={{ color: "var(--bv1-accent-red)", fontWeight: 600 }}
            >
              Zaplanuj timeline →
            </Link>
          </div>
        ) : (
          <>
            {/* Sesja 19 post-handoff v3 — viewer komentarzy do zadań plan dnia (collapsable badge). */}
            {(() => {
              const tasksWithNotes = todayPlanTasks.filter((t) => getNotes(t).length > 0);
              if (tasksWithNotes.length === 0) return null;
              return (
                <div className="bv1-task-notes-section">
                  <button
                    type="button"
                    className="bv1-task-notes-toggle"
                    onClick={() => setNotesSectionExpanded((v) => !v)}
                    aria-expanded={notesSectionExpanded}
                  >
                    <span>Komentarze do zadań ({tasksWithNotes.length})</span>
                    <span aria-hidden>{notesSectionExpanded ? "▾" : "▸"}</span>
                  </button>
                  {notesSectionExpanded &&
                    tasksWithNotes.map((t) => (
                      <DashTaskNoteRow
                        key={`note-${t.id}`}
                        taskId={t.id}
                        taskText={t.text}
                        status={taskStatus(t)}
                        notes={getNotes(t)}
                        onEditNote={editTaskNoteOnDashboard}
                        onDeleteNote={deleteTaskNoteOnDashboard}
                      />
                    ))}
                </div>
              );
            })()}
            <DayMiniGrid
              tasks={todayPlanTasks}
              onStatusChange={openStatusPopup}
              showUntimed
            />
          </>
        )}
      </section>

      {/* Postęp tygodnia — Q2 priorytety + Inne (Q3/Q4) + Sharpen Saw, każdy z popup + multi-comment */}
      {(() => {
        const visiblePriorities = (week?.priorities ?? [])
          .map((p, i) => ({ p, i }))
          .filter(({ p }) => p.trim().length > 0);
        const visibleOther = (week?.otherTasksV2 ?? [])
          .map((t, i) => ({ t, i }))
          .filter(({ t }) => t.text.trim().length > 0);
        const sharpenSawDimensions: { dim: SawDim; label: string }[] = [
          { dim: "physical", label: "Fizyczny" },
          { dim: "mental", label: "Mentalny" },
          { dim: "social", label: "Społeczny" },
          { dim: "spiritual", label: "Duchowy" },
        ];
        const sawTasksByDim = sharpenSawDimensions
          .map(({ dim, label }) => ({ dim, label, tasks: week?.sharpenSawTasks?.[dim] ?? [] }))
          .filter((d) => d.tasks.length > 0);
        const hasAnyContent =
          visiblePriorities.length > 0 || visibleOther.length > 0 || sawTasksByDim.length > 0;

        if (!week || !hasAnyContent) return null;

        return (
          <section className="bv1-section">
            <div className="bv1-section-header">
              <h2 className="bv1-section-title">Postęp tygodnia</h2>
              <Link href={"/v/bold-v1/plan/tydzien" as Route} className="bv1-section-link">
                Edytuj →
              </Link>
            </div>

            {visiblePriorities.length > 0 && (
              <div className="bv1-weekly-block">
                <p className="bv1-weekly-block-title">Priorytety (Q2)</p>
                <ul className="bv1-weekly-list">
                  {visiblePriorities.map(({ p, i }) => {
                    const status = (week.prioritiesStatus?.[i] as TaskStatus | null) ?? "todo";
                    const priorityNotes = week.prioritiesNotes?.[i] ?? [];
                    return (
                      <li key={i} className="bv1-weekly-item">
                        <div className="bv1-weekly-item-row">
                          <TaskChips
                            status={status}
                            onChange={(s) => openPriorityPopupDash(i, s)}
                            size="sm"
                            alwaysEmit
                          />
                          <span className="bv1-weekly-text">
                            <span className="bv1-weekly-label">P{i + 1}</span>
                            {p}
                          </span>
                        </div>
                        {priorityNotes.length > 0 && (
                          <DashTaskNoteRow
                            taskId={`priority-${i}`}
                            taskText={p}
                            status={status}
                            notes={priorityNotes}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {visibleOther.length > 0 && (
              <div className="bv1-weekly-block">
                <p className="bv1-weekly-block-title">Inne zadania</p>
                <ul className="bv1-weekly-list">
                  {visibleOther.map(({ t, i }) => {
                    const status = (t.status as TaskStatus | undefined) ?? "todo";
                    const otherNotes = t.notes ?? [];
                    return (
                      <li key={i} className="bv1-weekly-item">
                        <div className="bv1-weekly-item-row">
                          <TaskChips
                            status={status}
                            onChange={(s) => openOtherTaskPopupDash(i, s)}
                            size="sm"
                            alwaysEmit
                          />
                          <span className="bv1-weekly-text">{t.text}</span>
                        </div>
                        {otherNotes.length > 0 && (
                          <DashTaskNoteRow
                            taskId={`other-${i}`}
                            taskText={t.text}
                            status={status}
                            notes={otherNotes}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {sawTasksByDim.length > 0 && (
              <div className="bv1-weekly-block">
                <p className="bv1-weekly-block-title">Ostrzenie piły</p>
                {sawTasksByDim.map(({ dim, label, tasks }) => (
                  <div key={dim} style={{ marginBottom: 8 }}>
                    <p className="bv1-weekly-saw-dim">{label}</p>
                    <ul className="bv1-weekly-list">
                      {tasks.map((task) => {
                        const status = taskStatus(task);
                        const sawNotes = getNotes(task);
                        return (
                          <li key={task.id} className="bv1-weekly-item">
                            <div className="bv1-weekly-item-row">
                              <TaskChips
                                status={status}
                                onChange={(s) => openSawStatusPopupDash(dim, task.id, s)}
                                size="sm"
                                alwaysEmit
                              />
                              <span className="bv1-weekly-text">{task.text}</span>
                            </div>
                            {sawNotes.length > 0 && (
                              <DashTaskNoteRow
                                taskId={`saw-${dim}-${task.id}`}
                                taskText={task.text}
                                status={status}
                                notes={sawNotes}
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })()}

      {/* Quick tick — aktywności z kwiatkami */}
      <section className="bv1-section">
        <div className="bv1-section-header">
          <h2 className="bv1-section-title">Co dziś zrobiłem?</h2>
          <span style={{ fontSize: 12, color: "var(--bv1-text-muted-on-deep)" }}>
            {QUICK_TICK_ITEMS.filter((it) => flags[it.key]).length} / {QUICK_TICK_ITEMS.length}
          </span>
        </div>
        <div className="bv1-tick-grid">
          {QUICK_TICK_ITEMS.map(({ key: k, label, Icon }) => {
            const checked = !!flags[k];
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggleTick(k)}
                className={`bv1-tick-item${checked ? " is-checked" : ""}`}
              >
                <span className="bv1-tick-checkbox">
                  {checked && <Check size={14} strokeWidth={3} />}
                </span>
                <Icon size={36} className="bv1-tick-icon" />
                <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick action cards — z PNG-ami Kacpra */}
      <section className="bv1-section">
        <div className="bv1-section-header">
          <h2 className="bv1-section-title">Skróty</h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {/* Faza 8 A3: 4 skróty — Zacznij dzień / Zamknij dzień / Plan dnia / Plan tygodnia.
              Plan dnia PRZED Plan tygodnia (user feedback). Journal USUNIĘTY (nie używany). */}
          <ActionCard
            href="/v/bold-v1/check-in"
            eyebrow="Rano"
            title={checkInExists ? "Edytuj check-in" : "Zacznij dzień"}
            desc={checkInExists ? "Wróć do porannego wpisu." : "Intencja, sen, energia, priorytet."}
            illu="/v/bold-v1/icons/tulip-yellow.png"
            illuW={56}
          />
          <ActionCard
            href="/v/bold-v1/check-out"
            eyebrow="Wieczorem"
            title={checkOutExists ? "Edytuj check-out" : "Zamknij dzień"}
            desc={checkOutExists ? "Dopracuj evening review." : "Co się udało, co rozproszyło."}
            illu="/v/bold-v1/icons/flower-glass.png"
            illuW={48}
          />
          <ActionCard
            href="/v/bold-v1/plan/dzien"
            eyebrow="Plan"
            title="Plan dnia"
            desc="Godziny + zadania."
            illu="/v/bold-v1/icons/flower-red.png"
            illuW={56}
          />
          <ActionCard
            href="/v/bold-v1/plan/tydzien"
            eyebrow="Plan"
            title="Plan tygodnia"
            desc="7 dni × role × priorytety."
            illu="/v/bold-v1/icons/flower-red.png"
            illuW={56}
            illuFilter="hue-rotate(60deg) saturate(1.4) brightness(1.05)"
          />
        </div>
      </section>

      {/* Footer — Faza 9 F9-2: kolor czytelny w obu skin (default zielony + Baby Blue) */}
      <section
        className="bv1-dashboard-footer"
        style={{
          marginTop: 64,
          paddingTop: 32,
          borderTop: "1px solid rgba(251,248,238,0.08)",
          textAlign: "center",
        }}
      >
        <Image
          src="/v/bold-v1/icons/tulip-yellow.png"
          alt=""
          width={64}
          height={80}
          unoptimized
          style={{ width: 64, height: "auto", margin: "0 auto" }}
        />
        <div
          className="bv1-handwritten bv1-dashboard-footer-quote"
          style={{
            fontSize: 16,
            marginTop: 12,
          }}
        >
          „Mała rzecz dziś — większa niż wielka rzecz nigdy."
        </div>
      </section>

      {/* Popup modal — zmiana statusu zadań plan dnia + comment */}
      <TaskStatusPopup
        open={popupTaskId !== null && popupTask !== null && popupTask !== undefined}
        taskText={popupTask?.text ?? ""}
        pendingStatus={popupPendingStatus}
        notes={popupTask ? getNotes(popupTask) : []}
        onSave={savePopupStatus}
        onCancel={closeStatusPopup}
        onEditNote={(noteId, text) =>
          popupTaskId && editTaskNoteOnDashboard(popupTaskId, noteId, text)
        }
        onDeleteNote={(noteId) =>
          popupTaskId && deleteTaskNoteOnDashboard(popupTaskId, noteId)
        }
      />

      {/* Popup modal — Sharpen Saw zadań */}
      <TaskStatusPopup
        open={sawPopupTaskId !== null && sawPopupTask !== null}
        taskText={sawPopupTask?.text ?? ""}
        pendingStatus={sawPopupPendingStatus}
        notes={sawPopupTask ? getNotes(sawPopupTask) : []}
        onSave={saveSawPopupStatusDash}
        onCancel={closeSawStatusPopupDash}
        onEditNote={(noteId, text) => {
          if (sawPopupDim && sawPopupTaskId) {
            persistSawTaskMutation(sawPopupDim, sawPopupTaskId, (t) => editNote(t, noteId, text));
          }
        }}
        onDeleteNote={(noteId) => {
          if (sawPopupDim && sawPopupTaskId) {
            persistSawTaskMutation(sawPopupDim, sawPopupTaskId, (t) => deleteNote(t, noteId));
          }
        }}
      />

      {/* Popup modal — Q2 priorytety + Inne zadań */}
      <TaskStatusPopup
        open={weeklyPopupKind !== null && weeklyPopupTaskDash !== null}
        taskText={weeklyPopupTaskDash?.text ?? ""}
        pendingStatus={weeklyPopupPendingStatus}
        notes={weeklyPopupTaskDash?.notes ?? []}
        onSave={saveWeeklyPopupStatusDash}
        onCancel={closeWeeklyPopupDash}
        onEditNote={(noteId, text) => {
          persistWeeklyMutation((w) => {
            if (weeklyPopupKind === "priority") {
              const arr = w.prioritiesNotes ?? [];
              const updated = arr.map((notes, idx) =>
                idx === weeklyPopupIdx ? notes.map((n) => (n.id === noteId ? { ...n, text } : n)) : notes,
              );
              return { ...w, prioritiesNotes: updated };
            }
            const v2 = (w.otherTasksV2 ?? []).map((t, idx) =>
              idx === weeklyPopupIdx
                ? { ...t, notes: (t.notes ?? []).map((n) => (n.id === noteId ? { ...n, text } : n)) }
                : t,
            );
            return { ...w, otherTasksV2: v2 };
          });
        }}
        onDeleteNote={(noteId) => {
          persistWeeklyMutation((w) => {
            if (weeklyPopupKind === "priority") {
              const arr = w.prioritiesNotes ?? [];
              const updated = arr.map((notes, idx) =>
                idx === weeklyPopupIdx ? notes.filter((n) => n.id !== noteId) : notes,
              );
              return { ...w, prioritiesNotes: updated };
            }
            const v2 = (w.otherTasksV2 ?? []).map((t, idx) =>
              idx === weeklyPopupIdx
                ? { ...t, notes: (t.notes ?? []).filter((n) => n.id !== noteId) }
                : t,
            );
            return { ...w, otherTasksV2: v2 };
          });
        }}
      />
    </div>
  );
}

function ActionCard({
  href,
  eyebrow,
  title,
  desc,
  illu,
  illuW = 56,
  illuFilter,
}: {
  href: string;
  eyebrow: string;
  title: string;
  desc: string;
  illu: string;
  illuW?: number;
  illuFilter?: string;
}) {
  return (
    <Link href={href as Route} style={{ textDecoration: "none", display: "block" }}>
      <div className="bv1-card" style={{ height: "100%", position: "relative", paddingTop: 20 }}>
        <Image
          src={illu}
          alt=""
          width={illuW}
          height={illuW}
          unoptimized
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: illuW,
            height: "auto",
            filter: illuFilter,
          }}
        />
        <div className="bv1-eyebrow" style={{ marginBottom: 8 }}>
          {eyebrow}
        </div>
        <div
          className="bv1-section-title on-card"
          style={{ marginBottom: 8, fontSize: "clamp(20px, 2.6vw, 24px)", maxWidth: "70%" }}
        >
          {title}
        </div>
        <div
          className="bv1-body-sm"
          style={{ color: "var(--bv1-text-muted)", marginBottom: 12, maxWidth: "85%" }}
        >
          {desc}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--bv1-accent-red)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Otwórz →
        </div>
      </div>
    </Link>
  );
}
