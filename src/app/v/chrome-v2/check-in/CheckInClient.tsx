"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { ChromeV2PassphraseGate } from "@/components/v/chrome-v2/PassphraseGate";
import { ChromeV2Hero } from "@/components/v/chrome-v2/Hero";
import { Button } from "@/components/v/chrome-v2/Button";
import { Input } from "@/components/v/chrome-v2/Input";
import { Textarea } from "@/components/v/chrome-v2/Textarea";
import { FormGroup } from "@/components/v/chrome-v2/FormGroup";
import { Likert4Faces, type Likert4Value } from "@/components/v/chrome-v2/Likert4Faces";
import { TimePicker } from "@/components/TimePicker";
import { TagPicker } from "@/components/TagPicker";
import { TaskChips } from "@/components/TaskChips";
import { applyLegacyMood, LEGACY_MOOD_MAP_IN } from "@/lib/journal/legacy-migration";
import { encrypt, decrypt } from "@/lib/crypto/aes";
import { saveEntry } from "@/lib/supabase/entries";
import type { EntryMeta } from "@/lib/supabase/entries";
import type { PlanRow } from "@/lib/supabase/plans";
import { taskStatus, type TaskStatus } from "@/lib/plan/task-status";
import { getLogicalDateString } from "@/lib/date/day-boundary";
import { dayIndexMon0 } from "@/lib/date/period";
import { appendTag } from "@/lib/utils/text";

const pad3 = (n: number): string => String(n).padStart(3, "0");

interface CheckInData {
  sleepBedtime: string;
  sleepWakeup: string;
  sleepQuality: number;
  sleepNightWake: boolean;
  sleepNightWakeReason?: string;
  slowWakeUp?: boolean;
  wokeUpWithAlarm?: boolean;
  minutesLayingAfter?: number;
  sleepFeelings: string;
  energyLevel: number;
  energyWord: string;
  energyWordNote?: string;
  moodWord: string;
  moodWordNote?: string;
  intentions: string;
  excitedAbout: string;
  worriedAbout: string;
  firstAction: string;
  mainPriority?: string;
  phoneBeforeSleep?: boolean;
  phoneAfterWake?: boolean;
  waterAfterWake?: boolean;
  sunlightFirstHour?: boolean;
  resistance?: string;
  morningIntention?: string;
  mainPriorityQuadrant?: "q1" | "q2" | "q3" | "q4";
}

const DEFAULT_DATA: CheckInData = {
  sleepBedtime: "",
  sleepWakeup: "",
  sleepQuality: 0,
  sleepNightWake: false,
  sleepNightWakeReason: "",
  slowWakeUp: undefined,
  wokeUpWithAlarm: undefined,
  minutesLayingAfter: undefined,
  sleepFeelings: "",
  energyLevel: 0,
  energyWord: "",
  moodWord: "",
  intentions: "",
  excitedAbout: "",
  worriedAbout: "",
  firstAction: "",
  mainPriority: "",
  phoneBeforeSleep: undefined,
  phoneAfterWake: undefined,
  waterAfterWake: undefined,
  sunlightFirstHour: undefined,
  resistance: "",
  morningIntention: "",
  mainPriorityQuadrant: undefined,
};

interface PlanTask {
  id: string;
  text: string;
  done?: boolean;
  status?: TaskStatus;
  startTime?: string;
  endTime?: string;
}

interface PlanPreview {
  theme: string;
  timed: PlanTask[];
  untimed: PlanTask[];
  notes: string;
}

interface Props {
  initialEntry: EntryMeta | null;
  entryDate: string;
  dayPlan: PlanRow | null;
  weekPlan: PlanRow | null;
}

const ENERGY_LABELS = {
  low: "Niska",
  ratherLow: "Raczej niska",
  ratherHigh: "Raczej wysoka",
  high: "Wysoka",
  unknown: "Nie wiem",
};
const MOOD_LABELS = {
  low: "Niski",
  ratherLow: "Raczej niski",
  ratherHigh: "Raczej wysoki",
  high: "Wysoki",
  unknown: "Nie wiem",
};

function wordToLikert(word: string, kind: "energy" | "mood"): Likert4Value {
  const e: Record<string, Likert4Value> = {
    niska: "low",
    "raczej niska": "rather-low",
    "raczej wysoka": "rather-high",
    wysoka: "high",
    unknown: "unknown",
  };
  const m: Record<string, Likert4Value> = {
    niski: "low",
    "raczej niski": "rather-low",
    "raczej wysoki": "rather-high",
    wysoki: "high",
    unknown: "unknown",
  };
  const map = kind === "energy" ? e : m;
  return map[word] ?? "unknown";
}

function likertToWord(v: Likert4Value, kind: "energy" | "mood"): string {
  if (v === "unknown") return "unknown";
  if (kind === "energy") {
    return { low: "niska", "rather-low": "raczej niska", "rather-high": "raczej wysoka", high: "wysoka" }[v];
  }
  return { low: "niski", "rather-low": "raczej niski", "rather-high": "raczej wysoki", high: "wysoki" }[v];
}

function NumberedHeader({ num, label }: { num: number; label: string }) {
  return (
    <div className="cv2-form-section-header">
      <span className="cv2-form-section-num">{pad3(num)}</span>
      <h2 className="cv2-form-section-title">{label}</h2>
    </div>
  );
}

function CheckInContent({ initialEntry, entryDate, dayPlan, weekPlan }: Props) {
  const { key } = useCryptoKey();
  const router = useRouter();
  const today = getLogicalDateString();
  const isEditingPast = entryDate !== today;

  const parseInitial = (): CheckInData => {
    if (!initialEntry || !key) return DEFAULT_DATA;
    try {
      const plaintext = decrypt(initialEntry.ciphertext, key);
      const parsed = { ...DEFAULT_DATA, ...JSON.parse(plaintext) } as CheckInData;
      parsed.moodWord = applyLegacyMood(parsed.moodWord, LEGACY_MOOD_MAP_IN);
      parsed.energyWord = applyLegacyMood(parsed.energyWord, LEGACY_MOOD_MAP_IN);
      return parsed;
    } catch {
      return DEFAULT_DATA;
    }
  };

  const [form, setForm] = useState<CheckInData>(parseInitial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const planPreview: PlanPreview | null = useMemo(() => {
    if (!key) return null;
    try {
      const ref = new Date(entryDate + "T12:00:00");
      const dayIdx = dayIndexMon0(ref);
      let theme = "";
      let timed: PlanTask[] = [];
      let untimed: PlanTask[] = [];
      let notes = "";
      if (weekPlan) {
        try {
          const weekData = JSON.parse(decrypt(weekPlan.ciphertext, key)) as {
            theme?: string;
            days?: PlanTask[][];
          };
          theme = weekData.theme ?? "";
          const dayTasks = weekData.days?.[dayIdx] ?? [];
          timed = dayTasks
            .filter((t) => t.startTime && t.endTime)
            .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
          untimed = dayTasks.filter((t) => !t.startTime || !t.endTime);
        } catch {
          /* ignore */
        }
      }
      if (dayPlan) {
        try {
          const dayData = JSON.parse(decrypt(dayPlan.ciphertext, key)) as { notes?: string };
          notes = dayData.notes ?? "";
        } catch {
          /* ignore */
        }
      }
      if (!theme && timed.length === 0 && untimed.length === 0 && !notes) return null;
      return { theme, timed, untimed, notes };
    } catch {
      return null;
    }
  }, [dayPlan, weekPlan, key, entryDate]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => {
      if (isEditingPast) {
        router.push(`/v/chrome-v2/journal/${entryDate}` as Route);
      } else {
        router.push("/v/chrome-v2/dashboard?saved=checkin" as Route);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [saved, router, isEditingPast, entryDate]);

  if (!key) return null;

  const isEditMode = !!initialEntry;

  const set = <K extends keyof CheckInData>(field: K, value: CheckInData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    const isCompletelyEmpty =
      !form.sleepBedtime &&
      !form.sleepWakeup &&
      form.sleepQuality === 0 &&
      !form.sleepFeelings &&
      form.energyLevel === 0 &&
      !form.energyWord &&
      !form.moodWord &&
      !form.excitedAbout &&
      !form.worriedAbout &&
      !form.firstAction &&
      !form.mainPriority &&
      form.phoneBeforeSleep === undefined &&
      form.phoneAfterWake === undefined &&
      form.waterAfterWake === undefined &&
      form.sunlightFirstHour === undefined &&
      !form.resistance;

    if (isCompletelyEmpty) {
      setError("Pusty formularz — wypełnij chociaż jedno pole.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const ciphertext = encrypt(JSON.stringify(form), key);
      const result = await saveEntry("checkin", entryDate, form.moodWord || null, ciphertext);
      if (result.error) throw new Error(result.error);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd zapisu.");
    } finally {
      setSaving(false);
    }
  };

  const RatingButtons = ({
    value,
    onChange,
    max = 5,
    label,
  }: {
    value: number;
    onChange: (v: number) => void;
    max?: number;
    label: string;
  }) => (
    <div className="cv2-rating-row" role="group" aria-label={label}>
      <span className="cv2-rating-label">{label}</span>
      <div className="cv2-rating-buttons">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            className={value === n ? "cv2-rating-btn is-active" : "cv2-rating-btn"}
            onClick={() => onChange(value === n ? 0 : n)}
            aria-pressed={value === n}
          >
            {pad3(n).slice(-2)}
          </button>
        ))}
      </div>
    </div>
  );

  function RadioPills<T extends string | boolean | undefined>({
    value,
    onChange,
    options,
    label,
    name,
  }: {
    value: T;
    onChange: (v: T) => void;
    options: { val: T; label: string }[];
    label: string;
    name: string;
  }) {
    return (
      <div role="group" aria-label={label}>
        <span className="cv2-rating-label">{label}</span>
        <div className="cv2-radio-row">
          {options.map((opt) => {
            const active = value === opt.val;
            return (
              <button
                key={`${name}-${String(opt.val)}`}
                type="button"
                className={active ? "cv2-radio-btn is-active" : "cv2-radio-btn"}
                onClick={() => onChange(active ? (undefined as T) : opt.val)}
                aria-pressed={active}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="cv2-form-screen">
      <ChromeV2Hero
        eyebrow={entryDate}
        title="Check-in"
        subtitle={
          isEditingPast
            ? `Edytujesz check-in z ${entryDate}`
            : isEditMode
              ? "Edytujesz poranny check-in"
              : "Poranny check-in — wszystko opcjonalne"
        }
      />

      {planPreview && (
        <section className="cv2-form-section">
          <NumberedHeader num={1} label="Plan na dziś" />
          <div className="cv2-plan-preview">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <p className="cv2-plan-preview-title">Z planu tygodnia</p>
              <Link href={"/v/chrome-v2/plan/dzien" as Route} className="cv2-link-small">
                Edytuj →
              </Link>
            </div>
            {planPreview.theme && (
              <p className="cv2-plan-preview-theme">
                <strong>Temat tygodnia:</strong> {planPreview.theme}
              </p>
            )}
            {planPreview.timed.length > 0 && (
              <ul className="cv2-plan-preview-list">
                {planPreview.timed.map((t) => {
                  const status = taskStatus(t);
                  return (
                    <li key={t.id} className="cv2-plan-preview-item">
                      <TaskChips status={status} readOnly size="sm" />
                      <span className="cv2-plan-preview-time">{t.startTime}–{t.endTime}</span>
                      <span>{t.text}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {planPreview.untimed.length > 0 && (
              <ul className="cv2-plan-preview-list" style={{ marginTop: 8 }}>
                {planPreview.untimed.map((t) => {
                  const status = taskStatus(t);
                  return (
                    <li key={t.id} className="cv2-plan-preview-item">
                      <TaskChips status={status} readOnly size="sm" />
                      <span>{t.text}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {planPreview.notes && <p className="cv2-plan-preview-notes">{planPreview.notes}</p>}
          </div>
        </section>
      )}

      {!planPreview && !isEditingPast && (
        <section className="cv2-form-section">
          <NumberedHeader num={1} label="Plan na dziś" />
          <p style={{ color: "var(--cv2-text-muted)", fontSize: 14 }}>
            Brak planu na dziś.{" "}
            <Link href={"/v/chrome-v2/plan/dzien" as Route} className="cv2-link-small">
              Zaplanuj →
            </Link>
          </p>
        </section>
      )}

      <section className="cv2-form-section">
        <NumberedHeader num={2} label="Główny priorytet dnia" />
        <FormGroup htmlFor="mainPriority" label="Co dziś jest najważniejsze?">
          <Input
            id="mainPriority"
            type="text"
            maxLength={200}
            value={form.mainPriority ?? ""}
            onChange={(e) => set("mainPriority", e.target.value)}
          />
        </FormGroup>

        {(form.mainPriority ?? "").trim() && (
          <>
            <div style={{ marginTop: 12 }}>
              <RadioPills<"q2" | "q1" | undefined>
                value={
                  form.mainPriorityQuadrant === "q2"
                    ? "q2"
                    : form.mainPriorityQuadrant === "q1" || form.mainPriorityQuadrant === "q3" || form.mainPriorityQuadrant === "q4"
                      ? "q1"
                      : undefined
                }
                onChange={(v) => set("mainPriorityQuadrant", v)}
                options={[
                  { val: "q2", label: "Q2 (ważne, nie pilne)" },
                  { val: "q1", label: "Poza Q2" },
                ]}
                label="Kwadrant Eisenhowera"
                name="quadrant"
              />
            </div>
            <div className="cv2-form-tag-row">
              <TagPicker onPick={(tag) => set("mainPriority", appendTag(form.mainPriority ?? "", tag))} />
            </div>
          </>
        )}

        <div style={{ marginTop: 16 }}>
          <FormGroup htmlFor="morningIntention" label="Intencja na dziś">
            <Input
              id="morningIntention"
              type="text"
              maxLength={120}
              value={form.morningIntention ?? ""}
              onChange={(e) => set("morningIntention", e.target.value)}
            />
          </FormGroup>
          {(form.morningIntention ?? "").trim() && (
            <div className="cv2-form-tag-row">
              <TagPicker onPick={(tag) => set("morningIntention", appendTag(form.morningIntention ?? "", tag))} />
            </div>
          )}
        </div>
      </section>

      <section className="cv2-form-section">
        <NumberedHeader num={3} label="Sen" />
        <div className="cv2-time-row">
          <FormGroup label="Kiedy się położyłem">
            <TimePicker value={form.sleepBedtime} onChange={(v) => set("sleepBedtime", v)} ariaLabel="Kiedy sie polozylem" />
          </FormGroup>
          <FormGroup label="Kiedy wstałem">
            <TimePicker value={form.sleepWakeup} onChange={(v) => set("sleepWakeup", v)} ariaLabel="Kiedy wstalem" />
          </FormGroup>
        </div>

        <RatingButtons value={form.sleepQuality} onChange={(v) => set("sleepQuality", v)} max={4} label="Jak się wyspałem (1-4)" />

        <div style={{ marginTop: 12 }}>
          <RadioPills<boolean>
            value={form.sleepNightWake}
            onChange={(v) => {
              set("sleepNightWake", v);
              if (!v) set("sleepNightWakeReason", "");
            }}
            options={[
              { val: true, label: "Tak" },
              { val: false, label: "Nie" },
            ]}
            label="Czy budziłem się w nocy"
            name="nightWake"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <RadioPills<boolean | undefined>
            value={form.wokeUpWithAlarm}
            onChange={(v) => set("wokeUpWithAlarm", v)}
            options={[
              { val: true, label: "Z budzikiem" },
              { val: false, label: "Naturalnie" },
            ]}
            label="Pobudka"
            name="wokeUpWithAlarm"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <FormGroup htmlFor="sleepFeelings" label="Odczucia po przebudzeniu">
            <Textarea
              id="sleepFeelings"
              maxLength={200}
              rows={3}
              value={form.sleepFeelings}
              onChange={(e) => set("sleepFeelings", e.target.value)}
            />
          </FormGroup>
          <div className="cv2-form-tag-row">
            <TagPicker onPick={(tag) => set("sleepFeelings", appendTag(form.sleepFeelings, tag))} />
          </div>
        </div>
      </section>

      <section className="cv2-form-section">
        <NumberedHeader num={4} label="Ekrany" />
        <RadioPills<boolean | undefined>
          value={form.phoneBeforeSleep}
          onChange={(v) => set("phoneBeforeSleep", v)}
          options={[
            { val: true, label: "Tak" },
            { val: false, label: "Nie" },
          ]}
          label="Ekran godzinę przed snem?"
          name="phoneBeforeSleep"
        />
        <div style={{ marginTop: 12 }}>
          <RadioPills<boolean | undefined>
            value={form.phoneAfterWake}
            onChange={(v) => set("phoneAfterWake", v)}
            options={[
              { val: true, label: "Tak" },
              { val: false, label: "Nie" },
            ]}
            label="Ekran godzinę po wstaniu?"
            name="phoneAfterWake"
          />
        </div>
      </section>

      <section className="cv2-form-section">
        <NumberedHeader num={5} label="Energia" />
        <RatingButtons value={form.energyLevel} onChange={(v) => set("energyLevel", v)} max={5} label="Fizyczna (1-5)" />
        <div style={{ marginTop: 16 }}>
          <span className="cv2-rating-label">Mentalna</span>
          <Likert4Faces
            value={wordToLikert(form.energyWord, "energy")}
            onChange={(v) => set("energyWord", v === "unknown" ? "" : likertToWord(v, "energy"))}
            labels={ENERGY_LABELS}
            ariaLabel="Energia mentalna"
          />
        </div>
        {form.energyWord && form.energyWord !== "unknown" && (
          <div className="cv2-form-helper-block">
            <FormGroup htmlFor="energy-note" label="Dopisek (czemu?)">
              <Textarea
                id="energy-note"
                maxLength={300}
                rows={2}
                value={form.energyWordNote ?? ""}
                onChange={(e) => set("energyWordNote", e.target.value)}
              />
            </FormGroup>
            <div className="cv2-form-tag-row">
              <TagPicker onPick={(tag) => set("energyWordNote", appendTag(form.energyWordNote ?? "", tag))} />
            </div>
          </div>
        )}
      </section>

      <section className="cv2-form-section">
        <NumberedHeader num={6} label="Nastrój" />
        <Likert4Faces
          value={wordToLikert(form.moodWord, "mood")}
          onChange={(v) => set("moodWord", v === "unknown" ? "" : likertToWord(v, "mood"))}
          labels={MOOD_LABELS}
          ariaLabel="Nastrój"
        />
        {form.moodWord && form.moodWord !== "unknown" && (
          <div className="cv2-form-helper-block">
            <FormGroup htmlFor="mood-note" label="Dopisek (czemu?)">
              <Textarea
                id="mood-note"
                maxLength={300}
                rows={2}
                value={form.moodWordNote ?? ""}
                onChange={(e) => set("moodWordNote", e.target.value)}
              />
            </FormGroup>
            <div className="cv2-form-tag-row">
              <TagPicker onPick={(tag) => set("moodWordNote", appendTag(form.moodWordNote ?? "", tag))} />
            </div>
          </div>
        )}
      </section>

      <section className="cv2-form-section">
        <NumberedHeader num={7} label="Poranek" />
        <RadioPills<boolean | undefined>
          value={form.waterAfterWake}
          onChange={(v) => set("waterAfterWake", v)}
          options={[
            { val: true, label: "Tak" },
            { val: false, label: "Nie" },
          ]}
          label="Szklanka wody od razu po wstaniu?"
          name="waterAfterWake"
        />
        <div style={{ marginTop: 12 }}>
          <RadioPills<boolean | undefined>
            value={form.sunlightFirstHour}
            onChange={(v) => set("sunlightFirstHour", v)}
            options={[
              { val: true, label: "Tak" },
              { val: false, label: "Nie" },
            ]}
            label="Wyszedłem na światło dzienne w 1. godzinie?"
            name="sunlightFirstHour"
          />
        </div>
      </section>

      <section className="cv2-form-section">
        <NumberedHeader num={8} label="Co mnie ekscytuje?" />
        <Textarea id="excited" maxLength={400} rows={3} value={form.excitedAbout} onChange={(e) => set("excitedAbout", e.target.value)} />
        <div className="cv2-form-tag-row">
          <TagPicker onPick={(tag) => set("excitedAbout", appendTag(form.excitedAbout, tag))} />
        </div>
      </section>

      <section className="cv2-form-section">
        <NumberedHeader num={9} label="Co mnie niepokoi?" />
        <Textarea id="worried" maxLength={400} rows={3} value={form.worriedAbout} onChange={(e) => set("worriedAbout", e.target.value)} />
        <div className="cv2-form-tag-row">
          <TagPicker onPick={(tag) => set("worriedAbout", appendTag(form.worriedAbout, tag))} />
        </div>
      </section>

      <section className="cv2-form-section">
        <NumberedHeader num={10} label="Na co mam dzisiaj opór?" />
        <Textarea id="resistance" maxLength={400} rows={3} value={form.resistance ?? ""} onChange={(e) => set("resistance", e.target.value)} />
        <div className="cv2-form-tag-row">
          <TagPicker onPick={(tag) => set("resistance", appendTag(form.resistance ?? "", tag))} />
        </div>
      </section>

      <section className="cv2-form-section">
        <NumberedHeader num={11} label="Moje pierwsze działanie" />
        <Input id="firstAction" type="text" maxLength={200} value={form.firstAction} onChange={(e) => set("firstAction", e.target.value)} />
        <div className="cv2-form-tag-row">
          <TagPicker onPick={(tag) => set("firstAction", appendTag(form.firstAction, tag))} />
        </div>
      </section>

      {error && <p className="cv2-form-error">{error}</p>}

      <div className="cv2-form-actions">
        <Button variant="primary" onClick={handleSave} disabled={saving || saved}>
          {saving
            ? "Zapisuję…"
            : saved
              ? "Zapisano ✓ — przekierowuję…"
              : isEditMode
                ? "Zaktualizuj"
                : "Zapisz check-in"}
        </Button>
      </div>
    </div>
  );
}

export function ChromeV2CheckInClient(props: Props) {
  return (
    <ChromeV2PassphraseGate>
      <CheckInContent {...props} />
    </ChromeV2PassphraseGate>
  );
}
