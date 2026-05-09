import { describe, expect, it } from "vitest";
import {
  weeklyDataToMarkdown,
  dayHasAnyData,
  type WeeklyData,
  type DayEntry,
  type CheckInData,
  type CheckOutData,
} from "../markdown";

const WEEKDAYS = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

function emptyDay(date: string, idx: number): DayEntry {
  return {
    date,
    weekdayLabel: WEEKDAYS[idx],
    checkIn: null,
    checkOut: null,
    quickTick: null,
    dayPlan: null,
  };
}

function baseWeek(overrides: Partial<WeeklyData> = {}): WeeklyData {
  const days: DayEntry[] = [
    emptyDay("2026-04-27", 0),
    emptyDay("2026-04-28", 1),
    emptyDay("2026-04-29", 2),
    emptyDay("2026-04-30", 3),
    emptyDay("2026-05-01", 4),
    emptyDay("2026-05-02", 5),
    emptyDay("2026-05-03", 6),
  ];
  return {
    isoYear: 2026,
    isoWeek: 18,
    weekLabel: "Tydzień 18 · 27 kwietnia – 3 maja 2026",
    mondayDate: "2026-04-27",
    sundayDate: "2026-05-03",
    weekPlan: null,
    days,
    ...overrides,
  };
}

describe("weeklyDataToMarkdown", () => {
  it("renders header with week label and ISO week tag", () => {
    const md = weeklyDataToMarkdown(baseWeek());
    expect(md).toContain("# Tydzień 18 · 27 kwietnia – 3 maja 2026 (2026-04-27 → 2026-05-03)");
    expect(md).toContain("_ISO 2026-W18_");
  });

  it("renders all 7 weekday sections in order", () => {
    const md = weeklyDataToMarkdown(baseWeek());
    const idx = WEEKDAYS.map((d) => md.indexOf(`## ${d}`));
    expect(idx.every((i) => i >= 0)).toBe(true);
    for (let i = 1; i < idx.length; i++) {
      expect(idx[i]).toBeGreaterThan(idx[i - 1]);
    }
  });

  it("shows 'Brak planu tygodnia' when weekPlan is null", () => {
    const md = weeklyDataToMarkdown(baseWeek());
    expect(md).toContain("## Plan tygodnia");
    expect(md).toContain("Brak planu tygodnia.");
  });

  it("renders week priorities numbered, skipping empty entries", () => {
    const md = weeklyDataToMarkdown(
      baseWeek({
        weekPlan: {
          theme: "Ostrzenie piły",
          priorities: ["Czytanie 30min", "", "Trening 3x"],
          otherTasks: [],
          days: [[], [], [], [], [], [], []],
          notes: "",
        },
      })
    );
    expect(md).toContain("**Temat:** Ostrzenie piły");
    expect(md).toContain("1. Czytanie 30min");
    expect(md).toContain("2. Trening 3x");
    expect(md).not.toMatch(/^3\. /m);
  });

  it("renders Sharpen Saw with all 4 dimensions when any present", () => {
    const md = weeklyDataToMarkdown(
      baseWeek({
        weekPlan: {
          priorities: [],
          otherTasks: [],
          days: [[], [], [], [], [], [], []],
          sharpenSaw: {
            physical: "3x gym",
            mental: "Atomic Habits",
            social: "",
            spiritual: "",
          },
          notes: "",
        },
      })
    );
    expect(md).toContain("**Sharpen Saw (Habit #7):**");
    expect(md).toContain("- Fizyczny: 3x gym");
    expect(md).toContain("- Mentalny: Atomic Habits");
    expect(md).not.toContain("- Społeczny:");
    expect(md).not.toContain("- Duchowy:");
  });

  it("skips undefined check-in fields (only includes what has value)", () => {
    const ci: CheckInData = {
      sleepBedtime: "23:30",
      sleepWakeup: "07:00",
      sleepQuality: 4,
      energyWord: "średnia",
      mainPriority: "dokończyć eksport",
    };
    const days = baseWeek().days;
    days[0] = { ...days[0], checkIn: ci };
    const md = weeklyDataToMarkdown(baseWeek({ days }));

    expect(md).toContain("- Sen: 23:30–07:00, jakość 4/5");
    expect(md).toContain("- Energia start: średnia");
    expect(md).toContain("- Główny priorytet: dokończyć eksport");
    // not present fields
    expect(md).not.toContain("- Nastrój:");
    expect(md).not.toContain("- Resistance:");
    expect(md).not.toContain("- Pierwsza akcja:");
  });

  it("renders night wake reason when sleepNightWake=true", () => {
    const ci: CheckInData = {
      sleepNightWake: true,
      sleepNightWakeReason: "głośny hałas",
    };
    const days = baseWeek().days;
    days[0] = { ...days[0], checkIn: ci };
    const md = weeklyDataToMarkdown(baseWeek({ days }));
    expect(md).toContain("budził się (czemu: głośny hałas)");
  });

  it("renders shadows list with note", () => {
    const co: CheckOutData = {
      shadows: ["Trans dopaminowy", "Multitasking w tle"],
      shadowsNote: "reddit 2h przed snem",
    };
    const days = baseWeek().days;
    days[2] = { ...days[2], checkOut: co };
    const md = weeklyDataToMarkdown(baseWeek({ days }));
    expect(md).toContain("- Cienie: Trans dopaminowy, Multitasking w tle — reddit 2h przed snem");
  });

  it("renders flow with kiedy when flow=true and flowWhen present", () => {
    const co: CheckOutData = { flow: true, flowWhen: "10:00-12:00 coding" };
    const days = baseWeek().days;
    days[1] = { ...days[1], checkOut: co };
    const md = weeklyDataToMarkdown(baseWeek({ days }));
    expect(md).toContain("- Flow: tak (kiedy: 10:00-12:00 coding)");
  });

  it("renders quick-ticks as checkbox list", () => {
    const days = baseWeek().days;
    days[0] = {
      ...days[0],
      quickTick: { stretching: true, gym: false, cycling: true, otherTexts: ["spacer 30 min"] },
    };
    const md = weeklyDataToMarkdown(baseWeek({ days }));
    expect(md).toContain("- [x] Rozciąganie");
    expect(md).toContain("- [ ] Siłownia");
    expect(md).toContain("- [x] Rower");
    expect(md).toContain("- Inne (szczegóły): spacer 30 min");
  });

  it("renders day plan tasks with status labels", () => {
    const md = weeklyDataToMarkdown(
      baseWeek({
        weekPlan: {
          priorities: [],
          otherTasks: [],
          days: [
            [
              { text: "Eksport widget", status: "done" },
              { text: "Email", status: "skipped", note: "zapomniałem" },
            ],
            [], [], [], [], [], [],
          ],
          notes: "",
        },
      })
    );
    expect(md).toContain('- [1] "Eksport widget" → zrobione');
    expect(md).toContain('- [2] "Email" → pominięte (zapomniałem)');
  });

  it("handles a fully empty week without crashing", () => {
    const md = weeklyDataToMarkdown(baseWeek());
    expect(md).toContain("Brak planu tygodnia.");
    // 7 days × "Brak wpisów na ten dzień." OR per-section "Brak ..."
    expect(md.match(/Brak/g)?.length ?? 0).toBeGreaterThanOrEqual(7);
  });

  it("renders 'Proaktywność: nie wiem' when proactivity === -1 (Pomysł #20)", () => {
    const co: CheckOutData = { proactivity: -1 };
    const days = baseWeek().days;
    days[0] = { ...days[0], checkOut: co };
    const md = weeklyDataToMarkdown(baseWeek({ days }));
    expect(md).toContain("- Proaktywność: nie wiem");
    expect(md).not.toContain("/5");
  });

  it("skips proactivity when 0 (not selected) and renders normal value when 1-5", () => {
    const days = baseWeek().days;
    days[0] = { ...days[0], checkOut: { proactivity: 0 } };
    days[1] = { ...days[1], checkOut: { proactivity: 4 } };
    const md = weeklyDataToMarkdown(baseWeek({ days }));
    expect(md).toContain("- Proaktywność: 4/5");
    // proactivity: 0 should not render at all
    const monSection = md.split("## Wtorek")[0];
    expect(monSection).not.toContain("Proaktywność");
  });

  it("renders 'Adherence Konstytucja: nie wiem' when constitutionAdherence === 'unknown' (Pomysł #20)", () => {
    const co: CheckOutData = { constitutionAdherence: "unknown" };
    const days = baseWeek().days;
    days[0] = { ...days[0], checkOut: co };
    const md = weeklyDataToMarkdown(baseWeek({ days }));
    expect(md).toContain("- Adherence Konstytucja: nie wiem");
  });

  it("renders 'Adherence Konstytucja: nie wiem — <note>' when 'unknown' + note", () => {
    const co: CheckOutData = {
      constitutionAdherence: "unknown",
      constitutionAdherenceNote: "trudno powiedzieć dziś",
    };
    const days = baseWeek().days;
    days[0] = { ...days[0], checkOut: co };
    const md = weeklyDataToMarkdown(baseWeek({ days }));
    expect(md).toContain("- Adherence Konstytucja: nie wiem — trudno powiedzieć dziś");
  });

  it("dayHasAnyData returns true when at least one entry exists", () => {
    const d = emptyDay("2026-04-27", 0);
    expect(dayHasAnyData(d)).toBe(false);
    expect(dayHasAnyData({ ...d, checkIn: { mainPriority: "x" } })).toBe(true);
  });
});
