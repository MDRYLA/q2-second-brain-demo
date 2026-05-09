"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { ChromeV2PassphraseGate } from "@/components/v/chrome-v2/PassphraseGate";
import { ChromeV2Hero } from "@/components/v/chrome-v2/Hero";
import { decrypt } from "@/lib/crypto/aes";
import type { EntryMeta } from "@/lib/supabase/entries";

interface ReviewMeta {
  date: string;
  criticScore: number | null;
}

interface Props {
  entries: EntryMeta[];
  daysBack: number;
  reviews: ReviewMeta[];
}

type Status = "green" | "yellow" | "red";

interface MetricResult {
  label: string;
  pass: Status;
  value: string;
  target: string;
  detail?: string;
}

// Cel: GREEN (≥4 metrics pass) → kontynuuj; YELLOW (2-3) → refactor; RED (0-1) → rollback.

function isUnknownOrEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (v === "") return true;
  if (v === "unknown") return true;
  return false;
}

function AuditW22Content({ entries, daysBack, reviews }: Props) {
  const { key } = useCryptoKey();

  const metrics: MetricResult[] = useMemo(() => {
    if (!key) return [];

    // Decrypt entries lokalnie (jednorazowo).
    const checkins: Record<string, unknown>[] = [];
    const checkouts: Record<string, unknown>[] = [];
    for (const e of entries) {
      try {
        const data = JSON.parse(decrypt(e.ciphertext, key)) as Record<string, unknown>;
        if (e.entry_type === "checkin") checkins.push(data);
        else if (e.entry_type === "checkout") checkouts.push(data);
      } catch {
        // skip undecryptable
      }
    }

    const totalCheckIn = checkins.length;
    const totalCheckOut = checkouts.length;

    // Metryka 1: <30% pól unknown/empty w 9 polach krytycznych
    // Pola check-in: moodWord, energyWord (z Likert4 + sentinel)
    // Pola check-out: moodWord, energyEndWord, constitutionAdherence, knowledgeApplied,
    //                 eveningIntentionMatch (5 Likert4), proactiveUnknown (1 sentinel)
    let unknownCount = 0;
    let totalChecked = 0;
    for (const ci of checkins) {
      for (const f of ["moodWord", "energyWord"]) {
        totalChecked++;
        if (isUnknownOrEmpty(ci[f])) unknownCount++;
      }
    }
    for (const co of checkouts) {
      for (const f of ["moodWord", "energyEndWord", "constitutionAdherence", "knowledgeApplied", "eveningIntentionMatch"]) {
        totalChecked++;
        if (isUnknownOrEmpty(co[f])) unknownCount++;
      }
      // proactiveUnknown jako oddzielny boolean
      totalChecked++;
      if (co["proactiveUnknown"] === true) unknownCount++;
    }
    const pctUnknown = totalChecked > 0 ? (unknownCount / totalChecked) * 100 : 0;
    const m1: MetricResult = {
      label: "1. Po środku „nie wiem” — friction czy design?",
      target: "<30% pól unknown/empty (cel)",
      value: `${pctUnknown.toFixed(0)}% (${unknownCount}/${totalChecked})`,
      pass: pctUnknown < 30 ? "green" : pctUnknown < 50 ? "yellow" : "red",
      detail: "9 pól krytycznych z Likert4 + sentinel (mood/energy/adherence/knowledge/intentionMatch + proactiveUnknown).",
    };

    // Metryka 2: empty eveningReview <40% dni
    let emptyEvening = 0;
    let skipNoise = 0;
    for (const co of checkouts) {
      const er = co["eveningReview"];
      if (er === "SKIP_NOISE") skipNoise++;
      else if (!er || (typeof er === "string" && er.trim() === "")) emptyEvening++;
    }
    const pctEmptyEvening = totalCheckOut > 0 ? (emptyEvening / totalCheckOut) * 100 : 0;
    const m2: MetricResult = {
      label: "2. „Co wyciągnąłem” — szczerze czy performative?",
      target: "<40% empty eveningReview",
      value: `${pctEmptyEvening.toFixed(0)}% (${emptyEvening}/${totalCheckOut} pustych, ${skipNoise} SKIP_NOISE)`,
      pass: pctEmptyEvening < 40 ? "green" : pctEmptyEvening < 60 ? "yellow" : "red",
      detail: "SKIP_NOISE liczone osobno (świadomy skip — anti-performative learning, NIE traktowane jako fail).",
    };

    // Metryka 3: empty nonFictionTakeaway <50% gdy czytał
    let nonFictionRead = 0;
    let nonFictionEmptyTakeaway = 0;
    for (const co of checkouts) {
      if (co["nonFictionRead"] === true) {
        nonFictionRead++;
        const t = co["nonFictionTakeaway"];
        if (!t || (typeof t === "string" && t.trim() === "")) nonFictionEmptyTakeaway++;
      }
    }
    const pctEmptyTakeaway =
      nonFictionRead > 0 ? (nonFictionEmptyTakeaway / nonFictionRead) * 100 : 0;
    const m3: MetricResult = {
      label: "3. Cornell Q-T-S — coverage takeaway",
      target: "<50% empty takeaway gdy non-fiction = true",
      value:
        nonFictionRead === 0
          ? "—  (brak non-fiction days)"
          : `${pctEmptyTakeaway.toFixed(0)}% (${nonFictionEmptyTakeaway}/${nonFictionRead})`,
      pass:
        nonFictionRead === 0
          ? "yellow"
          : pctEmptyTakeaway < 50
            ? "green"
            : pctEmptyTakeaway < 70
              ? "yellow"
              : "red",
      detail: "Pola opcjonalne — niska coverage NIE jest fail, ale sygnał że Cornell Q-T-S nie jest naturalny.",
    };

    // Metryka 4: mainPriorityQuadrant ≥3 z 4 kwadrantów użyte na 28 dniach
    const quadrants = new Set<string>();
    let qCount = 0;
    for (const ci of checkins) {
      const q = ci["mainPriorityQuadrant"];
      if (q === "q1" || q === "q2" || q === "q3" || q === "q4") {
        quadrants.add(q);
        qCount++;
      }
    }
    const m4: MetricResult = {
      label: "4. Eisenhower — sharp kategorie q1/q2/q3/q4?",
      target: "≥3 z 4 kwadrantów użyte (distribution)",
      value: `${quadrants.size}/4 użyte (${qCount} dni z chip)`,
      pass: quadrants.size >= 3 ? "green" : quadrants.size >= 2 ? "yellow" : "red",
      detail: "Boolean isQ2 by zgubił distribution — pełen enum daje sygnał czy reaktywny vs proaktywny tydzień.",
    };

    // Metryka 5: Critic Score weekly reviews ≥4/5 (z docs/przegladci/)
    const recentScores = reviews
      .filter((r) => r.criticScore !== null)
      .slice(0, 4)
      .map((r) => r.criticScore as number);
    const passingScores = recentScores.filter((s) => s >= 4).length;
    const m5: MetricResult = {
      label: "5. Skill weekly review — Critic Score ≥4/5",
      target: "4/4 ostatnich reviews ma Critic ≥4",
      value:
        recentScores.length === 0
          ? "—  (brak reviews w docs/przegladci/)"
          : `${passingScores}/${recentScores.length} OK (scores: ${recentScores.join(", ")})`,
      pass:
        recentScores.length === 0
          ? "yellow"
          : passingScores === recentScores.length && recentScores.length >= 2
            ? "green"
            : passingScores >= recentScores.length / 2
              ? "yellow"
              : "red",
      detail: "Auto-grep 'Critic Score: N/5' z markdown plików. Czytane top-down, ostatnie 4.",
    };

    return [m1, m2, m3, m4, m5];
  }, [entries, key, reviews]);

  const overall: Status = useMemo(() => {
    const greens = metrics.filter((m) => m.pass === "green").length;
    if (greens >= 4) return "green";
    if (greens >= 2) return "yellow";
    return "red";
  }, [metrics]);

  if (!key) return null;

  return (
    <div className="cv2-form-screen">
      <ChromeV2Hero
        eyebrow="Faza C — verification audit"
        title="Audit W22"
        subtitle={`${daysBack} dni back · ${entries.length} entries. GREEN ≥4/5 = kontynuuj, YELLOW 2-3/5 = refactor, RED 0-1/5 = rollback.`}
      />

      <section
        className="cv2-form-section"
        style={{ borderLeftColor: overall === "green" ? "#3f9d3f" : overall === "yellow" ? "#cfae3a" : "#c44" }}
      >
        <h2 className="cv2-form-section-title">
          Decision: {overall === "green" ? "🟢 GREEN — kontynuuj" : overall === "yellow" ? "🟡 YELLOW — refactor" : "🔴 RED — rollback"}
        </h2>
        <p className="text-muted ci-section-hint">
          {metrics.filter((m) => m.pass === "green").length} / {metrics.length} metrics passing.
          Plan main definuje threshold: 4-5 = GREEN, 2-3 = YELLOW, 0-1 = RED.
        </p>
      </section>

      <section className="cv2-form-section">
        <h2 className="cv2-form-section-title">Quantitative metrics</h2>
        <table className="audit-w22-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Target</th>
              <th>Value</th>
              <th>Pass</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => (
              <tr key={i} className={`audit-w22-row audit-w22-${m.pass}`}>
                <td>
                  <strong>{m.label}</strong>
                  {m.detail && <p className="text-muted" style={{ margin: "4px 0 0", fontSize: 12 }}>{m.detail}</p>}
                </td>
                <td className="text-muted" style={{ fontSize: 13 }}>{m.target}</td>
                <td>{m.value}</td>
                <td>{m.pass === "green" ? "🟢" : m.pass === "yellow" ? "🟡" : "🔴"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="cv2-form-section">
        <h2 className="cv2-form-section-title">Sceptyczne pytania krytyka (qualitative)</h2>
        <p className="text-muted ci-section-hint">
          Quantitative pokazuje liczby, qualitative pokazuje czy ZMIANA realna. Odpowiedz sam
          przed niedzielą 1.06 (W22 audit).
        </p>
        <ul className="audit-w22-questions">
          <li>
            <strong>1. Co realnie się zmieniło dzięki insightom z apki?</strong>
            <br />
            <span className="text-muted">≥1 konkretna decyzja zmieniona dzięki review (NIE własne myślenie).</span>
          </li>
          <li>
            <strong>2. Czy &bdquo;proaktywny dzień&rdquo; jest sharp kategorią?</strong>
            <br />
            <span className="text-muted">Jeśli proaktywność średnio 3/4 booleany każdego dnia → kategoria zatarta. Idealne: rozkład bimodalny (dzień proaktywny vs reaktywny).</span>
          </li>
          <li>
            <strong>3. Czy &bdquo;template dla innych&rdquo; — mission creep starter?</strong>
            <br />
            <span className="text-muted">Czy chciałbyś żeby ktoś inny używał tej apki? Jeśli TAK → flag. Cel #1 pozostaje: tylko dla Ciebie.</span>
          </li>
          <li>
            <strong>4. Czy rozumiem raport bez glosariusza?</strong>
            <br />
            <span className="text-muted">Czy wymówiłeś &bdquo;co to znaczy&rdquo; w którymś z 4 weekly reviews v2? Cel: 0 razy.</span>
          </li>
        </ul>
      </section>

      <section className="cv2-form-section">
        <h2 className="cv2-form-section-title">Następne kroki</h2>
        {overall === "green" && (
          <p>
            🟢 Plan: kontynuuj setup → skill <code>monthly-review</code> (osobna sesja, post-1.06).
            Skill weekly v2 stays.
          </p>
        )}
        {overall === "yellow" && (
          <p>
            🟡 Plan: refactor pojedynczych metryk które nie pass. Sprawdź szczegółowo które
            (kolumna Pass z 🟡 i 🔴) → osobna sesja Plan Mode dla refactoru.
          </p>
        )}
        {overall === "red" && (
          <p>
            🔴 Plan: rollback Sprint 1+2 do baseline (commit przed sesja 19) lub re-run Faza B
            researcher pipeline z innym focus (np. cognitive load reduction zamiast forced 4-point).
          </p>
        )}
        <p className="text-muted" style={{ marginTop: 8 }}>
          Wyświetlasz audit przed datą 1.06? Wyniki są partial (mniej niż 28 dni Sprint 1
          danych). Pełny audit — po 4 niedzielach z weekly review v2.
        </p>
        <p style={{ marginTop: 12 }}>
          <Link href="/v/chrome-v2/eksport/tydzien" className="btn-edit">
            ← /eksport/tydzien (raw data)
          </Link>
        </p>
      </section>
    </div>
  );
}

export function ChromeV2AuditW22Client(props: Props) {
  return (
    <ChromeV2PassphraseGate>
      <AuditW22Content {...props} />
    </ChromeV2PassphraseGate>
  );
}
