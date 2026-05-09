"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { BoldV1PassphraseGate } from "@/components/v/bold-v1/PassphraseGate";
import { Button } from "@/components/v/bold-v1/Button";
import { BoldV1Hero } from "@/components/v/bold-v1/Hero";
import {
  FlowerStretch,
  FlowerGym,
  FlowerCycle,
  FlowerBook,
  FlowerMat,
  FlowerOther,
} from "@/components/v/bold-v1/illustrations/TickIcons";
import { TimePicker } from "@/components/TimePicker";
import { WordChoice } from "@/components/form/WordChoice";
import { RatingRow } from "@/components/form/RatingRow";
import { BoolToggle } from "@/components/form/BoolToggle";
import { Likert4 } from "@/components/form/Likert4";
import {
  applyLegacyMood,
  LEGACY_MOOD_MAP_OUT,
  LEGACY_ADHERENCE_MAP,
  LEGACY_KNOWLEDGE_MAP,
  mapLegacyProactivity,
  mergeLegacyEvening,
} from "@/lib/journal/legacy-migration";
import { encrypt, decrypt } from "@/lib/crypto/aes";
import { saveEntry } from "@/lib/supabase/entries";
import { savePlan } from "@/lib/supabase/plans";
import type { PlanRow } from "@/lib/supabase/plans";
import { TagPicker } from "@/components/TagPicker";
import { TaskChips } from "@/components/TaskChips";
import { DashTaskNoteRow } from "@/components/DashTaskNoteRow";
import { DayMiniGrid } from "@/components/DayMiniGrid";
import { TaskStatusPopup } from "@/components/TaskStatusPopup";
import { taskStatus, setTaskStatus, type TaskStatus } from "@/lib/plan/task-status";
import type { TydzienPlanData, TydzienTask, TaskNoteEntry, OtherTaskItem } from "@/lib/plan/tydzien-types";
import { parseTydzienData } from "@/lib/plan/parse-tydzien";
import { addNote, editNote, deleteNote, getNotes } from "@/lib/plan/task-notes";
import type { EntryMeta, QuickTickFlags } from "@/lib/supabase/entries";
import { getLogicalDateString } from "@/lib/date/day-boundary";
import { appendTag } from "@/lib/utils/text";

interface CheckOutData {
  energyEndWord: string;
  energyEndWordNote?: string; // Sesja 15 F21: dopisek "czemu" przy chipie
  moodWord: string;
  moodWordNote?: string;
  whatWorked: string;
  whatFailed: string;
  whatDiscovered: string;
  whoTalkedTo: string; // legacy field — wywalone z UI w sesji 10 (E1=A), ale zachowane w state dla backwards compat starych entries
  stretching: boolean;
  stretchingNote?: string; // Sesja 15 F22
  cycling: boolean;
  cyclingKm: string;
  cyclingNote?: string; // Sesja 15 F22
  gym: boolean;
  gymType: string;
  gymNote?: string; // Sesja 15 F22
  acupressureMat: boolean;
  acupressureMatNote?: string; // Sesja 15 F22
  otherActivity: string;
  nonFictionRead: boolean;
  nonFictionTitle: string;
  nonFictionNote?: string; // Sesja 15 F22
  oneSentence: string;
  constitutionAdherence: string; // A2: brak / głównie brak / częściowo / głównie zgodnie / zgodnie. Sesja 18: "unknown" = explicit "Nie wiem" (anti-acquiescence — Pomysł #20)
  constitutionAdherenceNote?: string; // Sesja 15 F21: dopisek "czemu"
  shadowsNote?: string; // Sesja 15 F21: dopisek "czemu" przy cieniach
  shadow?: string; // LEGACY — backwards compat (user feedback v2: multi-select przez "shadows")
  shadows?: string[]; // multi-select cieni z Konstytucji ("Zaden" mutually exclusive)
  proactivity?: number; // 1-5 (suwak per docx [1016]); 0 = nie zaznaczono; -1 = "Nie wiem" (sesja 18, Pomysł #20)
  flow?: boolean; // tak/nie
  flowWhen?: string; // opcjonalny tekst "kiedy" jesli flow=true
  knowledgeApplied?: string; // sesja 15 N3: 5-stopniowa skala (nie / raczej nie / częściowo / raczej tak / tak); legacy 3-stop wartości (tak/częściowo/nie) zachowane backwards-compat
  knowledgeAppliedNote?: string; // Sesja 15 F21: dopisek "czemu"
  screenTimeMinutes?: number; // total minuty (0-1440) — UI: dropdown godzin + minut co 1
  screenTimeScreenshot?: string; // base64 image (encrypted w ciphertext) — user "AI na koniec tygodnia odczyta"
  unhealthyFood?: boolean; // niezdrowe zjedzone
  unhealthyFoodNote?: string; // opcjonalna notatka
  ateSugar?: boolean; // 4 kategorie jedzenia per docx [1042]
  ateSugarNote?: string; // Sesja 15 F23
  ateFastFood?: boolean;
  ateFastFoodNote?: string; // Sesja 15 F23
  ateSweetDrinks?: boolean;
  ateSweetDrinksNote?: string; // Sesja 15 F23
  ateProcessed?: boolean;
  ateProcessedNote?: string; // Sesja 15 F23
  firstMealTime?: string; // HH:MM
  lastMealTime?: string; // HH:MM
  mealsCount?: number; // sesja 13 — liczba posiłków (1-6)
  snackedBetweenMeals?: boolean; // sesja 13 — czy podjadał między posiłkami
  napTaken?: boolean; // sesja 17 — czy była drzemka w ciągu dnia
  napMinutes?: number; // sesja 17 — ile minut drzemki (0-300), conditional gdy napTaken=true
  extraOutsidePlan?: string; // sesja 17 — co jeszcze robił poza planem dnia (textarea)
  eveningIntentionMatch?: string; // Likert4: rozjazd/raczej rozjazd/raczej zgodnie/zgodnie/unknown/"" (Krok 4)
  eveningIntentionMatchNote?: string; // Sesja 19 post-handoff (2026-05-06): dopisek + hashtag po wybraniu chipa
  eveningReview?: string; // Krok 10: aglutynacja whatWorked+whatFailed+whatDiscovered → 1 textarea (max 600). "SKIP_NOISE" = świadomy skip
  eveningReviewWorked?: boolean; // Krok 10: mini-tag ✓zadziałało
  eveningReviewFailed?: boolean; // Krok 10: mini-tag ✗nie wyszło
  eveningReviewDiscovered?: boolean; // Krok 10: mini-tag 💡odkryłem
  nonFictionQuestion?: string; // Krok 11 Cornell Q-T-S: "Jakie pytanie zostawia książka?" (opcjonalne)
  nonFictionTakeaway?: string; // Krok 11 Cornell Q-T-S: "Myśl albo informacja, która zostaje Ci w głowie" (opcjonalne)
  proactiveStartedFirst?: boolean; // "Zrobiłem coś z własnej inicjatywy" (sesja 21 — relabel z 'zaczalem zanim mnie zmuszono')
  proactiveSaidNo?: boolean; // "Odmówiłem czemuś co nie służy" (sesja 21 — relabel z 'powiedzialem nie czemus')
  proactiveChangedPlan?: boolean; // LEGACY (sesja 19) — zachowane w schema dla backwards compat, nie renderowane w UI po sesji 21
  proactiveOwnedMistake?: boolean; // "Przyznałem się do błędu" (sesja 21 — relabel z 'wzialem odpowiedzialnosc')
  proactiveDevelopment?: boolean; // "Coś co mnie rozwija"
  proactiveTough?: boolean; // "Siegnalem po trudne zamiast latwe"
  proactiveDistraction?: boolean; // "Wylaczylem rozpraszacz swiadomie"
  proactivePaused?: boolean; // "Zatrzymalem sie i pomyslalem zanim zareagowalem"
  proactiveUnknown?: boolean; // explicit "Nie wiem" (mutex z wszystkimi booleanami)
  proactivityNote?: string; // Sesja 21 — conditional dopisek po wyborze chipow proaktywnosci (kontekst 'co konkretnie')
}

const SHADOWS = [
  "Trans dopaminowy",
  "Ucieczka w łatwe",
  "Nadmierna konsumpcja wiedzy",
  "Biczowanie za stracony czas",
  "Multitasking w tle",
  "Nieumiejętność odpuszczenia",
  "Żaden",
] as const;

const DEFAULT_DATA: CheckOutData = {
  energyEndWord: "",
  moodWord: "",
  whatWorked: "",
  whatFailed: "",
  whatDiscovered: "",
  whoTalkedTo: "",
  stretching: false,
  cycling: false,
  cyclingKm: "",
  gym: false,
  gymType: "",
  acupressureMat: false,
  otherActivity: "",
  nonFictionRead: false,
  nonFictionTitle: "",
  oneSentence: "",
  constitutionAdherence: "",
  shadow: "", // LEGACY
  shadows: [],
  proactivity: 0,
  flow: undefined,
  flowWhen: "",
  knowledgeApplied: "",
  screenTimeMinutes: undefined,
  screenTimeScreenshot: undefined,
  unhealthyFood: undefined,
  unhealthyFoodNote: "",
  ateSugar: false,
  ateFastFood: false,
  ateSweetDrinks: false,
  ateProcessed: false,
  firstMealTime: "",
  lastMealTime: "",
  mealsCount: undefined,
  snackedBetweenMeals: undefined,
  napTaken: undefined,
  napMinutes: undefined,
  extraOutsidePlan: "",
  eveningIntentionMatch: "",
  eveningReview: "",
  eveningReviewWorked: false,
  eveningReviewFailed: false,
  eveningReviewDiscovered: false,
  nonFictionQuestion: "",
  nonFictionTakeaway: "",
  proactiveStartedFirst: false,
  proactiveSaidNo: false,
  proactiveChangedPlan: false,
  proactiveOwnedMistake: false,
  proactiveUnknown: false,
};

interface Props {
  initialEntry: EntryMeta | null;
  quickTickEntry: EntryMeta | null;
  checkInEntry: EntryMeta | null;
  entryDate: string;
  weekPlan: PlanRow | null;
  weekStart: string;
  weekEnd: string;
  dayIdx: number;
}

function CheckOutContent({
  initialEntry,
  quickTickEntry,
  checkInEntry,
  entryDate,
  weekPlan,
  weekStart,
  weekEnd,
  dayIdx,
}: Props) {
  const hasCheckIn = !!checkInEntry;
  const { key } = useCryptoKey();
  const router = useRouter();
  const today = getLogicalDateString();
  const isEditingPast = entryDate !== today;

  const parseQuickTicks = (): QuickTickFlags => {
    if (!quickTickEntry || !key) return {};
    try {
      return JSON.parse(decrypt(quickTickEntry.ciphertext, key)) as QuickTickFlags;
    } catch {
      return {};
    }
  };

  const parseInitial = (): CheckOutData => {
    if (!key) return DEFAULT_DATA;
    if (initialEntry) {
      try {
        const plaintext = decrypt(initialEntry.ciphertext, key);
        const parsed = JSON.parse(plaintext) as Partial<CheckOutData>;
        if (typeof parsed.shadow === "string" && parsed.shadow && !parsed.shadows) {
          parsed.shadows = [parsed.shadow];
        }
        const merged = { ...DEFAULT_DATA, ...parsed } as CheckOutData;
        merged.moodWord = applyLegacyMood(merged.moodWord, LEGACY_MOOD_MAP_OUT);
        merged.energyEndWord = applyLegacyMood(merged.energyEndWord, LEGACY_MOOD_MAP_OUT);
        merged.constitutionAdherence = applyLegacyMood(
          merged.constitutionAdherence,
          LEGACY_ADHERENCE_MAP,
        );
        merged.knowledgeApplied = applyLegacyMood(
          merged.knowledgeApplied ?? "",
          LEGACY_KNOWLEDGE_MAP,
        );
        // gdy nowe booleany wszystkie false (świeży otwarty legacy entry).
        const noneSet =
          !merged.proactiveStartedFirst &&
          !merged.proactiveSaidNo &&
          !merged.proactiveChangedPlan &&
          !merged.proactiveOwnedMistake &&
          !merged.proactiveUnknown;
        if (noneSet && merged.proactivity !== undefined && merged.proactivity !== 0) {
          const mapped = mapLegacyProactivity(merged.proactivity);
          merged.proactiveStartedFirst = mapped.startedFirst;
          merged.proactiveSaidNo = mapped.saidNo;
          merged.proactiveChangedPlan = mapped.changedPlan;
          merged.proactiveOwnedMistake = mapped.ownedMistake;
          merged.proactiveUnknown = mapped.unknown;
        }
        // Apply tylko gdy eveningReview puste (nie nadpisuj świeżego inputu).
        if (
          !merged.eveningReview &&
          (merged.whatWorked || merged.whatFailed || merged.whatDiscovered)
        ) {
          const legacyEvening = mergeLegacyEvening(
            merged.whatWorked,
            merged.whatFailed,
            merged.whatDiscovered,
          );
          merged.eveningReview = legacyEvening.review;
          merged.eveningReviewWorked = legacyEvening.worked;
          merged.eveningReviewFailed = legacyEvening.failed;
          merged.eveningReviewDiscovered = legacyEvening.discovered;
        }
        return merged;
      } catch {
        return DEFAULT_DATA;
      }
    }
    // No checkout yet → pre-fill from today's quick-ticks (per Plan #5 sync)
    const ticks = parseQuickTicks();
    return {
      ...DEFAULT_DATA,
      stretching: !!ticks.stretching,
      cycling: !!ticks.cycling,
      gym: !!ticks.gym,
      nonFictionRead: !!ticks.nonFiction,
      acupressureMat: !!ticks.acupressureMat,
    };
  };

  const [form, setForm] = useState<CheckOutData>(parseInitial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const morningContext = useMemo(() => {
    if (!checkInEntry || !key) return null;
    try {
      const plain = JSON.parse(decrypt(checkInEntry.ciphertext, key)) as {
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
  }, [checkInEntry, key]);

  // === SESJA 17: Plan dnia preview + edycja statusów/notek z check-outu ===
  const decryptWeekPlan = (): TydzienPlanData | null => {
    if (!weekPlan || !key) return null;
    try {
      // Wcześniej check-out tracił sharpenSaw / sharpenSawStatus / prioritiesStatus / priorityRoles /
      // otherTasksV2 / weeklyCut / closingObstacles / closingChange przy każdym save z tego widoku.
      const plain = JSON.parse(decrypt(weekPlan.ciphertext, key)) as Partial<TydzienPlanData>;
      return parseTydzienData(plain);
    } catch {
      return null;
    }
  };

  const [week, setWeek] = useState<TydzienPlanData | null>(() => decryptWeekPlan());
  const [, startTransition] = useTransition();
  const [planError, setPlanError] = useState("");

  const todayPlanTasks = week?.days[dayIdx] ?? [];

  const persistPlan = (next: TydzienPlanData, prev: TydzienPlanData) => {
    if (!key) return;
    setPlanError("");
    startTransition(async () => {
      try {
        const ciphertext = encrypt(JSON.stringify(next), key);
        const result = await savePlan("tydzien", weekStart, weekEnd, ciphertext);
        if (result.error) {
          setPlanError(result.error);
          setWeek(prev);
        }
      } catch (e) {
        setPlanError(e instanceof Error ? e.message : "Błąd zapisu planu.");
        setWeek(prev);
      }
    });
  };

  const setTaskStatusInPlan = (taskId: string, newStatus: TaskStatus) => {
    if (!key || !week) return;
    const next: TydzienPlanData = {
      ...week,
      days: week.days.map((arr, i) =>
        i === dayIdx ? arr.map((t) => (t.id === taskId ? setTaskStatus(t, newStatus) : t)) : arr
      ),
    };
    const prev = week;
    setWeek(next);
    persistPlan(next, prev);
  };

  const persistDayTaskMutationInPlan = (mutator: (task: TydzienTask) => TydzienTask) => (taskId: string) => {
    if (!key || !week) return;
    const next: TydzienPlanData = {
      ...week,
      days: week.days.map((arr, i) =>
        i === dayIdx ? arr.map((t) => (t.id === taskId ? mutator(t) : t)) : arr,
      ),
    };
    const prev = week;
    setWeek(next);
    persistPlan(next, prev);
  };

  const addTaskNoteInPlan = (taskId: string, text: string) => {
    if (!week) return;
    const task = week.days[dayIdx]?.find((t) => t.id === taskId);
    if (!task) return;
    const status = taskStatus(task);
    persistDayTaskMutationInPlan((t) => addNote(t, text, status))(taskId);
  };

  const [popupTaskId, setPopupTaskId] = useState<string | null>(null);
  const [popupPendingStatus, setPopupPendingStatus] = useState<TaskStatus>("todo");
  const [notesSectionExpandedCO, setNotesSectionExpandedCO] = useState<boolean>(false);

  const openStatusPopup = (taskId: string, newStatus: TaskStatus) => {
    setPopupTaskId(taskId);
    setPopupPendingStatus(newStatus);
  };

  const closeStatusPopup = () => {
    setPopupTaskId(null);
  };

  const savePopupStatus = (status: TaskStatus, comment: string) => {
    if (!popupTaskId) return;
    const trimmed = comment.trim();
    persistDayTaskMutationInPlan((t) => {
      let updated = setTaskStatus(t, status);
      if (trimmed) updated = addNote(updated, trimmed, status);
      return updated;
    })(popupTaskId);
    closeStatusPopup();
  };

  const popupTask = popupTaskId ? week?.days[dayIdx]?.find((t) => t.id === popupTaskId) : null;

  type SawDim = "physical" | "mental" | "social" | "spiritual";
  const [sawPopupDim, setSawPopupDim] = useState<SawDim | null>(null);
  const [sawPopupTaskId, setSawPopupTaskId] = useState<string | null>(null);
  const [sawPopupPendingStatus, setSawPopupPendingStatus] = useState<TaskStatus>("todo");

  const openSawStatusPopupCheckOut = (dim: SawDim, taskId: string, newStatus: TaskStatus) => {
    setSawPopupDim(dim);
    setSawPopupTaskId(taskId);
    setSawPopupPendingStatus(newStatus);
  };

  const closeSawStatusPopupCheckOut = () => {
    setSawPopupDim(null);
    setSawPopupTaskId(null);
  };

  const persistSawTaskMutationCheckOut = (dim: SawDim, taskId: string, mutator: (t: TydzienTask) => TydzienTask) => {
    if (!key || !week) return;
    const next: TydzienPlanData = {
      ...week,
      sharpenSawTasks: {
        ...(week.sharpenSawTasks ?? {}),
        [dim]: (week.sharpenSawTasks?.[dim] ?? []).map((t) => (t.id === taskId ? mutator(t) : t)),
      },
    };
    const prev = week;
    setWeek(next);
    persistPlan(next, prev);
  };

  const saveSawPopupStatusCheckOut = (status: TaskStatus, comment: string) => {
    if (!sawPopupDim || !sawPopupTaskId) return;
    const trimmed = comment.trim();
    persistSawTaskMutationCheckOut(sawPopupDim, sawPopupTaskId, (t) => {
      let updated = setTaskStatus(t, status);
      if (trimmed) updated = addNote(updated, trimmed, status);
      return updated;
    });
    closeSawStatusPopupCheckOut();
  };

  const sawPopupTask = sawPopupDim && sawPopupTaskId
    ? week?.sharpenSawTasks?.[sawPopupDim]?.find((t) => t.id === sawPopupTaskId) ?? null
    : null;

  type WeeklyPopupKind = "priority" | "other";
  const [weeklyPopupKind, setWeeklyPopupKind] = useState<WeeklyPopupKind | null>(null);
  const [weeklyPopupIdx, setWeeklyPopupIdx] = useState<number>(-1);
  const [weeklyPopupPendingStatus, setWeeklyPopupPendingStatus] = useState<TaskStatus>("todo");

  const openPriorityPopupCheckOut = (i: number, newStatus: TaskStatus) => {
    setWeeklyPopupKind("priority");
    setWeeklyPopupIdx(i);
    setWeeklyPopupPendingStatus(newStatus);
  };

  const openOtherTaskPopupCheckOut = (i: number, newStatus: TaskStatus) => {
    setWeeklyPopupKind("other");
    setWeeklyPopupIdx(i);
    setWeeklyPopupPendingStatus(newStatus);
  };

  const closeWeeklyPopupCheckOut = () => {
    setWeeklyPopupKind(null);
    setWeeklyPopupIdx(-1);
  };

  const persistWeeklyMutationCheckOut = (mutator: (w: TydzienPlanData) => TydzienPlanData) => {
    if (!key || !week) return;
    const next = mutator(week);
    const prev = week;
    setWeek(next);
    persistPlan(next, prev);
  };

  const saveWeeklyPopupStatusCheckOut = (status: TaskStatus, comment: string) => {
    if (weeklyPopupKind === null || weeklyPopupIdx < 0 || !week) return;
    const trimmed = comment.trim();
    persistWeeklyMutationCheckOut((w) => {
      if (weeklyPopupKind === "priority") {
        const currentStatus = w.prioritiesStatus ?? w.priorities.map(() => null);
        const padded: (TaskStatus | null)[] = w.priorities.map((_, idx) => currentStatus[idx] ?? null);
        padded[weeklyPopupIdx] = status;
        let nextNotes = w.prioritiesNotes ?? w.priorities.map(() => []);
        nextNotes = w.priorities.map((_, idx) => nextNotes?.[idx] ?? []);
        if (trimmed) {
          const newNote: TaskNoteEntry = {
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
          const updated: OtherTaskItem = { ...t, status };
          if (trimmed) {
            const newNote: TaskNoteEntry = {
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
    closeWeeklyPopupCheckOut();
  };

  const weeklyPopupTaskCheckOut = (() => {
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

  const editTaskNoteInPlan = (taskId: string, noteId: string, text: string) => {
    persistDayTaskMutationInPlan((t) => editNote(t, noteId, text))(taskId);
  };

  const deleteTaskNoteInPlan = (taskId: string, noteId: string) => {
    persistDayTaskMutationInPlan((t) => deleteNote(t, noteId))(taskId);
  };

  const setPriorityStatusInCheckOut = (i: number, status: TaskStatus) => {
    if (!key || !week) return;
    const current = week.prioritiesStatus ?? week.priorities.map(() => null);
    const padded: (TaskStatus | null)[] = week.priorities.map((_, idx) => current[idx] ?? null);
    padded[i] = status;
    const prev = week;
    const next: TydzienPlanData = { ...week, prioritiesStatus: padded };
    setWeek(next);
    persistPlan(next, prev);
  };

  const setSharpenSawStatusInCheckOut = (
    dim: "physical" | "mental" | "social" | "spiritual",
    status: TaskStatus,
  ) => {
    if (!key || !week) return;
    const prev = week;
    const next: TydzienPlanData = {
      ...week,
      sharpenSawStatus: { ...(week.sharpenSawStatus ?? {}), [dim]: status },
    };
    setWeek(next);
    persistPlan(next, prev);
  };

  const setOtherTaskStatusInCheckOut = (i: number, status: TaskStatus) => {
    if (!key || !week) return;
    const v2 = (week.otherTasksV2 ?? []).map((t, idx) => (idx === i ? { ...t, status } : t));
    const prev = week;
    const next: TydzienPlanData = { ...week, otherTasksV2: v2 };
    setWeek(next);
    persistPlan(next, prev);
  };

  // C1: post-save redirect po 1.5s.
  // Past-entry → wraca do journal day. Today → dashboard z toastem.
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => {
      if (isEditingPast) {
        router.push(`/v/bold-v1/journal/${entryDate}` as never);
      } else {
        router.push("/v/bold-v1/dashboard?saved=checkout");
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [saved, router, isEditingPast, entryDate]);

  if (!key) return null;

  const isEditMode = !!initialEntry;

  const set = <K extends keyof CheckOutData>(field: K, value: CheckOutData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  // B1 (universal rule): wszystkie pola opcjonalne. Walidacja minimal: nie zapisuj kompletnie pustego.
  const handleSave = async () => {
    const isCompletelyEmpty =
      !form.energyEndWord && !form.moodWord && !form.eveningReview && !form.whatWorked &&
      !form.whatFailed && !form.whatDiscovered &&
      !form.eveningReviewWorked && !form.eveningReviewFailed && !form.eveningReviewDiscovered &&
      !form.stretching && !form.cycling && !form.cyclingKm &&
      !form.gym && !form.otherActivity?.trim() && !form.nonFictionRead && !form.nonFictionTitle &&
      !form.oneSentence && !form.constitutionAdherence &&
      (!form.shadows || form.shadows.length === 0) && (form.proactivity ?? 0) === 0 &&
      !form.proactiveStartedFirst && !form.proactiveSaidNo &&
      !form.proactiveChangedPlan && !form.proactiveOwnedMistake && !form.proactiveUnknown &&
      form.flow === undefined && !form.flowWhen &&
      !form.knowledgeApplied && form.screenTimeMinutes === undefined &&
      !form.screenTimeScreenshot &&
      form.unhealthyFood === undefined && !form.unhealthyFoodNote &&
      !form.ateSugar && !form.ateFastFood && !form.ateSweetDrinks && !form.ateProcessed &&
      !form.firstMealTime && !form.lastMealTime;

    if (isCompletelyEmpty) {
      setError("Pusty formularz — wypełnij chociaż jedno pole.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const ciphertext = encrypt(JSON.stringify(form), key);
      const result = await saveEntry("checkout", entryDate, form.moodWord || null, ciphertext);
      if (result.error) throw new Error(result.error);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd zapisu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bv1-form-screen">
      <BoldV1Hero
        eyebrow={entryDate}
        title="Zamknij dzień."
        subtitle={
          isEditingPast
            ? `Edytujesz check-out z ${entryDate}`
            : isEditMode
              ? "Edytujesz wieczorny check-out"
              : undefined
        }
        illuSrc="/v/bold-v1/icons/flower-glass.png"
      />

      {!hasCheckIn && (
        <div className="ci-banner">
          Nie zrobiłeś check-in rano. Kontynuujesz bez niego — OK.
        </div>
      )}

      <div className="ci-form">
        {/* === SESJA 19 post-handoff (2026-05-06): Postęp tygodnia dzisiaj — mirror plan tygodnia === */}
        {(() => {
          if (!week) return null;
          const visiblePriorities = (week.priorities ?? [])
            .map((p, i) => ({ p, i }))
            .filter(({ p }) => p.trim().length > 0);
          const visibleOther = (week.otherTasksV2 ?? [])
            .map((t, i) => ({ t, i }))
            .filter(({ t }) => t.text.trim().length > 0);
          const sharpenSawDimensions: { dim: "physical" | "mental" | "social" | "spiritual"; label: string }[] = [
            { dim: "physical", label: "Fizyczny" },
            { dim: "mental", label: "Mentalny" },
            { dim: "social", label: "Społeczny" },
            { dim: "spiritual", label: "Duchowy" },
          ];
          const sawTasksByDim = sharpenSawDimensions
            .map(({ dim, label }) => ({ dim, label, tasks: week.sharpenSawTasks?.[dim] ?? [] }))
            .filter((d) => d.tasks.length > 0);
          if (visiblePriorities.length === 0 && visibleOther.length === 0 && sawTasksByDim.length === 0) {
            return null;
          }
          return (
            <section className="bv1-form-section">
              <h2 className="bv1-form-section-title">Postęp tygodnia dzisiaj</h2>
              {visiblePriorities.length > 0 && (
                <div className="dash-weekly-block">
                  <p className="dash-weekly-block-title">Priorytety (Q2)</p>
                  <ul className="dash-weekly-list">
                    {visiblePriorities.map(({ p, i }) => {
                      const status = (week.prioritiesStatus?.[i] as TaskStatus | null) ?? "todo";
                      const priorityNotes = week.prioritiesNotes?.[i] ?? [];
                      return (
                        <li key={i} className={`dash-weekly-item dash-weekly-item-${status}`}>
                          <div className="dash-weekly-item-row">
                            <TaskChips
                              status={status}
                              onChange={(s) => openPriorityPopupCheckOut(i, s)}
                              size="sm"
                              alwaysEmit
                            />
                            <span className="dash-weekly-text">
                              <span className="dash-weekly-label">P{i + 1}</span>
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
                <div className="dash-weekly-block">
                  <p className="dash-weekly-block-title">Inne zadania</p>
                  <ul className="dash-weekly-list">
                    {visibleOther.map(({ t, i }) => {
                      const status = (t.status as TaskStatus | undefined) ?? "todo";
                      const otherNotes = t.notes ?? [];
                      return (
                        <li key={i} className={`dash-weekly-item dash-weekly-item-${status}`}>
                          <div className="dash-weekly-item-row">
                            <TaskChips
                              status={status}
                              onChange={(s) => openOtherTaskPopupCheckOut(i, s)}
                              size="sm"
                              alwaysEmit
                            />
                            <span className="dash-weekly-text">{t.text}</span>
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
                <div className="dash-weekly-block">
                  <p className="dash-weekly-block-title">Ostrzenie piły</p>
                  {sawTasksByDim.map(({ dim, label, tasks }) => (
                    <div key={dim} style={{ marginBottom: 8 }}>
                      <p className="text-muted" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>
                        {label}
                      </p>
                      <ul className="dash-weekly-list">
                        {tasks.map((task) => {
                          const status = taskStatus(task);
                          const sawNotes = getNotes(task);
                          return (
                            <li key={task.id} className={`dash-weekly-item dash-weekly-item-${status}`}>
                              <div className="dash-weekly-item-row">
                                <TaskChips
                                  status={status}
                                  onChange={(s) => openSawStatusPopupCheckOut(dim, task.id, s)}
                                  size="sm"
                                  alwaysEmit
                                />
                                <span className="dash-weekly-text">{task.text}</span>
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
              {planError && (
                <p className="ci-error" role="alert" style={{ marginTop: 8 }}>{planError}</p>
              )}
            </section>
          );
        })()}

        {/* === SESJA 19 post-handoff v3 (2026-05-06) — Plan dnia jako mini-grid (jak dashboard / plan dnia gridowy). === */}
        {week && todayPlanTasks.length > 0 && (
          <section className="bv1-form-section">
            <h2 className="bv1-form-section-title">Plan dnia</h2>
            {planError && <p className="ci-error" role="alert">{planError}</p>}
            <DayMiniGrid
              tasks={todayPlanTasks}
              onStatusChange={openStatusPopup}
              showUntimed={true}
            />
            {/* Komentarze pod gridem — tylko dla zadań które mają notki (collapsed badge + expand). */}
            {todayPlanTasks.some((t) => getNotes(t).length > 0) && (
              <div className="dash-task-notes-section" style={{ marginTop: 12 }}>
                {(() => {
                  const tasksWithNotes = todayPlanTasks.filter((t) => getNotes(t).length > 0);
                  return (
                    <>
                      <button
                        type="button"
                        className="dash-task-notes-header dash-task-notes-toggle"
                        onClick={() => setNotesSectionExpandedCO((v) => !v)}
                        aria-expanded={notesSectionExpandedCO}
                      >
                        <span>Komentarze do zadań ({tasksWithNotes.length})</span>
                        <span aria-hidden>{notesSectionExpandedCO ? "▾" : "▸"}</span>
                      </button>
                      {notesSectionExpandedCO &&
                        tasksWithNotes.map((task) => (
                          <DashTaskNoteRow
                            key={`note-${task.id}`}
                            taskId={task.id}
                            taskText={task.text}
                            status={taskStatus(task)}
                            notes={getNotes(task)}
                            onEditNote={editTaskNoteInPlan}
                            onDeleteNote={deleteTaskNoteInPlan}
                          />
                        ))}
                    </>
                  );
                })()}
              </div>
            )}
          </section>
        )}

        {/* === SESJA 17: Co jeszcze poza planem dnia (np. wieczorem) === */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Co jeszcze robiłem poza planem dnia</h2>
          <textarea
            className="ci-textarea"
            rows={3}
            maxLength={1000}
            value={form.extraOutsidePlan ?? ""}
            onChange={(e) => set("extraOutsidePlan", e.target.value)}
          />
          <div style={{ marginTop: 6 }}>
            <TagPicker
              onPick={(tag) => set("extraOutsidePlan", appendTag(form.extraOutsidePlan ?? "", tag))}
            />
          </div>
        </section>

        {/* === SESJA 19 KROK 4 + SESJA 21 (2026-05-07): dynamic label intencja vs priorytet === */}
        {morningContext && (
          <section className="bv1-form-section">
            <h2 className="bv1-form-section-title">
              {morningContext.morningIntention
                ? "Zgodność dnia z poranną intencją"
                : "Zgodność dnia z porannym priorytetem"}
            </h2>
            {morningContext.morningIntention && (
              <p className="ci-readonly-line" style={{ marginBottom: 6 }}>
                <span className="ci-readonly-label">Intencja dnia:</span> {morningContext.morningIntention}
              </p>
            )}
            {morningContext.mainPriority && (
              <p className="ci-readonly-line" style={{ marginBottom: 10 }}>
                <span className="ci-readonly-label">Priorytet dnia:</span> {morningContext.mainPriority}
              </p>
            )}
            <Likert4
              label=""
              name="eveningIntentionMatch"
              options={["rozjazd", "raczej rozjazd", "raczej zgodnie", "zgodnie"]}
              value={form.eveningIntentionMatch ?? ""}
              onChange={(v) => set("eveningIntentionMatch", v)}
            />
            {form.eveningIntentionMatch && form.eveningIntentionMatch !== "unknown" && (
              <div className="ci-field" style={{ marginTop: 10 }}>
                <label className="ci-field-label" htmlFor="evening-intention-note">Dopisek</label>
                <textarea
                  id="evening-intention-note"
                  className="ci-word-note"
                  rows={2}
                  maxLength={300}
                  value={form.eveningIntentionMatchNote ?? ""}
                  onChange={(e) => set("eveningIntentionMatchNote", e.target.value)}
                />
                <div style={{ marginTop: 6 }}>
                  <TagPicker
                    onPick={(tag) => set("eveningIntentionMatchNote", appendTag(form.eveningIntentionMatchNote ?? "", tag))}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* === ENERGIA + NASTROJ — Krok 6: 5-point WordChoice → Likert4 4-point + sentinel === */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Energia na koniec dnia</h2>
          <Likert4
            label=""
            name="energyEndWord"
            options={["wyczerpany", "zmęczony", "naładowany", "pełen energii"]}
            value={form.energyEndWord}
            onChange={(v) => set("energyEndWord", v)}
          />
          {form.energyEndWord && form.energyEndWord !== "unknown" && (
            <div className="ci-field" style={{ marginTop: 10 }}>
              <label className="ci-field-label" htmlFor="energy-end-note">Dopisek</label>
              <textarea
                id="energy-end-note"
                className="ci-word-note"
                rows={2}
                maxLength={300}
                value={form.energyEndWordNote ?? ""}
                onChange={(e) => set("energyEndWordNote", e.target.value)}
              />
              <div style={{ marginTop: 6 }}>
                <TagPicker
                  onPick={(tag) => set("energyEndWordNote", appendTag(form.energyEndWordNote ?? "", tag))}
                />
              </div>
            </div>
          )}
        </section>

        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Nastrój dnia</h2>
          <Likert4
            label=""
            name="moodWord"
            options={["zły", "raczej zły", "raczej dobry", "dobry"]}
            value={form.moodWord}
            onChange={(v) => set("moodWord", v)}
          />
          {form.moodWord && form.moodWord !== "unknown" && (
            <div className="ci-field" style={{ marginTop: 10 }}>
              <label className="ci-field-label" htmlFor="mood-out-note">Dopisek</label>
              <textarea
                id="mood-out-note"
                className="ci-word-note"
                rows={2}
                maxLength={300}
                value={form.moodWordNote ?? ""}
                onChange={(e) => set("moodWordNote", e.target.value)}
              />
              <div style={{ marginTop: 6 }}>
                <TagPicker
                  onPick={(tag) => set("moodWordNote", appendTag(form.moodWordNote ?? "", tag))}
                />
              </div>
            </div>
          )}
        </section>

        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Co dziś było ważne?</h2>
          <input
            type="text"
            className="ci-input ci-input-wide"
            placeholder=""
            aria-label="Co dziś było ważne"
            maxLength={200}
            value={form.oneSentence}
            onChange={(e) => set("oneSentence", e.target.value)}
          />
          <TagPicker onPick={(tag) => set("oneSentence", appendTag(form.oneSentence, tag))} />
        </section>

        {/* === REFLEKSJA WIECZORNA — Krok 10: aglutynacja 3 textarea → 1 + 3 mini-tagi === */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Refleksja wieczorna</h2>
          <textarea
            className="ci-textarea"
            placeholder=""
            aria-label="Refleksja wieczorna"
            maxLength={600}
            rows={5}
            value={form.eveningReview === "SKIP_NOISE" ? "" : (form.eveningReview ?? "")}
            onChange={(e) => set("eveningReview", e.target.value)}
            disabled={form.eveningReview === "SKIP_NOISE"}
          />
          <TagPicker onPick={(tag) => set("eveningReview", appendTag(form.eveningReview ?? "", tag))} />
          <button
            type="button"
            className={`ci-word-btn${form.eveningReview === "SKIP_NOISE" ? " active" : ""}`}
            style={{ marginTop: 8 }}
            onClick={() =>
              set("eveningReview", form.eveningReview === "SKIP_NOISE" ? "" : "SKIP_NOISE")
            }
            aria-pressed={form.eveningReview === "SKIP_NOISE"}
          >
            Nic dziś
          </button>
          {/* Faza 10 B1: USUNIETE 3 kafelki "✓ zadziałało / ✗ nie wyszło / 💡 odkryłem"
              (user feedback 2026-05-08). Schema eveningReviewWorked/Failed/Discovered
              zachowane (backwards compat). UI cleanup. */}
        </section>

        {/* === A2: Adherence z Konstytucją (Krok 7: WordChoice+manual sentinel → Likert4) === */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Zgodność z Konstytucją dziś</h2>
          <Likert4
            label=""
            name="constitutionAdherence"
            options={["brak", "raczej brak", "raczej zgodnie", "zgodnie"]}
            value={form.constitutionAdherence}
            onChange={(v) => set("constitutionAdherence", v)}
          />
          {form.constitutionAdherence && form.constitutionAdherence !== "unknown" && (
            <div className="ci-field" style={{ marginTop: 10 }}>
              <label className="ci-field-label" htmlFor="constitution-note">Dopisek</label>
              <textarea
                id="constitution-note"
                className="ci-word-note"
                rows={2}
                maxLength={300}
                value={form.constitutionAdherenceNote ?? ""}
                onChange={(e) => set("constitutionAdherenceNote", e.target.value)}
              />
              <div style={{ marginTop: 6 }}>
                <TagPicker
                  onPick={(tag) => set("constitutionAdherenceNote", appendTag(form.constitutionAdherenceNote ?? "", tag))}
                />
              </div>
            </div>
          )}
        </section>

        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Cień z Konstytucji złapany?</h2>
          <div className="ci-word-choice ci-word-choice-wrap">
            {SHADOWS.map((opt) => {
              const selected = (form.shadows ?? []).includes(opt);
              return (
                <label key={opt} className={`ci-word-btn${selected ? " active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const current = form.shadows ?? [];
                      if (opt === "Żaden") {
                        set("shadows", selected ? [] : ["Żaden"]);
                      } else {
                        const without = current.filter((x) => x !== "Żaden");
                        set(
                          "shadows",
                          selected ? without.filter((x) => x !== opt) : [...without, opt]
                        );
                      }
                    }}
                    className="sr-only"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
          {(form.shadows ?? []).length > 0 && !((form.shadows ?? []).includes("Żaden")) && (
            <div className="ci-field" style={{ marginTop: 10 }}>
              <label className="ci-field-label" htmlFor="shadows-note">Dopisek</label>
              <textarea
                id="shadows-note"
                className="ci-word-note"
                rows={2}
                maxLength={300}
                value={form.shadowsNote ?? ""}
                onChange={(e) => set("shadowsNote", e.target.value)}
              />
              <div style={{ marginTop: 6 }}>
                <TagPicker
                  onPick={(tag) => set("shadowsNote", appendTag(form.shadowsNote ?? "", tag))}
                />
              </div>
            </div>
          )}
        </section>

        {/* === Proaktywność (Krok 9: 1-5 RatingRow → 4 obserwowalne booleany) === */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Proaktywność dziś</h2>
          <p className="ci-help" style={{ marginTop: 0, marginBottom: 8, fontSize: 13, color: "var(--fg-secondary)" }}>
            Zaznacz, co dziś faktycznie zrobiłeś.
          </p>
          <div className="ci-word-choice-grid">
            {(
              [
                ["proactiveStartedFirst", "Zrobiłem coś z własnej inicjatywy"],
                ["proactiveDevelopment", "Coś co mnie rozwija"],
                ["proactiveTough", "Sięgnąłem po trudne zamiast łatwe"],
                ["proactiveSaidNo", "Odmówiłem czemuś co nie służy"],
                ["proactiveDistraction", "Wyłączyłem rozpraszacz świadomie"],
                ["proactiveOwnedMistake", "Przyznałem się do błędu"],
                ["proactivePaused", "Zatrzymałem się i pomyślałem zanim zareagowałem"],
              ] as const
            ).map(([key, label]) => {
              const isActive = form[key] === true;
              return (
                <button
                  key={key}
                  type="button"
                  className={`ci-word-btn${isActive ? " active" : ""}`}
                  onClick={() => {
                    setForm((f) => ({
                      ...f,
                      [key]: !isActive,
                      // Mutex: wybór konkretnego zachowania czyści sentinel "Nie wiem".
                      proactiveUnknown: isActive ? f.proactiveUnknown : false,
                    }));
                  }}
                  aria-pressed={isActive}
                >
                  {label}
                </button>
              );
            })}
            {/* Faza 10 B2: "Nie wiem" jako 8 item w grid (po prawej obok "Zatrzymałem się"),
                nie osobny full-width button. Mutex zachowany. */}
            <button
              type="button"
              className={`ci-word-btn${form.proactiveUnknown ? " active" : ""}`}
              onClick={() => {
                setForm((f) => {
                  const next = !f.proactiveUnknown;
                  return {
                    ...f,
                    proactiveUnknown: next,
                    proactiveStartedFirst: next ? false : f.proactiveStartedFirst,
                    proactiveDevelopment: next ? false : f.proactiveDevelopment,
                    proactiveTough: next ? false : f.proactiveTough,
                    proactiveSaidNo: next ? false : f.proactiveSaidNo,
                    proactiveDistraction: next ? false : f.proactiveDistraction,
                    proactiveOwnedMistake: next ? false : f.proactiveOwnedMistake,
                    proactivePaused: next ? false : f.proactivePaused,
                    proactiveChangedPlan: next ? false : f.proactiveChangedPlan,
                  };
                });
              }}
              aria-pressed={form.proactiveUnknown ?? false}
            >
              Nie wiem
            </button>
          </div>
          {/* Sesja 21 (2026-05-07) — conditional dopisek po wyborze >=1 chipa (lub Nie wiem). */}
          {(form.proactiveStartedFirst ||
            form.proactiveDevelopment ||
            form.proactiveTough ||
            form.proactiveSaidNo ||
            form.proactiveDistraction ||
            form.proactiveOwnedMistake ||
            form.proactivePaused ||
            form.proactiveUnknown) && (
            <div className="ci-field" style={{ marginTop: 10 }}>
              <label className="ci-field-label" htmlFor="proactivity-note">Dopisek</label>
              <textarea
                id="proactivity-note"
                className="ci-word-note"
                rows={2}
                maxLength={300}
                value={form.proactivityNote ?? ""}
                onChange={(e) => set("proactivityNote", e.target.value)}
              />
              <div style={{ marginTop: 6 }}>
                <TagPicker
                  onPick={(tag) => set("proactivityNote", appendTag(form.proactivityNote ?? "", tag))}
                />
              </div>
            </div>
          )}
        </section>

        {/* === SESJA 11 M2: Flow per docx [1018] === */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Czy czułem flow dzisiaj?</h2>
          <BoolToggle
            label="Czy czułem flow dzisiaj"
            value={form.flow}
            onChange={(v) => set("flow", v)}
            name="flow"
          />
          {form.flow === true && (
            <div className="ci-field" style={{ marginTop: 12 }}>
              <label className="ci-field-label" htmlFor="flowWhen">Kiedy?</label>
              <textarea
                id="flowWhen"
                className="ci-word-note"
                rows={2}
                maxLength={300}
                value={form.flowWhen ?? ""}
                onChange={(e) => set("flowWhen", e.target.value)}
              />
              <div style={{ marginTop: 6 }}>
                <TagPicker onPick={(tag) => set("flowWhen", appendTag(form.flowWhen ?? "", tag))} />
              </div>
            </div>
          )}
        </section>

        {/* === Wdrażanie wiedzy (Krok 8: 5-stop → Likert4 4-point + sentinel) === */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Wdrażałem nową wiedzę?</h2>
          <Likert4
            label=""
            name="knowledgeApplied"
            options={["nie", "raczej nie", "raczej tak", "tak"]}
            value={form.knowledgeApplied ?? ""}
            onChange={(v) => set("knowledgeApplied", v)}
          />
          {form.knowledgeApplied && form.knowledgeApplied !== "unknown" && (
            <div className="ci-field" style={{ marginTop: 10 }}>
              <label className="ci-field-label" htmlFor="knowledge-note">Dopisek</label>
              <textarea
                id="knowledge-note"
                className="ci-word-note"
                rows={2}
                maxLength={300}
                value={form.knowledgeAppliedNote ?? ""}
                onChange={(e) => set("knowledgeAppliedNote", e.target.value)}
              />
              <div style={{ marginTop: 6 }}>
                <TagPicker
                  onPick={(tag) => set("knowledgeAppliedNote", appendTag(form.knowledgeAppliedNote ?? "", tag))}
                />
              </div>
            </div>
          )}
        </section>

        {/* === AKTYWNOSC FIZYCZNA — Plan #5 rozszerz: rozciąganie + non-fiction sync z quick-tick === */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Aktywność dnia</h2>

          {/* Sesja 19 post-handoff v3 (2026-05-06) — usunięto dopiski po zaznaczeniu rozciąganie/rower/siłownia/mata.
              Schema *Note pól zostaje (backwards compat). */}
          <div className="ci-checkbox-row">
            <label className="ci-checkbox-label">
              <input
                type="checkbox"
                checked={form.stretching}
                onChange={(e) => set("stretching", e.target.checked)}
              />
              <FlowerStretch size={28} className="ci-checkbox-icon" />Rozciąganie
            </label>
          </div>

          <div className="ci-checkbox-row" style={{ marginTop: 8 }}>
            <label className="ci-checkbox-label">
              <input
                type="checkbox"
                checked={form.cycling}
                onChange={(e) => set("cycling", e.target.checked)}
              />
              <FlowerCycle size={28} className="ci-checkbox-icon" />Rower
            </label>
          </div>


          <div className="ci-checkbox-row" style={{ marginTop: 8 }}>
            <label className="ci-checkbox-label">
              <input
                type="checkbox"
                checked={form.gym}
                onChange={(e) => set("gym", e.target.checked)}
              />
              <FlowerGym size={28} className="ci-checkbox-icon" />Siłownia
            </label>
          </div>

          <div className="ci-checkbox-row" style={{ marginTop: 8 }}>
            <label className="ci-checkbox-label">
              <input
                type="checkbox"
                checked={form.acupressureMat}
                onChange={(e) => set("acupressureMat", e.target.checked)}
              />
              <FlowerMat size={28} className="ci-checkbox-icon" />Mata akupresury
            </label>
          </div>

          {/* Sesja 17: non-fiction / rozwojowe — przywrócone do UI (auto-prefill z dashboard quick-tick) */}
          <div className="ci-checkbox-row" style={{ marginTop: 8 }}>
            <label className="ci-checkbox-label">
              <input
                type="checkbox"
                checked={form.nonFictionRead}
                onChange={(e) => {
                  set("nonFictionRead", e.target.checked);
                  if (!e.target.checked) set("nonFictionTitle", "");
                }}
              />
              <FlowerBook size={28} className="ci-checkbox-icon" />Czytanie non-fiction / rozwojowe
            </label>
          </div>
          {form.nonFictionRead && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Sesja 19 post-handoff v3 (2026-05-06) — 2 pola z labelami: Tytuł + Dopisek (z TagPicker).
                  Cornell Q-T-S (nonFictionQuestion + nonFictionTakeaway) usunięte z UI per user feedback —
                  schema zostaje. */}
              <div className="ci-field">
                <label className="ci-field-label" htmlFor="nonfiction-title">Tytuł</label>
                <input
                  id="nonfiction-title"
                  type="text"
                  className="ci-input ci-input-wide"
                  maxLength={200}
                  value={form.nonFictionTitle ?? ""}
                  onChange={(e) => set("nonFictionTitle", e.target.value)}
                />
              </div>
              <div className="ci-field">
                <label className="ci-field-label" htmlFor="nonfiction-note">Dopisek</label>
                <textarea
                  id="nonfiction-note"
                  className="ci-textarea ci-textarea-sm"
                  rows={2}
                  maxLength={400}
                  value={form.nonFictionNote ?? ""}
                  onChange={(e) => set("nonFictionNote", e.target.value)}
                />
                <div style={{ marginTop: 6 }}>
                  <TagPicker
                    onPick={(tag) => set("nonFictionNote", appendTag(form.nonFictionNote ?? "", tag))}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="ci-checkbox-row" style={{ marginTop: 8 }}>
            <label className="ci-checkbox-label">
              <input
                type="checkbox"
                checked={!!form.otherActivity}
                onChange={(e) => set("otherActivity", e.target.checked ? " " : "")}
              />
              <FlowerOther size={28} className="ci-checkbox-icon" />Inne (spacer, bieg, basen)
            </label>
          </div>
          {!!form.otherActivity && (
            <div className="ci-field" style={{ marginTop: 8 }}>
              <input
                type="text"
                className="ci-input ci-input-wide"
                placeholder="Co?"
                aria-label="Inna aktywność — opis"
                maxLength={100}
                value={form.otherActivity.trim() === "" ? "" : form.otherActivity}
                onChange={(e) => set("otherActivity", e.target.value)}
              />
              <TagPicker onPick={(tag) => set("otherActivity", appendTag(form.otherActivity, tag))} />
            </div>
          )}
        </section>

        {/* === SESJA 17: Drzemka === */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Drzemka</h2>
          <BoolToggle
            label="Czy miałem drzemkę"
            value={form.napTaken}
            onChange={(v) => {
              set("napTaken", v);
              if (v === false) set("napMinutes", undefined);
            }}
            name="napTaken"
          />
          {form.napTaken === true && (
            <div className="ci-field" style={{ marginTop: 12 }}>
              <label className="ci-field-label" htmlFor="napMinutes">Ile minut</label>
              <input
                id="napMinutes"
                type="number"
                className="ci-input ci-input-sm"
                min={0}
                max={300}
                step={5}
                value={form.napMinutes ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  set("napMinutes", v === "" ? undefined : parseInt(v, 10));
                }}
              />
            </div>
          )}
        </section>

        {/* === SESJA 11 M2 v2: Screen time — pickery + zrzut ekranu per docx [1040] === */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Czas przed ekranem dziś</h2>
          <div className="screen-time-picker">
            <div className="ci-field">
              <label className="ci-field-label" htmlFor="screen-time-hours">Godziny</label>
              <select
                id="screen-time-hours"
                className="ci-input"
                value={Math.floor((form.screenTimeMinutes ?? 0) / 60)}
                onChange={(e) => {
                  const h = parseInt(e.target.value, 10);
                  const m = (form.screenTimeMinutes ?? 0) % 60;
                  set("screenTimeMinutes", h * 60 + m);
                }}
                style={{ minWidth: 80 }}
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div className="ci-field">
              <label className="ci-field-label" htmlFor="screen-time-minutes">Minuty</label>
              <select
                id="screen-time-minutes"
                className="ci-input"
                value={(form.screenTimeMinutes ?? 0) % 60}
                onChange={(e) => {
                  const m = parseInt(e.target.value, 10);
                  const h = Math.floor((form.screenTimeMinutes ?? 0) / 60);
                  set("screenTimeMinutes", h * 60 + m);
                }}
                style={{ minWidth: 80 }}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, "0")}</option>
                ))}
              </select>
            </div>
            {form.screenTimeMinutes !== undefined && form.screenTimeMinutes > 0 && (
              <button
                type="button"
                className="login-link-btn"
                style={{ width: "auto", marginLeft: 8, alignSelf: "flex-end" }}
                onClick={() => set("screenTimeMinutes", undefined)}
              >
                Wyczyść
              </button>
            )}
          </div>

          {/* Sesja 19 Krok 12: usunięto upload zrzutu ekranu (high friction, 5MB w
              ciphertext envelope, low signal). Pole screenTimeScreenshot zostaje
              w schemacie dla backwards compat starych entries. */}
        </section>

        {/* === SESJA 11 M2: Jedzenie per docx [514-530, 1042] === */}
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Jedzenie</h2>

          <div className="ci-checkbox-row">
            <label className="ci-checkbox-label">
              <input
                type="checkbox"
                checked={!!form.ateSugar}
                onChange={(e) => set("ateSugar", e.target.checked)}
              />
              Cukier / słodycze
            </label>
          </div>
          {form.ateSugar && (
            <input
              type="text"
              className="ci-input ci-input-wide ci-checkbox-note"
              placeholder="Co konkretnie? (opcjonalne)"
              maxLength={200}
              value={form.ateSugarNote ?? ""}
              onChange={(e) => set("ateSugarNote", e.target.value)}
            />
          )}
          <div className="ci-checkbox-row" style={{ marginTop: 8 }}>
            <label className="ci-checkbox-label">
              <input
                type="checkbox"
                checked={!!form.ateFastFood}
                onChange={(e) => set("ateFastFood", e.target.checked)}
              />
              Fast food
            </label>
          </div>
          {form.ateFastFood && (
            <input
              type="text"
              className="ci-input ci-input-wide ci-checkbox-note"
              placeholder="Co konkretnie? (opcjonalne)"
              maxLength={200}
              value={form.ateFastFoodNote ?? ""}
              onChange={(e) => set("ateFastFoodNote", e.target.value)}
            />
          )}
          <div className="ci-checkbox-row" style={{ marginTop: 8 }}>
            <label className="ci-checkbox-label">
              <input
                type="checkbox"
                checked={!!form.ateSweetDrinks}
                onChange={(e) => set("ateSweetDrinks", e.target.checked)}
              />
              Słodkie napoje
            </label>
          </div>
          {form.ateSweetDrinks && (
            <input
              type="text"
              className="ci-input ci-input-wide ci-checkbox-note"
              placeholder="Co konkretnie? (opcjonalne)"
              maxLength={200}
              value={form.ateSweetDrinksNote ?? ""}
              onChange={(e) => set("ateSweetDrinksNote", e.target.value)}
            />
          )}
          <div className="ci-checkbox-row" style={{ marginTop: 8 }}>
            <label className="ci-checkbox-label">
              <input
                type="checkbox"
                checked={!!form.ateProcessed}
                onChange={(e) => set("ateProcessed", e.target.checked)}
              />
              Przetworzone jedzenie
            </label>
          </div>
          {form.ateProcessed && (
            <input
              type="text"
              className="ci-input ci-input-wide ci-checkbox-note"
              placeholder="Co konkretnie? (opcjonalne)"
              maxLength={200}
              value={form.ateProcessedNote ?? ""}
              onChange={(e) => set("ateProcessedNote", e.target.value)}
            />
          )}

          {/* Sesja 19 Krok 12: usunięto checkbox "Coś innego niezdrowego" (duplikat
              z 4 kategoriami sugar/fast/sweet/processed). Pole zostaje w schemacie. */}

          {/* Godziny posilkow — sesja 14: ograniczone zakresy realistic */}
          <div className="ci-row" style={{ marginTop: 16 }}>
            <div className="ci-field">
              <span className="ci-field-label">Pierwszy posiłek</span>
              <TimePicker
                value={form.firstMealTime ?? ""}
                onChange={(v) => set("firstMealTime", v)}
                ariaLabel="Pierwszy posilek"
                minHour={9}
                maxHour={14}
              />
            </div>
            <div className="ci-field">
              <span className="ci-field-label">Ostatni posiłek</span>
              <TimePicker
                value={form.lastMealTime ?? ""}
                onChange={(v) => set("lastMealTime", v)}
                ariaLabel="Ostatni posilek"
                minHour={17}
                maxHour={23}
              />
            </div>
          </div>

          {/* Sesja 13 — liczba posiłków + podjadanie */}
          <div className="ci-field" style={{ marginTop: 12 }}>
            <span className="ci-field-label">Ile posiłków</span>
            <div className="ci-word-choice">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <label
                  key={n}
                  className={`ci-word-btn${form.mealsCount === n ? " active" : ""}`}
                >
                  <input
                    type="radio"
                    name="mealsCount"
                    checked={form.mealsCount === n}
                    onChange={() => set("mealsCount", n)}
                    className="sr-only"
                  />
                  {n}
                </label>
              ))}
            </div>
          </div>

          <div className="ci-field" style={{ marginTop: 12 }}>
            <span className="ci-field-label">Podjadałem między posiłkami</span>
            <div className="ci-word-choice">
              {([
                { val: false, label: "nie" },
                { val: true, label: "tak" },
              ] as const).map(({ val, label }) => (
                <label
                  key={label}
                  className={`ci-word-btn${form.snackedBetweenMeals === val ? " active" : ""}`}
                >
                  <input
                    type="radio"
                    name="snackedBetweenMeals"
                    checked={form.snackedBetweenMeals === val}
                    onChange={() => set("snackedBetweenMeals", val)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </section>

        {error && <p className="login-error">{error}</p>}

        <div className="ci-actions">
          <button
            type="button"
            className="bv1-btn bv1-btn-primary"
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saving ? "Zapisuję…" : saved ? "Zapisano ✓ — przekierowuję..." : isEditMode ? "Zaktualizuj" : "Zapisz check-out"}
          </button>
        </div>
      </div>

      {/* Sesja 19 post-handoff v3 (2026-05-06) — popup modal do zmiany statusu zadań plan dnia. */}
      <TaskStatusPopup
        open={popupTaskId !== null && popupTask !== null && popupTask !== undefined}
        taskText={popupTask?.text ?? ""}
        pendingStatus={popupPendingStatus}
        notes={popupTask ? getNotes(popupTask) : []}
        onSave={savePopupStatus}
        onCancel={closeStatusPopup}
        onEditNote={(noteId, text) => popupTaskId && editTaskNoteInPlan(popupTaskId, noteId, text)}
        onDeleteNote={(noteId) => popupTaskId && deleteTaskNoteInPlan(popupTaskId, noteId)}
      />

      {/* Popup dla Sharpen Saw zadań. */}
      <TaskStatusPopup
        open={sawPopupTaskId !== null && sawPopupTask !== null}
        taskText={sawPopupTask?.text ?? ""}
        pendingStatus={sawPopupPendingStatus}
        notes={sawPopupTask ? getNotes(sawPopupTask) : []}
        onSave={saveSawPopupStatusCheckOut}
        onCancel={closeSawStatusPopupCheckOut}
        onEditNote={(noteId, text) => {
          if (sawPopupDim && sawPopupTaskId) {
            persistSawTaskMutationCheckOut(sawPopupDim, sawPopupTaskId, (t) => editNote(t, noteId, text));
          }
        }}
        onDeleteNote={(noteId) => {
          if (sawPopupDim && sawPopupTaskId) {
            persistSawTaskMutationCheckOut(sawPopupDim, sawPopupTaskId, (t) => deleteNote(t, noteId));
          }
        }}
      />

      {/* Sesja 19 post-handoff v4 (2026-05-06) — popup dla Q2 priorytetów + Inne zadań. */}
      <TaskStatusPopup
        open={weeklyPopupKind !== null && weeklyPopupTaskCheckOut !== null}
        taskText={weeklyPopupTaskCheckOut?.text ?? ""}
        pendingStatus={weeklyPopupPendingStatus}
        notes={weeklyPopupTaskCheckOut?.notes ?? []}
        onSave={saveWeeklyPopupStatusCheckOut}
        onCancel={closeWeeklyPopupCheckOut}
        onEditNote={(noteId, text) => {
          persistWeeklyMutationCheckOut((w) => {
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
          persistWeeklyMutationCheckOut((w) => {
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

export function BoldV1CheckOutClient(props: Props) {
  return (
    <BoldV1PassphraseGate>
      <CheckOutContent {...props} />
    </BoldV1PassphraseGate>
  );
}
