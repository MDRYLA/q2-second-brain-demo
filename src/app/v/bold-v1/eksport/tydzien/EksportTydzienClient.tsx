"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Download, Check, AlertTriangle } from "lucide-react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { BoldV1PassphraseGate } from "@/components/v/bold-v1/PassphraseGate";
import { BoldV1Hero } from "@/components/v/bold-v1/Hero";
import { decrypt } from "@/lib/crypto/aes";
import {
  weeklyDataToMarkdown,
  type CheckInData,
  type CheckOutData,
  type DayEntry,
  type DayPlanData,
  type QuickTickFlags,
  type WeekPlanData,
  type WeeklyData,
} from "@/lib/eksport-tydzien/markdown";

const WEEKDAYS_LONG = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

export interface RawDay {
  date: string;
  checkInCt: string | null;
  checkOutCt: string | null;
  quickTickCt: string | null;
  dayPlanCt: string | null;
}

interface Props {
  isoYear: number;
  isoWeek: number;
  weekLabel: string;
  mondayDate: string;
  sundayDate: string;
  rawDays: RawDay[];
  weekPlanCt: string | null;
}

function tryDecryptJson<T>(ct: string | null, key: Uint8Array): T | null {
  if (!ct) return null;
  try {
    return JSON.parse(decrypt(ct, key)) as T;
  } catch {
    return null;
  }
}

function ExportContent(props: Props) {
  const { key } = useCryptoKey();
  const [markdown, setMarkdown] = useState<string>("");
  const [decryptError, setDecryptError] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const filename = useMemo(
    () => `tydzien-${props.isoYear}-W${String(props.isoWeek).padStart(2, "0")}.md`,
    [props.isoYear, props.isoWeek]
  );

  useEffect(() => {
    if (!key) return;
    let errors = 0;

    const days: DayEntry[] = props.rawDays.map((raw, idx) => {
      const checkIn = tryDecryptJson<CheckInData>(raw.checkInCt, key);
      const checkOut = tryDecryptJson<CheckOutData>(raw.checkOutCt, key);
      const quickTick = tryDecryptJson<QuickTickFlags>(raw.quickTickCt, key);
      const dayPlan = tryDecryptJson<DayPlanData>(raw.dayPlanCt, key);

      // Count fields that have ciphertext but failed to decrypt
      if (raw.checkInCt && !checkIn) errors++;
      if (raw.checkOutCt && !checkOut) errors++;
      if (raw.quickTickCt && !quickTick) errors++;
      if (raw.dayPlanCt && !dayPlan) errors++;

      return {
        date: raw.date,
        weekdayLabel: WEEKDAYS_LONG[idx],
        checkIn,
        checkOut,
        quickTick,
        dayPlan,
      };
    });

    const weekPlan = tryDecryptJson<WeekPlanData>(props.weekPlanCt, key);
    if (props.weekPlanCt && !weekPlan) errors++;

    const data: WeeklyData = {
      isoYear: props.isoYear,
      isoWeek: props.isoWeek,
      weekLabel: props.weekLabel,
      mondayDate: props.mondayDate,
      sundayDate: props.sundayDate,
      weekPlan,
      days,
    };

    setMarkdown(weeklyDataToMarkdown(data));
    setDecryptError(errors);
  }, [key, props]);

  const handleCopy = async (): Promise<void> => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = markdown;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (): void => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!key) return null;

  const ready = markdown.length > 0;

  return (
    <div className="bv1-form-screen">
      <BoldV1Hero
        eyebrow="Eksport tygodnia"
        title={`${props.weekLabel}.`}
        subtitle={`${props.mondayDate} → ${props.sundayDate} · plik: ${filename}`}
      >
        <div style={{ marginTop: 16 }}>
          <Link href="/" className="btn-edit">
            <ArrowLeft size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
            Dashboard
          </Link>
        </div>
      </BoldV1Hero>

      <section style={{ marginTop: 24 }}>
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>
          Klik <strong>„Skopiuj do schowka"</strong> → w terminalu projektu uruchom{" "}
          <code>pbpaste &gt; .weekly-review-cache/{filename}</code>. Skill <code>weekly-review</code>{" "}
          podchwyci plik i kontynuuje konwersacyjny przegląd niedzieli.
        </p>

        {decryptError > 0 ? (
          <div
            role="alert"
            style={{
              marginTop: 16,
              padding: 12,
              border: "1px solid var(--color-danger, #c0392b)",
              borderRadius: 8,
              background: "var(--color-danger-bg, rgba(192, 57, 43, 0.08))",
              fontSize: 13,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              {decryptError}{" "}
              {decryptError === 1 ? "wpis nie został odszyfrowany" : "wpisów nie zostało odszyfrowanych"}
              . Eksport poleci dalej, ale dane mogą być niekompletne — sprawdź passphrase.
            </span>
          </div>
        ) : null}

        <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn-primary"
            disabled={!ready}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check size={16} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                Skopiowano
              </>
            ) : (
              <>
                <Copy size={16} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                Skopiuj do schowka
              </>
            )}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={!ready}
            onClick={handleDownload}
          >
            <Download size={16} style={{ marginRight: 6, verticalAlign: "-2px" }} />
            Pobierz .md
          </button>
        </div>

        <details style={{ marginTop: 24 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            Podgląd ({markdown.length.toLocaleString("pl-PL")} znaków)
          </summary>
          <pre
            style={{
              marginTop: 12,
              padding: 16,
              background: "var(--color-surface-2, #f5f5f0)",
              border: "1px solid var(--color-border, rgba(0,0,0,0.08))",
              borderRadius: 8,
              fontSize: 12,
              lineHeight: 1.5,
              overflow: "auto",
              maxHeight: 480,
              whiteSpace: "pre-wrap",
            }}
          >
            {markdown || "Ładowanie…"}
          </pre>
        </details>
      </section>
    </div>
  );
}

export function BoldV1EksportTydzienClient(props: Props) {
  return (
    <BoldV1PassphraseGate>
      <ExportContent {...props} />
    </BoldV1PassphraseGate>
  );
}
