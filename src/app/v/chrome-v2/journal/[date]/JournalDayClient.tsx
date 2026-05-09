"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft } from "lucide-react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { ChromeV2PassphraseGate } from "@/components/v/chrome-v2/PassphraseGate";
import { decrypt } from "@/lib/crypto/aes";
import type { EntryMeta, QuickTickFlags } from "@/lib/supabase/entries";
import type { PlanRow } from "@/lib/supabase/plans";
import type {
  TrainingSessionRow,
  TrainingSessionData,
  SessionExercise,
} from "@/lib/supabase/training";

interface CheckInData {
  sleepBedtime?: string;
  sleepWakeup?: string;
  sleepQuality?: number;
  sleepNightWake?: boolean;
  sleepNightWakeReason?: string;
  sleepFeelings?: string;
  energyLevel?: number;
  energyWord?: string;
  moodWord?: string;
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
  morningIntention?: string;
  mainPriorityQuadrant?: "q1" | "q2" | "q3" | "q4";
}

interface CheckOutData {
  energyEndWord?: string;
  moodWord?: string;
  whatWorked?: string;
  whatFailed?: string;
  whatDiscovered?: string;
  whoTalkedTo?: string;          // legacy — wywalone z UI sesja 10, ale pokazujemy stare wpisy
  stretching?: boolean;           // sesja 10 Plan #5
  cycling?: boolean;
  cyclingKm?: string;
  gym?: boolean;                  // sesja 11 — checkbox w aktywnosci (modul /silownia tymczasowo wywalony)
  otherActivity?: string;
  nonFictionRead?: boolean;
  nonFictionTitle?: string;
  oneSentence?: string;
  constitutionAdherence?: string; // sesja 10 A2 (rozjazd/częściowo/zgodnie)
  shadow?: string; // legacy single
  shadows?: string[]; // multi-select cieni
  proactivity?: number; // 1-5
  flow?: boolean;
  flowWhen?: string;
  knowledgeApplied?: string; // tak / częściowo / nie
  screenTimeMinutes?: number;
  screenTimeScreenshot?: string; // base64 image
  unhealthyFood?: boolean;
  unhealthyFoodNote?: string;
  ateSugar?: boolean;
  ateFastFood?: boolean;
  ateSweetDrinks?: boolean;
  ateProcessed?: boolean;
  firstMealTime?: string;
  lastMealTime?: string;
  napTaken?: boolean;
  napMinutes?: number;
  extraOutsidePlan?: string;
  eveningReview?: string; // "SKIP_NOISE" sentinel = świadomy skip
  eveningReviewWorked?: boolean;
  eveningReviewFailed?: boolean;
  eveningReviewDiscovered?: boolean;
  eveningIntentionMatch?: string;
  nonFictionQuestion?: string;
  nonFictionTakeaway?: string;
  proactiveStartedFirst?: boolean;
  proactiveSaidNo?: boolean;
  proactiveChangedPlan?: boolean;
  proactiveOwnedMistake?: boolean;
  proactiveUnknown?: boolean;
}

interface DzienNotesData {
  notes?: string;
}

interface Props {
  date: string;
  checkin: EntryMeta | null;
  checkout: EntryMeta | null;
  plan: PlanRow | null;
  quickTick: EntryMeta | null;
  trainingSessions: TrainingSessionRow[];
}

const QUICK_TICK_LABELS: Record<keyof QuickTickFlags, string> = {
  stretching: "Rozciąganie",
  gym: "Siłownia",
  cycling: "Rower",
  nonFiction: "Czytanie non-fiction",
  fiction: "Czytanie fikcji",
  acupressureMat: "Mata akupresury",
  other: "Inne (spacer/bieg/basen)",
  otherText: "Inne — szczegół",
  otherTexts: "Inne — szczegóły",
};

const TYPE_LABEL: Record<string, string> = {
  push: "Dzień A",
  pull: "Dzień B",
  legs: "Dzień C",
  custom: "Inny",
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function dateOffset(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function JournalContent({
  date,
  checkin,
  checkout,
  plan,
  quickTick,
  trainingSessions,
}: Props) {
  const { key } = useCryptoKey();
  if (!key) return null;

  const decryptCheckIn = (): CheckInData | null => {
    if (!checkin) return null;
    try {
      return JSON.parse(decrypt(checkin.ciphertext, key)) as CheckInData;
    } catch {
      return null;
    }
  };

  const decryptCheckOut = (): CheckOutData | null => {
    if (!checkout) return null;
    try {
      return JSON.parse(decrypt(checkout.ciphertext, key)) as CheckOutData;
    } catch {
      return null;
    }
  };

  const decryptNotes = (): string => {
    if (!plan) return "";
    try {
      const data = JSON.parse(decrypt(plan.ciphertext, key)) as DzienNotesData;
      return data.notes ?? "";
    } catch {
      return "";
    }
  };

  const decryptQuickTick = (): QuickTickFlags => {
    if (!quickTick) return {};
    try {
      return JSON.parse(decrypt(quickTick.ciphertext, key)) as QuickTickFlags;
    } catch {
      return {};
    }
  };

  const decryptSession = (row: TrainingSessionRow): TrainingSessionData | null => {
    try {
      return JSON.parse(decrypt(row.ciphertext, key)) as TrainingSessionData;
    } catch {
      return null;
    }
  };

  const ci = decryptCheckIn();
  const co = decryptCheckOut();
  const notes = decryptNotes();
  const ticks = decryptQuickTick();
  const tickedKeys = (Object.keys(ticks) as (keyof QuickTickFlags)[]).filter((k) => ticks[k]);

  return (
    <div className="cv2-form-screen">
      <div className="page-header">
        <div>
          <p className="eyebrow">Dziennik</p>
          <h1>{formatDate(date)}</h1>
        </div>
        <Link href="/v/chrome-v2/timeline" className="btn-edit">
          <ArrowLeft size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
          Historia
        </Link>
      </div>

      <div className="journal-nav">
        <Link href={`/v/chrome-v2/journal/${dateOffset(date, -1)}` as Route} className="dash-card-link">
          ← Poprzedni dzień
        </Link>
        <Link href={`/v/chrome-v2/journal/${dateOffset(date, 1)}` as Route} className="dash-card-link">
          Następny dzień →
        </Link>
      </div>

      {!checkin && !checkout && !plan && !quickTick && trainingSessions.length === 0 && (
        <p className="text-muted" style={{ marginTop: 32 }}>
          Brak wpisów dla tego dnia.
        </p>
      )}

      {ci && (
        <section className="cv2-form-section journal-section">
          <div className="journal-section-head">
            <h2 className="cv2-form-section-title">Check-in (rano)</h2>
            <Link href={{ pathname: "/check-in", query: { date } }} className="dash-card-link" style={{ fontSize: 12 }}>
              Edytuj →
            </Link>
          </div>
          <dl className="journal-dl">
            {ci.mainPriority && (
              <>
                <dt>Główny priorytet</dt>
                <dd className="journal-prose journal-emphasis">
                  {ci.mainPriority}
                  {ci.mainPriorityQuadrant && (
                    <span className="text-muted" style={{ marginLeft: 8, fontSize: 12 }}>
                      [{ci.mainPriorityQuadrant.toUpperCase()}{" "}
                      {ci.mainPriorityQuadrant === "q1" ? "ważne+pilne" :
                        ci.mainPriorityQuadrant === "q2" ? "ważne" :
                        ci.mainPriorityQuadrant === "q3" ? "pilne" : "ani"}]
                    </span>
                  )}
                </dd>
              </>
            )}
            {ci.morningIntention && (
              <>
                <dt>Intencja na dziś</dt>
                <dd className="journal-prose">{ci.morningIntention}</dd>
              </>
            )}
            {(ci.sleepBedtime || ci.sleepWakeup) && (
              <>
                <dt>Sen</dt>
                <dd>
                  {ci.sleepBedtime} – {ci.sleepWakeup}
                  {typeof ci.sleepQuality === "number" && ci.sleepQuality > 0 && (
                    <> · Jakość: {ci.sleepQuality}/5</>
                  )}
                  {ci.sleepNightWake !== undefined && (
                    <> · Budzenie: {ci.sleepNightWake ? "tak" : "nie"}</>
                  )}
                </dd>
              </>
            )}
            {ci.sleepNightWake === true && ci.sleepNightWakeReason && (
              <>
                <dt>Czemu się obudziłem</dt>
                <dd>{ci.sleepNightWakeReason}</dd>
              </>
            )}
            {ci.sleepFeelings && (
              <>
                <dt>Odczucia po śnie</dt>
                <dd>{ci.sleepFeelings}</dd>
              </>
            )}
            {(ci.phoneBeforeSleep !== undefined || ci.phoneAfterWake !== undefined) && (
              <>
                <dt>Ekrany</dt>
                <dd>
                  {ci.phoneBeforeSleep !== undefined && (
                    <>Przed snem: {ci.phoneBeforeSleep ? "tak" : "nie"}</>
                  )}
                  {ci.phoneBeforeSleep !== undefined && ci.phoneAfterWake !== undefined && " · "}
                  {ci.phoneAfterWake !== undefined && (
                    <>Po wstaniu: {ci.phoneAfterWake ? "tak" : "nie"}</>
                  )}
                </dd>
              </>
            )}
            {(ci.waterAfterWake !== undefined || ci.sunlightFirstHour !== undefined) && (
              <>
                <dt>Poranek</dt>
                <dd>
                  {ci.waterAfterWake !== undefined && (
                    <>Woda: {ci.waterAfterWake ? "tak" : "nie"}</>
                  )}
                  {ci.waterAfterWake !== undefined && ci.sunlightFirstHour !== undefined && " · "}
                  {ci.sunlightFirstHour !== undefined && (
                    <>Światło: {ci.sunlightFirstHour ? "tak" : "nie"}</>
                  )}
                </dd>
              </>
            )}
            {(ci.energyLevel || ci.energyWord) && (
              <>
                <dt>Energia</dt>
                <dd>
                  {ci.energyLevel ? `${ci.energyLevel}/5 fizyczna` : ""}
                  {ci.energyLevel && ci.energyWord ? " · " : ""}
                  {ci.energyWord ? `${ci.energyWord} mentalna` : ""}
                </dd>
              </>
            )}
            {ci.moodWord && (
              <>
                <dt>Nastrój</dt>
                <dd>{ci.moodWord}</dd>
              </>
            )}
            {ci.intentions && (
              <>
                <dt>Co chcę zrobić</dt>
                <dd className="journal-prose">{ci.intentions}</dd>
              </>
            )}
            {ci.excitedAbout && (
              <>
                <dt>Co ekscytuje</dt>
                <dd className="journal-prose">{ci.excitedAbout}</dd>
              </>
            )}
            {ci.worriedAbout && (
              <>
                <dt>Co niepokoi</dt>
                <dd className="journal-prose">{ci.worriedAbout}</dd>
              </>
            )}
            {ci.resistance && (
              <>
                <dt>Przed czym czuję opór</dt>
                <dd className="journal-prose">{ci.resistance}</dd>
              </>
            )}
            {ci.firstAction && (
              <>
                <dt>Pierwsze działanie</dt>
                <dd className="journal-prose">{ci.firstAction}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {co && (
        <section className="cv2-form-section journal-section">
          <div className="journal-section-head">
            <h2 className="cv2-form-section-title">Check-out (wieczór)</h2>
            <Link href={{ pathname: "/check-out", query: { date } }} className="dash-card-link" style={{ fontSize: 12 }}>
              Edytuj →
            </Link>
          </div>
          <dl className="journal-dl">
            {co.energyEndWord && (
              <>
                <dt>Energia na koniec</dt>
                <dd>{co.energyEndWord}</dd>
              </>
            )}
            {co.moodWord && (
              <>
                <dt>Nastrój dnia</dt>
                <dd>{co.moodWord}</dd>
              </>
            )}
            {/* Sesja 19 Sprint 1 K10 — eveningReview ma priorytet nad legacy whatWorked/Failed/Discovered. */}
            {co.eveningReview === "SKIP_NOISE" ? (
              <>
                <dt>Refleksja wieczorna</dt>
                <dd className="text-muted">Świadomy skip („Nic dziś”)</dd>
              </>
            ) : co.eveningReview ? (
              <>
                <dt>Refleksja wieczorna</dt>
                <dd className="journal-prose">
                  {co.eveningReview}
                  {(co.eveningReviewWorked || co.eveningReviewFailed || co.eveningReviewDiscovered) && (
                    <div className="text-muted" style={{ marginTop: 4, fontSize: 12 }}>
                      {co.eveningReviewWorked && "✓ zadziałało · "}
                      {co.eveningReviewFailed && "✗ nie wyszło · "}
                      {co.eveningReviewDiscovered && "💡 odkryłem"}
                    </div>
                  )}
                </dd>
              </>
            ) : (
              <>
                {co.whatWorked && (
                  <>
                    <dt>Co zadziałało</dt>
                    <dd className="journal-prose">{co.whatWorked}</dd>
                  </>
                )}
                {co.whatFailed && (
                  <>
                    <dt>Co zawaliłem / żałuję</dt>
                    <dd className="journal-prose">{co.whatFailed}</dd>
                  </>
                )}
                {co.whatDiscovered && (
                  <>
                    <dt>Co odkryłem</dt>
                    <dd className="journal-prose">{co.whatDiscovered}</dd>
                  </>
                )}
              </>
            )}
            {co.eveningIntentionMatch && co.eveningIntentionMatch !== "" && (
              <>
                <dt>Zgodność z poranną intencją</dt>
                <dd>{co.eveningIntentionMatch === "unknown" ? "Nie wiem" : co.eveningIntentionMatch}</dd>
              </>
            )}
            {co.whoTalkedTo && (
              <>
                <dt>Z kim rozmawiałem</dt>
                <dd className="journal-prose">{co.whoTalkedTo}</dd>
              </>
            )}
            {co.constitutionAdherence && (
              <>
                <dt>Zgodność z Konstytucją</dt>
                <dd>{co.constitutionAdherence === "unknown" ? "Nie wiem" : co.constitutionAdherence}</dd>
              </>
            )}
            {/* Sesja 19 Sprint 1 K9 — proaktywność 4 booleany flat */}
            {(co.proactiveStartedFirst || co.proactiveSaidNo || co.proactiveChangedPlan || co.proactiveOwnedMistake || co.proactiveUnknown) && (
              <>
                <dt>Proaktywność</dt>
                <dd>
                  {co.proactiveUnknown
                    ? "Nie wiem"
                    : [
                        co.proactiveStartedFirst && "Zacząłem zanim zmuszono",
                        co.proactiveSaidNo && "Powiedziałem nie",
                        co.proactiveChangedPlan && "Zmieniłem plan",
                        co.proactiveOwnedMistake && "Wziąłem odpowiedzialność",
                      ].filter(Boolean).join(" · ")}
                </dd>
              </>
            )}
            {(co.stretching || co.gym || co.cycling || co.otherActivity) && (
              <>
                <dt>Aktywność</dt>
                <dd>
                  {[
                    co.stretching ? "Rozciąganie" : "",
                    co.gym ? "Siłownia" : "",
                    co.cycling ? `Rower${co.cyclingKm ? ` (${co.cyclingKm} km)` : ""}` : "",
                    (co.otherActivity ?? "").trim(),
                  ].filter(Boolean).join(" · ")}
                </dd>
              </>
            )}
            {co.nonFictionRead && (
              <>
                <dt>Czytanie non-fiction / rozwojowe</dt>
                <dd>{co.nonFictionTitle ? co.nonFictionTitle : "Tak"}</dd>
              </>
            )}
            {co.nonFictionRead && co.nonFictionQuestion && (
              <>
                <dt>Pytanie z lektury</dt>
                <dd className="journal-prose">{co.nonFictionQuestion}</dd>
              </>
            )}
            {co.nonFictionRead && co.nonFictionTakeaway && (
              <>
                <dt>Z lektury zostaje</dt>
                <dd className="journal-prose">{co.nonFictionTakeaway}</dd>
              </>
            )}
            {co.napTaken === true && (
              <>
                <dt>Drzemka</dt>
                <dd>{co.napMinutes ? `${co.napMinutes} min` : "Tak"}</dd>
              </>
            )}
            {co.extraOutsidePlan && co.extraOutsidePlan.trim() && (
              <>
                <dt>Poza planem dnia</dt>
                <dd className="journal-prose">{co.extraOutsidePlan}</dd>
              </>
            )}
            {co.oneSentence && (
              <>
                <dt>Co dziś było ważne</dt>
                <dd className="journal-prose journal-emphasis">{co.oneSentence}</dd>
              </>
            )}

            {/* Sesja 11 M2 — render 8 nowych pol */}
            {((co.shadows && co.shadows.length > 0) || co.shadow) && (
              <>
                <dt>Cień z Konstytucji</dt>
                <dd>
                  {co.shadows && co.shadows.length > 0
                    ? co.shadows.join(", ")
                    : co.shadow}
                </dd>
              </>
            )}
            {typeof co.proactivity === "number" && co.proactivity > 0 && (
              <>
                <dt>Proaktywność</dt>
                <dd>{co.proactivity}/5</dd>
              </>
            )}
            {co.flow !== undefined && (
              <>
                <dt>Flow</dt>
                <dd>
                  {co.flow ? "tak" : "nie"}
                  {co.flow && co.flowWhen && <> · {co.flowWhen}</>}
                </dd>
              </>
            )}
            {co.knowledgeApplied && (
              <>
                <dt>Wdrażanie wiedzy</dt>
                <dd>{co.knowledgeApplied}</dd>
              </>
            )}
            {typeof co.screenTimeMinutes === "number" && co.screenTimeMinutes > 0 && (
              <>
                <dt>Czas przed ekranem</dt>
                <dd>
                  {Math.floor(co.screenTimeMinutes / 60)}h {(co.screenTimeMinutes % 60).toString().padStart(2, "0")}min
                  {co.screenTimeScreenshot && (
                    <div style={{ marginTop: 8 }}>
                      <img
                        src={co.screenTimeScreenshot}
                        alt="Zrzut ekranu screen time"
                        style={{ maxWidth: "100%", maxHeight: 240, borderRadius: 6, border: "1px solid var(--border-medium)" }}
                      />
                    </div>
                  )}
                </dd>
              </>
            )}
            {(co.ateSugar || co.ateFastFood || co.ateSweetDrinks || co.ateProcessed || co.unhealthyFood) && (
              <>
                <dt>Niezdrowe jedzenie</dt>
                <dd>
                  {[
                    co.ateSugar ? "cukier" : "",
                    co.ateFastFood ? "fast food" : "",
                    co.ateSweetDrinks ? "słodkie napoje" : "",
                    co.ateProcessed ? "przetworzone" : "",
                    co.unhealthyFood ? (co.unhealthyFoodNote || "inne") : "",
                  ].filter(Boolean).join(" · ")}
                </dd>
              </>
            )}
            {(co.firstMealTime || co.lastMealTime) && (
              <>
                <dt>Posiłki</dt>
                <dd>
                  {co.firstMealTime && <>1. {co.firstMealTime}</>}
                  {co.firstMealTime && co.lastMealTime && " · "}
                  {co.lastMealTime && <>ostatni: {co.lastMealTime}</>}
                </dd>
              </>
            )}
          </dl>
        </section>
      )}

      {notes && (
        <section className="cv2-form-section journal-section">
          <div className="journal-section-head">
            <h2 className="cv2-form-section-title">Coś ważnego do zapamiętania</h2>
            <Link href={{ pathname: "/plan/dzien", query: { date } }} className="dash-card-link" style={{ fontSize: 12 }}>
              Edytuj →
            </Link>
          </div>
          <p className="journal-prose">{notes}</p>
        </section>
      )}

      {tickedKeys.length > 0 && (
        <section className="cv2-form-section journal-section">
          <h2 className="cv2-form-section-title">Quick-tick</h2>
          <ul className="journal-tick-list">
            {tickedKeys
              .filter((k) => k !== "otherText" && k !== "otherTexts")
              .map((k) => {
                if (k === "other") {
                  const list = ticks.otherTexts && ticks.otherTexts.length > 0
                    ? ticks.otherTexts.filter((t) => t.trim().length > 0)
                    : ticks.otherText
                      ? [ticks.otherText]
                      : [];
                  return (
                    <li key={k}>
                      ✓ {QUICK_TICK_LABELS.other}
                      {list.length > 0 && (
                        <span className="text-muted" style={{ marginLeft: 6 }}>
                          ({list.join(" · ")})
                        </span>
                      )}
                    </li>
                  );
                }
                return <li key={k}>✓ {QUICK_TICK_LABELS[k] ?? k}</li>;
              })}
          </ul>
        </section>
      )}

      {trainingSessions.length > 0 && (
        <section className="cv2-form-section journal-section">
          <div className="journal-section-head">
            <h2 className="cv2-form-section-title">Siłownia</h2>
            <Link href="/v/chrome-v2/silownia" className="dash-card-link" style={{ fontSize: 12 }}>
              Edytuj →
            </Link>
          </div>
          {trainingSessions.map((s) => {
            const data = decryptSession(s);
            const exercises: SessionExercise[] = data?.exercises ?? [];
            return (
              <div key={s.id} className="journal-session">
                <div className="journal-session-head">
                  <span className={`silownia-row-type silownia-row-type-${s.session_type}`}>
                    {TYPE_LABEL[s.session_type] ?? s.session_type}
                  </span>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    {exercises.length} ćwiczeń
                  </span>
                </div>
                <ul className="journal-exercise-list">
                  {exercises.map((ex) => (
                    <li key={ex.id}>
                      <strong>{ex.name}</strong>
                      {ex.plannedSets && ex.plannedReps && (
                        <span className="text-muted" style={{ fontSize: 12 }}>
                          {" "}plan: {ex.plannedSets}×{ex.plannedReps}
                        </span>
                      )}
                      {ex.sets.length > 0 && (
                        <span style={{ marginLeft: 8, fontSize: 12 }}>
                          {ex.sets
                            .map((set) => `${set.reps}×${set.weight}kg${set.rpe ? ` RPE${set.rpe}` : ""}`)
                            .join(" · ")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

export function ChromeV2JournalDayClient(props: Props) {
  return (
    <ChromeV2PassphraseGate>
      <JournalContent {...props} />
    </ChromeV2PassphraseGate>
  );
}
