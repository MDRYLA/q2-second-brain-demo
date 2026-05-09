"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { ChromeV2PassphraseGate } from "@/components/v/chrome-v2/PassphraseGate";
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

const QUICK_TICK_ITEMS: { key: keyof QuickTickFlags; label: string }[] = [
  { key: "stretching", label: "Rozciąganie" },
  { key: "gym", label: "Siłownia" },
  { key: "cycling", label: "Rower" },
  { key: "nonFiction", label: "Czytanie non-fiction" },
  { key: "acupressureMat", label: "Mata akupresury" },
  { key: "other", label: "Inne (spacer/bieg)" },
];

function formatPolishDate(iso: string): string {
  const months = ["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia"];
  const days = ["niedziela","poniedziałek","wtorek","środa","czwartek","piątek","sobota"];
  const d = new Date(iso + "T12:00:00");
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

export function ChromeV2DashboardClient(props: Props) {
  return (
    <ChromeV2PassphraseGate>
      <ChromeV2DashboardContent {...props} />
    </ChromeV2PassphraseGate>
  );
}

function ChromeV2DashboardContent({
  entryDate, checkInExists, checkOutExists, checkInCiphertext,
  quickTickCiphertext, weekPlanCiphertext, weekStart, weekEnd, todayIdx,
  cytatyCiphertext, cytatySeed,
}: Props) {
  const { key } = useCryptoKey();
  const [, startTransition] = useTransition();

  const morningContext = useMemo(() => {
    if (!checkInCiphertext || !key) return null;
    try {
      const plain = JSON.parse(decrypt(checkInCiphertext, key)) as { morningIntention?: string; mainPriority?: string };
      const mi = (plain.morningIntention ?? "").trim();
      const mp = (plain.mainPriority ?? "").trim();
      if (!mi && !mp) return null;
      return { morningIntention: mi, mainPriority: mp };
    } catch { return null; }
  }, [checkInCiphertext, key]);

  const initialWeek = useMemo<TydzienPlanData | null>(() => {
    if (!weekPlanCiphertext || !key) return null;
    try {
      const plain = JSON.parse(decrypt(weekPlanCiphertext, key)) as Partial<TydzienPlanData>;
      return parseTydzienData(plain);
    } catch { return null; }
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
    } catch { return {}; }
  }, [quickTickCiphertext, key]);
  const [flags, setFlags] = useState<QuickTickFlags>(initialFlags);
  useEffect(() => setFlags(initialFlags), [initialFlags]);

  const allQuotes = useMemo(() => {
    if (!key) return [];
    let md = "";
    if (cytatyCiphertext) {
      try { md = decrypt(cytatyCiphertext, key); } catch { md = cytatySeed ?? ""; }
    } else { md = cytatySeed ?? ""; }
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
  const dayLabel = dayDelta === 0 ? "Dzisiaj" : dayDelta === -1 ? "Wczoraj" : dayDelta === 1 ? "Jutro" : ["Pn","Wt","Śr","Cz","Pt","So","Nd"][viewedDayIdx];

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
      } catch { setFlags(flags); }
    });
  };

  const persistDayTaskMutation = (mutator: (task: TydzienTask) => TydzienTask) => (taskId: string) => {
    if (!key || !week) return;
    const next: TydzienPlanData = {
      ...week,
      days: week.days.map((arr, i) => i === viewedDayIdx ? arr.map((t) => t.id === taskId ? mutator(t) : t) : arr),
    };
    const prevWeek = week;
    setWeek(next);
    startTransition(async () => {
      try {
        const ciphertext = encrypt(JSON.stringify(next), key);
        const result = await savePlan("tydzien", weekStart, weekEnd, ciphertext);
        if (result.error) setWeek(prevWeek);
      } catch { setWeek(prevWeek); }
    });
  };

  // Plan dnia popup state.
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
      } catch { setWeek(prevWeek); }
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
      } catch { setWeek(prevWeek); }
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
    <>
      {/* HERO — Bison Fellowship style: numbered + Cormorant italic */}
      <section style={{ marginBottom: 96 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-mono, JetBrains Mono, monospace)", fontSize: 12, color: "var(--cv2-accent-bronze)", letterSpacing: "0.10em", fontWeight: 500 }}>
            001 — {dateLabel}
          </span>
        </div>
        <h1
          className="cv2-hero-title"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: "clamp(48px, 8vw, 84px)",
            fontWeight: 500,
            lineHeight: 1.0,
            letterSpacing: "-0.025em",
            color: "var(--cv2-text-on-card)",
            marginBottom: morningContext?.morningIntention ? 24 : 16,
          }}
        >
          Pomagamy Tobie <em style={{ color: "var(--cv2-accent-bronze)" }}>budować</em> dzień.
        </h1>
        {morningContext?.morningIntention && (
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: "italic", fontSize: "clamp(18px, 2.4vw, 24px)", color: "var(--cv2-accent-bronze)", maxWidth: 720, lineHeight: 1.4, marginBottom: 12 }}>
            „{morningContext.morningIntention}"
          </div>
        )}
        {morningContext?.mainPriority && (
          <div style={{ fontSize: 15, color: "var(--cv2-text-muted)" }}>
            Priorytet:{" "}
            <span style={{ color: "var(--cv2-text-on-card)", fontWeight: 600 }}>{morningContext.mainPriority}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
          <span className="cv2-pill" style={{ fontSize: 12, padding: "6px 14px", letterSpacing: "0.04em" }}>
            {checkInExists ? "✓ Check-in" : "○ Check-in pending"}
          </span>
          <span className="cv2-pill" style={{ fontSize: 12, padding: "6px 14px", letterSpacing: "0.04em" }}>
            {checkOutExists ? "✓ Check-out" : "○ Check-out wieczorem"}
          </span>
        </div>
      </section>

      {/* SECTION 002 — CYTAT */}
      {quote && (
        <section style={{ marginBottom: 96 }}>
          <NumberedHeader number={2} label="Cytat dnia" />
          <div className="cv2-card-hero" style={{ maxWidth: 760, padding: "40px 36px" }}>
            <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: "italic", fontSize: "clamp(20px, 3vw, 28px)", lineHeight: 1.45, color: "var(--cv2-text-on-card)", marginBottom: 0 }}>
              „{quote.text}"
            </div>
          </div>
        </section>
      )}

      {/* SECTION 003 — PLAN DNIA */}
      <section style={{ marginBottom: 96 }}>
        <NumberedHeader number={3} label="Plan dnia">
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div className="cv2-day-nav">
              <button type="button" className="cv2-day-nav-btn" onClick={() => setViewedDayIdx((d) => Math.max(0, d - 1))} disabled={viewedDayIdx === 0} aria-label="Poprzedni dzień"><ChevronLeft size={14} /></button>
              <span className="cv2-day-nav-label">{dayLabel}</span>
              <button type="button" className="cv2-day-nav-btn" onClick={() => setViewedDayIdx((d) => Math.min(6, d + 1))} disabled={viewedDayIdx === 6} aria-label="Następny dzień"><ChevronRight size={14} /></button>
            </div>
            <Link href={"/v/chrome-v2/plan/dzien" as Route} className="cv2-section-link">Edytuj →</Link>
          </div>
        </NumberedHeader>
        {todayPlanTasks.length === 0 ? (
          <div className="cv2-empty">
            Brak zaplanowanych zadań.{" "}
            <Link href={"/v/chrome-v2/plan/dzien" as Route} style={{ color: "var(--cv2-accent-bronze)", fontWeight: 600 }}>Zaplanuj timeline →</Link>
          </div>
        ) : (
          <>
            {/* Komentarze do zadań — collapsable badge (Faza 6 STEP 4b) */}
            {(() => {
              const tasksWithNotes = todayPlanTasks.filter((t) => getNotes(t).length > 0);
              if (tasksWithNotes.length === 0) return null;
              return (
                <div style={{ marginBottom: 16, background: "var(--cv2-glass-bg)", backdropFilter: "blur(16px)", border: "1px solid var(--cv2-border-subtle)", borderRadius: 12, overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setNotesSectionExpanded((v) => !v)}
                    aria-expanded={notesSectionExpanded}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "transparent",
                      border: "none",
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono, JetBrains Mono, monospace)",
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: "var(--cv2-accent-bronze)",
                      cursor: "pointer",
                    }}
                  >
                    <span>Komentarze do zadań ({tasksWithNotes.length})</span>
                    <span aria-hidden>{notesSectionExpanded ? "▾" : "▸"}</span>
                  </button>
                  {notesSectionExpanded && (
                    <div style={{ padding: "0 16px 12px" }}>
                      {tasksWithNotes.map((t) => (
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
                  )}
                </div>
              );
            })()}
            <DayMiniGrid tasks={todayPlanTasks} onStatusChange={openStatusPopup} showUntimed />
          </>
        )}
      </section>

      {/* SECTION 004 — POSTĘP TYGODNIA: Q2 Priorytety + Inne (Q3/Q4) + Ostrzenie piły */}
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

        const blockTitleStyle: React.CSSProperties = {
          fontFamily: "var(--font-mono, JetBrains Mono, monospace)",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--cv2-accent-bronze)",
          margin: "0 0 12px",
        };
        const itemRowStyle: React.CSSProperties = {
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 0",
          borderBottom: "1px solid var(--cv2-border-subtle)",
        };
        const itemTextStyle: React.CSSProperties = {
          flex: 1,
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: 18,
          color: "var(--cv2-text-on-card)",
          lineHeight: 1.4,
        };
        const blockStyle: React.CSSProperties = {
          marginBottom: 32,
        };

        return (
          <section style={{ marginBottom: 96 }}>
            <NumberedHeader number={4} label="Postęp tygodnia">
              <Link href={"/v/chrome-v2/plan/tydzien" as Route} className="cv2-section-link">Edytuj →</Link>
            </NumberedHeader>

            {visiblePriorities.length > 0 && (
              <div className="cv2-card" style={blockStyle}>
                <p style={blockTitleStyle}>Priorytety (Q2)</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {visiblePriorities.map(({ p, i }) => {
                    const status = (week.prioritiesStatus?.[i] as TaskStatus | null) ?? "todo";
                    const priorityNotes = week.prioritiesNotes?.[i] ?? [];
                    return (
                      <li key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={itemRowStyle}>
                          <TaskChips
                            status={status}
                            onChange={(s) => openPriorityPopupDash(i, s)}
                            size="sm"
                            alwaysEmit
                          />
                          <span style={itemTextStyle}>
                            <span style={{ fontFamily: "var(--font-mono, JetBrains Mono, monospace)", fontSize: 11, color: "var(--cv2-accent-bronze)", letterSpacing: "0.08em", marginRight: 12 }}>
                              {pad3(i + 1)}
                            </span>
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
              <div className="cv2-card" style={blockStyle}>
                <p style={blockTitleStyle}>Inne zadania</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {visibleOther.map(({ t, i }) => {
                    const status = (t.status as TaskStatus | undefined) ?? "todo";
                    const otherNotes = t.notes ?? [];
                    return (
                      <li key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={itemRowStyle}>
                          <TaskChips
                            status={status}
                            onChange={(s) => openOtherTaskPopupDash(i, s)}
                            size="sm"
                            alwaysEmit
                          />
                          <span style={itemTextStyle}>{t.text}</span>
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
              <div className="cv2-card" style={blockStyle}>
                <p style={blockTitleStyle}>Ostrzenie piły</p>
                {sawTasksByDim.map(({ dim, label, tasks }) => (
                  <div key={dim} style={{ marginBottom: 16 }}>
                    <p style={{ ...blockTitleStyle, fontSize: 10, color: "var(--cv2-text-muted)", marginBottom: 6 }}>
                      {label}
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {tasks.map((task) => {
                        const status = taskStatus(task);
                        const sawNotes = getNotes(task);
                        return (
                          <li key={task.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={itemRowStyle}>
                              <TaskChips
                                status={status}
                                onChange={(s) => openSawStatusPopupDash(dim, task.id, s)}
                                size="sm"
                                alwaysEmit
                              />
                              <span style={itemTextStyle}>{task.text}</span>
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

      {/* SECTION 005 — AKTYWNOŚCI. Faza 9 B2: wrap listę w cv2-card glass jak inne sekcje. */}
      <section style={{ marginBottom: 96 }}>
        <NumberedHeader number={5} label="Aktywności">
          <span style={{ fontFamily: "var(--font-mono, JetBrains Mono, monospace)", fontSize: 12, color: "var(--cv2-accent-bronze)", letterSpacing: "0.08em" }}>
            {QUICK_TICK_ITEMS.filter((it) => flags[it.key]).length} / {QUICK_TICK_ITEMS.length}
          </span>
        </NumberedHeader>
        <ul className="cv2-card" style={{ listStyle: "none", padding: "8px 24px", margin: 0 }}>
          {QUICK_TICK_ITEMS.map(({ key: k, label }, idx) => {
            const checked = !!flags[k];
            return (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => toggleTick(k)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 0",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--cv2-border-subtle)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: 18,
                    color: checked ? "var(--cv2-accent-bronze)" : "var(--cv2-text-on-card)",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono, JetBrains Mono, monospace)", fontSize: 11, color: "var(--cv2-accent-bronze)", letterSpacing: "0.08em", minWidth: 36 }}>
                    {pad3(idx + 1)}
                  </span>
                  <span style={{ flex: 1, fontStyle: checked ? "italic" : "normal" }}>{label}</span>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      border: `1.5px solid ${checked ? "var(--cv2-accent-bronze)" : "var(--cv2-text-muted)"}`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: checked ? "var(--cv2-accent-bronze)" : "transparent",
                      color: "var(--cv2-bg-cream)",
                      borderRadius: 2,
                    }}
                  >
                    {checked && <Check size={14} strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* SECTION 006 — SKRÓTY */}
      <section style={{ marginBottom: 96 }}>
        <NumberedHeader number={6} label="Skróty" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          <NumberedActionCard idx={1} href="/v/chrome-v2/check-in" eyebrow="Rano" title={checkInExists ? "Edytuj check-in" : "Zacznij dzień"} desc={checkInExists ? "Wróć do porannego wpisu." : "Intencja, sen, energia, priorytet."} />
          <NumberedActionCard idx={2} href="/v/chrome-v2/check-out" eyebrow="Wieczorem" title={checkOutExists ? "Edytuj check-out" : "Zamknij dzień"} desc={checkOutExists ? "Dopracuj evening review." : "Co się udało, co rozproszyło."} />
          <NumberedActionCard idx={3} href="/v/chrome-v2/plan/dzien" eyebrow="Plan" title="Plan dnia" desc="Godziny + zadania." />
          <NumberedActionCard idx={4} href="/v/chrome-v2/plan/tydzien" eyebrow="Plan" title="Plan tygodnia" desc="7 dni × role × priorytety." />
        </div>
      </section>

      {/* Footer — minimalistic Stoic. Faza 8 B3: kolor text-on-card zamiast bronze (czytelny w Baby Blue light bg). */}
      <section style={{ marginTop: 128, paddingTop: 32, borderTop: "1px solid var(--cv2-border-subtle)", textAlign: "center" }}>
        <div className="cv2-footer-stoic" style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: "italic", fontSize: 18, opacity: 0.7 }}>
          „Mała rzecz dziś — większa niż wielka rzecz nigdy."
        </div>
      </section>

      {/* 3 popups (Plan dnia / Sharpen Saw / Weekly priorytety + inne) */}
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
    </>
  );
}

function NumberedHeader({ number, label, children }: { number: number; label: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 24, paddingBottom: 12, borderBottom: "1px solid var(--cv2-border-subtle)", flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
        <span style={{ fontFamily: "var(--font-mono, JetBrains Mono, monospace)", fontSize: 12, color: "var(--cv2-accent-bronze)", letterSpacing: "0.10em", fontWeight: 500 }}>
          {pad3(number)}
        </span>
        <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 600, color: "var(--cv2-text-on-card)", margin: 0, letterSpacing: "-0.01em" }}>
          {label}
        </h2>
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}

function NumberedActionCard({ idx, href, eyebrow, title, desc }: { idx: number; href: string; eyebrow: string; title: string; desc: string }) {
  return (
    <Link href={href as Route} style={{ textDecoration: "none", display: "block" }}>
      <div className="cv2-card" style={{ height: "100%", padding: 24, position: "relative" }}>
        <span style={{ position: "absolute", top: 16, right: 16, fontFamily: "var(--font-mono, JetBrains Mono, monospace)", fontSize: 11, color: "var(--cv2-accent-bronze)", letterSpacing: "0.08em" }}>
          {pad3(idx)}
        </span>
        <div style={{ fontSize: 11, color: "var(--cv2-accent-bronze)", letterSpacing: "0.10em", textTransform: "uppercase", fontFamily: "var(--font-mono, JetBrains Mono, monospace)", marginBottom: 8 }}>
          {eyebrow}
        </div>
        <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: "clamp(20px, 2.6vw, 26px)", fontWeight: 600, color: "var(--cv2-text-on-card)", marginBottom: 8, letterSpacing: "-0.01em" }}>
          {title}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--cv2-text-muted)", marginBottom: 16 }}>
          {desc}
        </div>
        <div style={{ fontSize: 12, color: "var(--cv2-accent-bronze)", letterSpacing: "0.06em", fontWeight: 600 }}>
          Otwórz →
        </div>
      </div>
    </Link>
  );
}
