// Pure formatter — encrypted entries deserialized client-side, then aggregated to markdown
// for the weekly-review skill. KISS: skip undefined/empty fields, no enrichment.

export interface CheckInData {
  sleepBedtime?: string;
  sleepWakeup?: string;
  sleepQuality?: number;
  sleepNightWake?: boolean;
  sleepNightWakeReason?: string;
  sleepFeelings?: string;
  slowWakeUp?: boolean;
  wokeUpWithAlarm?: boolean;
  minutesLayingAfter?: number;
  energyLevel?: number;
  energyWord?: string;
  energyWordNote?: string;
  moodWord?: string;
  moodWordNote?: string;
  intentions?: string;
  excitedAbout?: string;
  worriedAbout?: string;
  firstAction?: string;
  mainPriority?: string;
  phoneBeforeSleep?: boolean;
  phoneAfterWake?: boolean;
  waterAfterWake?: boolean;
  sunlightFirstHour?: boolean;
  resistance?: string;
}

export interface CheckOutData {
  energyEndWord?: string;
  energyEndWordNote?: string;
  moodWord?: string;
  moodWordNote?: string;
  whatWorked?: string;
  whatFailed?: string;
  whatDiscovered?: string;
  eveningReview?: string;
  eveningReviewWorked?: boolean;
  eveningReviewFailed?: boolean;
  eveningReviewDiscovered?: boolean;
  nonFictionQuestion?: string;
  nonFictionTakeaway?: string;
  stretching?: boolean;
  stretchingNote?: string;
  cycling?: boolean;
  cyclingKm?: string;
  cyclingNote?: string;
  gym?: boolean;
  gymType?: string;
  gymNote?: string;
  acupressureMat?: boolean;
  acupressureMatNote?: string;
  otherActivity?: string;
  nonFictionRead?: boolean;
  nonFictionTitle?: string;
  nonFictionNote?: string;
  oneSentence?: string;
  constitutionAdherence?: string;
  constitutionAdherenceNote?: string;
  shadow?: string;
  shadows?: string[];
  shadowsNote?: string;
  proactivity?: number;
  flow?: boolean;
  flowWhen?: string;
  knowledgeApplied?: string;
  knowledgeAppliedNote?: string;
  screenTimeMinutes?: number;
  unhealthyFood?: boolean;
  unhealthyFoodNote?: string;
  ateSugar?: boolean;
  ateSugarNote?: string;
  ateFastFood?: boolean;
  ateFastFoodNote?: string;
  ateSweetDrinks?: boolean;
  ateSweetDrinksNote?: string;
  ateProcessed?: boolean;
  ateProcessedNote?: string;
  firstMealTime?: string;
  lastMealTime?: string;
  mealsCount?: number;
  snackedBetweenMeals?: boolean;
  napTaken?: boolean;
  napMinutes?: number;
  extraOutsidePlan?: string;
}

export interface QuickTickFlags {
  stretching?: boolean;
  gym?: boolean;
  cycling?: boolean;
  nonFiction?: boolean;
  fiction?: boolean;
  acupressureMat?: boolean;
  other?: boolean;
  otherText?: string;
  otherTexts?: string[];
}

export interface DayPlanTask {
  text: string;
  status?: string;
  done?: boolean;
  startTime?: string;
  endTime?: string;
  note?: string;
}

export interface DayPlanData {
  notes?: string;
  tasks?: DayPlanTask[];
}

export interface SharpenSawDimensions {
  physical: string;
  mental: string;
  social: string;
  spiritual: string;
}

export interface WeekPlanTask {
  text: string;
  status?: string;
  done?: boolean;
  startTime?: string;
  endTime?: string;
  note?: string;
}

export interface WeekPlanData {
  theme?: string;
  priorities?: string[];
  otherTasks?: string[];
  days?: WeekPlanTask[][];
  notes?: string;
  sharpenSaw?: SharpenSawDimensions;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  weekdayLabel: string; // "Poniedziałek"
  checkIn: CheckInData | null;
  checkOut: CheckOutData | null;
  quickTick: QuickTickFlags | null;
  dayPlan: DayPlanData | null;
}

export interface WeeklyData {
  isoYear: number;
  isoWeek: number;
  weekLabel: string; // "Tydzień 18 · 27 kwietnia – 3 maja 2026"
  mondayDate: string;
  sundayDate: string;
  weekPlan: WeekPlanData | null;
  days: DayEntry[]; // 7 entries, Mon..Sun
}

const SECTION_DIVIDER = "---";

function nz(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function yn(b: boolean | undefined): string {
  if (b === true) return "tak";
  if (b === false) return "nie";
  return "—";
}

function withNote(value: string, note?: string): string {
  return nz(note) ? `${value} — ${note.trim()}` : value;
}

function statusLabel(t: { status?: string; done?: boolean }): string {
  if (t.status === "done") return "zrobione";
  if (t.status === "partial") return "częściowo";
  if (t.status === "skipped") return "pominięte";
  if (t.status === "todo") return "do zrobienia";
  if (t.done === true) return "zrobione";
  if (t.done === false) return "do zrobienia";
  return "—";
}

function formatTimeRange(t: { startTime?: string; endTime?: string }): string {
  if (nz(t.startTime) && nz(t.endTime)) return ` (${t.startTime}–${t.endTime})`;
  if (nz(t.startTime)) return ` (${t.startTime})`;
  return "";
}

function pushIf(out: string[], cond: boolean, line: string): void {
  if (cond) out.push(line);
}

function renderWeekPlan(plan: WeekPlanData | null): string[] {
  const out: string[] = [];
  if (!plan) {
    out.push("## Plan tygodnia");
    out.push("Brak planu tygodnia.");
    out.push(SECTION_DIVIDER);
    return out;
  }
  out.push("## Plan tygodnia");
  if (nz(plan.theme)) out.push(`**Temat:** ${plan.theme.trim()}`);

  const prio = (plan.priorities ?? []).map((p) => p.trim()).filter((p) => p.length > 0);
  if (prio.length > 0) {
    out.push("");
    out.push("**Priorytety (Q2 — Covey):**");
    prio.forEach((p, i) => out.push(`${i + 1}. ${p}`));
  }

  const others = (plan.otherTasks ?? []).map((t) => t.trim()).filter((t) => t.length > 0);
  if (others.length > 0) {
    out.push("");
    out.push("**Inne zadania:**");
    others.forEach((t) => out.push(`- ${t}`));
  }

  const ss = plan.sharpenSaw;
  if (ss && (nz(ss.physical) || nz(ss.mental) || nz(ss.social) || nz(ss.spiritual))) {
    out.push("");
    out.push("**Sharpen Saw (Habit #7):**");
    if (nz(ss.physical)) out.push(`- Fizyczny: ${ss.physical.trim()}`);
    if (nz(ss.mental)) out.push(`- Mentalny: ${ss.mental.trim()}`);
    if (nz(ss.social)) out.push(`- Społeczny: ${ss.social.trim()}`);
    if (nz(ss.spiritual)) out.push(`- Duchowy: ${ss.spiritual.trim()}`);
  }

  if (nz(plan.notes)) {
    out.push("");
    out.push("**Notatki:**");
    out.push(plan.notes.trim());
  }
  out.push(SECTION_DIVIDER);
  return out;
}

function renderCheckIn(ci: CheckInData | null): string[] {
  const out: string[] = ["### Check-in"];
  if (!ci) {
    out.push("Brak check-in.");
    return out;
  }

  // Sleep
  const sleepParts: string[] = [];
  if (nz(ci.sleepBedtime) && nz(ci.sleepWakeup)) {
    sleepParts.push(`${ci.sleepBedtime}–${ci.sleepWakeup}`);
  } else if (nz(ci.sleepBedtime)) {
    sleepParts.push(`zaśnięcie ${ci.sleepBedtime}`);
  } else if (nz(ci.sleepWakeup)) {
    sleepParts.push(`pobudka ${ci.sleepWakeup}`);
  }
  if (typeof ci.sleepQuality === "number") sleepParts.push(`jakość ${ci.sleepQuality}/5`);
  if (ci.sleepNightWake === true) {
    sleepParts.push(
      nz(ci.sleepNightWakeReason)
        ? `budził się (czemu: ${ci.sleepNightWakeReason.trim()})`
        : "budził się w nocy"
    );
  }
  if (sleepParts.length > 0) out.push(`- Sen: ${sleepParts.join(", ")}`);
  if (nz(ci.sleepFeelings)) out.push(`- Po pobudce (samopoczucie): ${ci.sleepFeelings.trim()}`);

  // Wake style
  const wakeParts: string[] = [];
  if (ci.wokeUpWithAlarm === true) wakeParts.push("z budzikiem");
  else if (ci.wokeUpWithAlarm === false) wakeParts.push("naturalnie");
  if (ci.slowWakeUp === true && typeof ci.minutesLayingAfter === "number") {
    wakeParts.push(`leżał po pobudce ${ci.minutesLayingAfter} min`);
  }
  if (wakeParts.length > 0) out.push(`- Pobudka: ${wakeParts.join(", ")}`);

  // Energy / mood
  if (nz(ci.energyWord) || typeof ci.energyLevel === "number") {
    const parts: string[] = [];
    if (nz(ci.energyWord)) parts.push(ci.energyWord.trim());
    if (typeof ci.energyLevel === "number") parts.push(`${ci.energyLevel}/5`);
    out.push(`- Energia start: ${withNote(parts.join(" · "), ci.energyWordNote)}`);
  }
  if (nz(ci.moodWord)) {
    out.push(`- Nastrój: ${withNote(ci.moodWord.trim(), ci.moodWordNote)}`);
  }

  // Habits
  const habits: string[] = [];
  if (ci.phoneBeforeSleep !== undefined) habits.push(`telefon przed snem: ${yn(ci.phoneBeforeSleep)}`);
  if (ci.phoneAfterWake !== undefined) habits.push(`po pobudce: ${yn(ci.phoneAfterWake)}`);
  if (ci.waterAfterWake !== undefined) habits.push(`woda: ${yn(ci.waterAfterWake)}`);
  if (ci.sunlightFirstHour !== undefined) habits.push(`słońce 1h: ${yn(ci.sunlightFirstHour)}`);
  if (habits.length > 0) out.push(`- Nawyki: ${habits.join(", ")}`);

  // Intentions
  if (nz(ci.mainPriority)) out.push(`- Główny priorytet: ${ci.mainPriority.trim()}`);
  if (nz(ci.excitedAbout)) out.push(`- Co napędza: ${ci.excitedAbout.trim()}`);
  if (nz(ci.worriedAbout)) out.push(`- Co stresuje: ${ci.worriedAbout.trim()}`);
  if (nz(ci.firstAction)) out.push(`- Pierwsza akcja: ${ci.firstAction.trim()}`);
  if (nz(ci.resistance)) out.push(`- Resistance: ${ci.resistance.trim()}`);
  if (nz(ci.intentions)) out.push(`- Intencje (legacy): ${ci.intentions.trim()}`);

  return out;
}

function renderQuickTicks(t: QuickTickFlags | null): string[] {
  const out: string[] = ["### Quick-ticks (mid-day)"];
  if (!t) {
    out.push("Brak quick-ticks.");
    return out;
  }
  const items: { key: keyof QuickTickFlags; label: string }[] = [
    { key: "stretching", label: "Rozciąganie" },
    { key: "gym", label: "Siłownia" },
    { key: "cycling", label: "Rower" },
    { key: "nonFiction", label: "Czytanie non-fiction" },
    { key: "fiction", label: "Czytanie fikcji" },
    { key: "acupressureMat", label: "Mata akupresury" },
    { key: "other", label: "Inne" },
  ];
  let any = false;
  for (const { key, label } of items) {
    const v = t[key];
    if (typeof v === "boolean") {
      out.push(`- [${v ? "x" : " "}] ${label}`);
      any = true;
    }
  }
  const otherTexts = (t.otherTexts ?? []).map((s) => s.trim()).filter((s) => s.length > 0);
  if (otherTexts.length > 0) {
    out.push(`- Inne (szczegóły): ${otherTexts.join("; ")}`);
    any = true;
  } else if (nz(t.otherText)) {
    out.push(`- Inne (szczegóły): ${t.otherText.trim()}`);
    any = true;
  }
  if (!any) out.push("Brak quick-ticks.");
  return out;
}

function renderCheckOut(co: CheckOutData | null): string[] {
  const out: string[] = ["### Check-out"];
  if (!co) {
    out.push("Brak check-out.");
    return out;
  }

  if (nz(co.energyEndWord)) {
    out.push(`- Energia koniec: ${withNote(co.energyEndWord.trim(), co.energyEndWordNote)}`);
  }
  if (nz(co.moodWord)) {
    out.push(`- Nastrój koniec: ${withNote(co.moodWord.trim(), co.moodWordNote)}`);
  }
  // SKIP_NOISE = świadomy skip (anti-performative learning, weekly review widzi sygnał).
  if (co.eveningReview === "SKIP_NOISE") {
    out.push(`- Refleksja wieczorna: _świadomy skip (Nic dziś)_`);
  } else if (nz(co.eveningReview)) {
    const tags: string[] = [];
    if (co.eveningReviewWorked) tags.push("✓zadziałało");
    if (co.eveningReviewFailed) tags.push("✗nie wyszło");
    if (co.eveningReviewDiscovered) tags.push("💡odkryłem");
    const tagStr = tags.length > 0 ? ` [${tags.join(", ")}]` : "";
    out.push(`- Refleksja wieczorna${tagStr}: ${co.eveningReview.trim()}`);
  } else {
    if (nz(co.whatWorked)) out.push(`- Co działało: ${co.whatWorked.trim()}`);
    if (nz(co.whatFailed)) out.push(`- Co nie wyszło: ${co.whatFailed.trim()}`);
    if (nz(co.whatDiscovered)) out.push(`- Co odkrył: ${co.whatDiscovered.trim()}`);
  }
  if (nz(co.oneSentence)) out.push(`- One-liner: ${co.oneSentence.trim()}`);

  if (co.constitutionAdherence === "unknown") {
    out.push(`- Adherence Konstytucja: ${withNote("nie wiem", co.constitutionAdherenceNote)}`);
  } else if (nz(co.constitutionAdherence)) {
    out.push(
      `- Adherence Konstytucja: ${withNote(co.constitutionAdherence.trim(), co.constitutionAdherenceNote)}`
    );
  }

  // Shadows
  const shadowsList = (co.shadows ?? []).map((s) => s.trim()).filter((s) => s.length > 0);
  const legacyShadow = nz(co.shadow) ? co.shadow.trim() : "";
  const allShadows = shadowsList.length > 0 ? shadowsList : (legacyShadow ? [legacyShadow] : []);
  if (allShadows.length > 0) {
    out.push(`- Cienie: ${withNote(allShadows.join(", "), co.shadowsNote)}`);
  } else if (nz(co.shadowsNote)) {
    out.push(`- Cienie: — (notatka: ${co.shadowsNote.trim()})`);
  }

  if (co.proactivity === -1) {
    out.push(`- Proaktywność: nie wiem`);
  } else if (typeof co.proactivity === "number" && co.proactivity > 0) {
    out.push(`- Proaktywność: ${co.proactivity}/5`);
  }
  if (co.flow === true) {
    out.push(nz(co.flowWhen) ? `- Flow: tak (kiedy: ${co.flowWhen.trim()})` : `- Flow: tak`);
  } else if (co.flow === false) {
    out.push(`- Flow: nie`);
  }

  if (nz(co.knowledgeApplied)) {
    out.push(`- Wiedza zastosowana: ${withNote(co.knowledgeApplied.trim(), co.knowledgeAppliedNote)}`);
  }

  // Activities
  const acts: string[] = [];
  if (co.stretching === true) acts.push(withNote("rozciąganie", co.stretchingNote));
  if (co.cycling === true) {
    const km = nz(co.cyclingKm) ? ` ${co.cyclingKm.trim()} km` : "";
    acts.push(withNote(`rower${km}`, co.cyclingNote));
  }
  if (co.gym === true) {
    const t = nz(co.gymType) ? ` (${co.gymType.trim()})` : "";
    acts.push(withNote(`siłownia${t}`, co.gymNote));
  }
  if (co.acupressureMat === true) acts.push(withNote("mata akupresury", co.acupressureMatNote));
  if (co.nonFictionRead === true) {
    const title = nz(co.nonFictionTitle) ? ` "${co.nonFictionTitle.trim()}"` : "";
    acts.push(withNote(`non-fiction${title}`, co.nonFictionNote));
    if (nz(co.nonFictionQuestion)) {
      out.push(`- Pytanie z lektury: ${co.nonFictionQuestion.trim()}`);
    }
    if (nz(co.nonFictionTakeaway)) {
      out.push(`- Z lektury zostaje: ${co.nonFictionTakeaway.trim()}`);
    }
  }
  if (nz(co.otherActivity)) acts.push(`inne: ${co.otherActivity.trim()}`);
  if (acts.length > 0) out.push(`- Aktywności: ${acts.join("; ")}`);

  // Meals
  const meal: string[] = [];
  if (typeof co.mealsCount === "number") meal.push(`${co.mealsCount} posiłków`);
  if (nz(co.firstMealTime)) meal.push(`pierwszy ${co.firstMealTime}`);
  if (nz(co.lastMealTime)) meal.push(`ostatni ${co.lastMealTime}`);
  if (co.snackedBetweenMeals !== undefined) meal.push(`snacking: ${yn(co.snackedBetweenMeals)}`);
  if (meal.length > 0) out.push(`- Posiłki: ${meal.join(", ")}`);

  // Unhealthy
  const bad: string[] = [];
  if (co.ateSugar === true) bad.push(withNote("cukier", co.ateSugarNote));
  if (co.ateFastFood === true) bad.push(withNote("fast food", co.ateFastFoodNote));
  if (co.ateSweetDrinks === true) bad.push(withNote("słodkie napoje", co.ateSweetDrinksNote));
  if (co.ateProcessed === true) bad.push(withNote("przetworzone", co.ateProcessedNote));
  if (bad.length > 0) {
    out.push(`- Niezdrowe jedzenie: ${withNote(bad.join("; "), co.unhealthyFoodNote)}`);
  } else if (co.unhealthyFood === true && nz(co.unhealthyFoodNote)) {
    out.push(`- Niezdrowe jedzenie: ${co.unhealthyFoodNote.trim()}`);
  }

  // Nap
  if (co.napTaken === true) {
    out.push(
      typeof co.napMinutes === "number"
        ? `- Drzemka: tak (${co.napMinutes} min)`
        : `- Drzemka: tak`
    );
  } else if (co.napTaken === false) {
    out.push(`- Drzemka: nie`);
  }

  if (typeof co.screenTimeMinutes === "number") {
    out.push(`- Czas ekranu: ${co.screenTimeMinutes} min`);
  }
  if (nz(co.extraOutsidePlan)) out.push(`- Poza planem: ${co.extraOutsidePlan.trim()}`);

  return out;
}

function renderDayPlan(plan: DayPlanData | null, weekDayTasks: WeekPlanTask[] | undefined): string[] {
  const out: string[] = ["### Plan dnia / wykonanie"];
  const tasks: WeekPlanTask[] = (weekDayTasks ?? []).filter((t) => nz(t.text));
  const dayNotes = nz(plan?.notes ?? "") ? plan!.notes!.trim() : "";

  if (tasks.length === 0 && !dayNotes) {
    out.push("Brak planu dnia.");
    return out;
  }

  tasks.forEach((t, i) => {
    const range = formatTimeRange(t);
    const status = statusLabel(t);
    const note = nz(t.note) ? ` (${t.note.trim()})` : "";
    out.push(`- [${i + 1}] "${t.text.trim()}"${range} → ${status}${note}`);
  });

  if (dayNotes) {
    out.push(`- Notatki dnia: ${dayNotes}`);
  }
  return out;
}

export function dayHasAnyData(d: DayEntry): boolean {
  return d.checkIn !== null || d.checkOut !== null || d.quickTick !== null || d.dayPlan !== null;
}

function renderDay(d: DayEntry, weekPlan: WeekPlanData | null, dayIdxMon0: number): string[] {
  const out: string[] = [];
  out.push(`## ${d.weekdayLabel} ${d.date}`);
  if (!dayHasAnyData(d) && !(weekPlan?.days?.[dayIdxMon0]?.length)) {
    out.push("Brak wpisów na ten dzień.");
    out.push(SECTION_DIVIDER);
    return out;
  }
  out.push("");
  out.push(...renderCheckIn(d.checkIn));
  out.push("");
  out.push(...renderQuickTicks(d.quickTick));
  out.push("");
  out.push(...renderCheckOut(d.checkOut));
  out.push("");
  out.push(...renderDayPlan(d.dayPlan, weekPlan?.days?.[dayIdxMon0]));
  out.push(SECTION_DIVIDER);
  return out;
}

export function weeklyDataToMarkdown(data: WeeklyData): string {
  const out: string[] = [];
  out.push(
    `# ${data.weekLabel} (${data.mondayDate} → ${data.sundayDate})`
  );
  out.push(`_ISO ${data.isoYear}-W${String(data.isoWeek).padStart(2, "0")}_`);
  out.push("");

  out.push(...renderWeekPlan(data.weekPlan));
  out.push("");

  data.days.forEach((d, idx) => {
    out.push(...renderDay(d, data.weekPlan, idx));
    out.push("");
  });

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
