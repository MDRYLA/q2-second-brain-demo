"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { BoldV1PassphraseGate } from "@/components/v/bold-v1/PassphraseGate";
import { BoldV1Hero } from "@/components/v/bold-v1/Hero";
import { decrypt } from "@/lib/crypto/aes";
import { extractTags } from "@/lib/tags/parser";
import type { EntryMeta } from "@/lib/supabase/entries";

interface DayData {
  date: string;
  checkin: EntryMeta | null;
  checkout: EntryMeta | null;
  tags: string[];
}

interface Props {
  entries: EntryMeta[];
}

function groupByDate(entries: EntryMeta[]): DayData[] {
  const map = new Map<string, DayData>();
  for (const e of entries) {
    if (!map.has(e.entry_date)) {
      map.set(e.entry_date, { date: e.entry_date, checkin: null, checkout: null, tags: [] });
    }
    const day = map.get(e.entry_date)!;
    if (e.entry_type === "checkin") day.checkin = e;
    if (e.entry_type === "checkout") day.checkout = e;
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

function extractDayTags(day: DayData, key: Uint8Array): string[] {
  const seen = new Set<string>();
  const collect = (txt: string | undefined) => {
    if (!txt) return;
    for (const t of extractTags(txt)) seen.add(t);
  };
  if (day.checkin) {
    try {
      const ci = JSON.parse(decrypt(day.checkin.ciphertext, key)) as Record<string, unknown>;
      ["firstAction", "intentions", "excitedAbout", "worriedAbout"].forEach((f) =>
        collect(ci[f] as string | undefined),
      );
    } catch {
      // ignore decrypt failures
    }
  }
  if (day.checkout) {
    try {
      const co = JSON.parse(decrypt(day.checkout.ciphertext, key)) as Record<string, unknown>;
      ["oneSentence", "whatWorked", "whatFailed", "whatDiscovered", "whoTalkedTo", "flowWhen"].forEach(
        (f) => collect(co[f] as string | undefined),
      );
    } catch {
      // ignore
    }
  }
  return [...seen];
}

function extractOneSentence(ciphertext: string, key: Uint8Array): string {
  try {
    const plaintext = decrypt(ciphertext, key);
    const parsed = JSON.parse(plaintext) as { oneSentence?: string };
    return parsed.oneSentence?.trim() || "";
  } catch {
    return "";
  }
}

function moodIcon(moodWord: string | null): string {
  if (!moodWord) return "·";
  if (moodWord === "wysoki" || moodWord === "wysoka") return "↑";
  if (moodWord === "niski" || moodWord === "niska") return "↓";
  return "–";
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });
  } catch {
    return dateStr;
  }
}

function TimelineContent({ entries }: Props) {
  const { key } = useCryptoKey();
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const daysWithTags = useMemo(() => {
    const grouped = groupByDate(entries);
    if (!key) return grouped;
    return grouped.map((day) => ({ ...day, tags: extractDayTags(day, key) }));
  }, [entries, key]);

  // All unique tags + count → sort by frequency.
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of daysWithTags) {
      for (const t of d.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }, [daysWithTags]);

  // Filter — multi-tag AND.
  const filteredDays = useMemo(() => {
    if (activeTags.length === 0) return daysWithTags;
    return daysWithTags.filter((d) => activeTags.every((t) => d.tags.includes(t)));
  }, [daysWithTags, activeTags]);

  const toggleTag = (t: string) => {
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  if (!key) return null;

  if (daysWithTags.length === 0) {
    return (
      <div className="bv1-form-screen">
        <BoldV1Hero
          eyebrow="Ostatnie 14 dni"
          title="Historia."
          subtitle="Brak wpisów z ostatnich 14 dni. Zacznij od Check-in."
        />
      </div>
    );
  }

  return (
    <div className="bv1-form-screen">
      <BoldV1Hero eyebrow="Ostatnie 14 dni" title="Historia." />

      {/* Sesja 15 A2 — filtr tagów (chipy z #xxx wpisanych w pola check-in/out) */}
      {allTags.length > 0 && (
        <div className="tl-tag-bar">
          <span className="tl-tag-bar-label">Tagi:</span>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              className={`tl-tag-chip${activeTags.includes(t) ? " active" : ""}`}
              onClick={() => toggleTag(t)}
              aria-pressed={activeTags.includes(t)}
            >
              #{t}
            </button>
          ))}
          {activeTags.length > 0 && (
            <button
              type="button"
              className="tl-tag-chip tl-tag-chip-clear"
              onClick={() => setActiveTags([])}
            >
              wyczyść
            </button>
          )}
        </div>
      )}

      <div className="tl-list">
        {filteredDays.map((day) => {
          const oneSentence = day.checkout
            ? extractOneSentence(day.checkout.ciphertext, key)
            : "";
          const moodDisplay = day.checkout?.mood_word || day.checkin?.mood_word || null;

          return (
            <Link
              key={day.date}
              href={`/v/bold-v1/journal/${day.date}` as Route}
              className="tl-row tl-row-link"
            >
              <div className="tl-date-col">
                <span className="tl-mood-icon" aria-label={`nastrój: ${moodDisplay ?? "brak"}`}>
                  {moodIcon(moodDisplay)}
                </span>
                <div>
                  <p className="tl-date">{formatDate(day.date)}</p>
                  <div className="tl-badges">
                    <span className={`tl-badge${day.checkin ? " done" : " missing"}`}>
                      check-in
                    </span>
                    <span className={`tl-badge${day.checkout ? " done" : " missing"}`}>
                      check-out
                    </span>
                  </div>
                </div>
              </div>
              {oneSentence && (
                <p className="tl-summary">{oneSentence}</p>
              )}
              {day.tags.length > 0 && (
                <div className="tl-row-tags">
                  {day.tags.slice(0, 6).map((t) => (
                    <span key={t} className="tl-row-tag">#{t}</span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
        {filteredDays.length === 0 && (
          <p className="text-muted" style={{ marginTop: 16 }}>
            Żaden dzień nie pasuje do wybranych tagów. Wyczyść filtr lub dodaj wpisy z tymi tagami.
          </p>
        )}
      </div>
    </div>
  );
}

export function BoldV1TimelineClient({ entries }: Props) {
  return (
    <BoldV1PassphraseGate>
      <TimelineContent entries={entries} />
    </BoldV1PassphraseGate>
  );
}
