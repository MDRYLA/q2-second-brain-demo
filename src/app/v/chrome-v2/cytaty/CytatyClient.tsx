"use client";

import { useEffect, useState } from "react";
import { Trash2, Quote as QuoteIcon } from "lucide-react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { ChromeV2PassphraseGate } from "@/components/v/chrome-v2/PassphraseGate";
import { ChromeV2Hero } from "@/components/v/chrome-v2/Hero";
import { saveSnapshotCiphertext } from "@/lib/supabase/snapshots";
import { encrypt, decrypt } from "@/lib/crypto/aes";
import { parseQuotes, type Quote } from "@/lib/cytaty/parse";

interface Props {
  initialCiphertext: string | null;
  seedContent: string;
}

function quotesToMarkdown(quotes: Quote[]): string {
  const header = "# Cytaty\n\n";
  const body = quotes
    .filter((q) => q.text.trim().length > 0)
    .map((q) => `> "${q.text.trim()}" — ${q.author.trim() || "—"}`)
    .join("\n\n");
  return header + body + "\n";
}

function CytatyContent({ initialCiphertext, seedContent }: Props) {
  const { key } = useCryptoKey();

  const initialQuotes = (() => {
    if (initialCiphertext && key) {
      try {
        return parseQuotes(decrypt(initialCiphertext, key));
      } catch {
        return [];
      }
    }
    return parseQuotes(seedContent);
  })();

  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  // beforeunload guard — chroni przed utratą cytatów przy zamknięciu karty (audyt #16).
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  if (!key) return null;

  const updateQuote = (idx: number, patch: Partial<Quote>) => {
    setQuotes((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
    setSavedAt(null);
    setDirty(true);
  };

  const addQuote = () => {
    setQuotes((prev) => [...prev, { text: "", author: "" }]);
    setSavedAt(null);
    setDirty(true);
  };

  const removeQuote = (idx: number) => {
    setQuotes((prev) => prev.filter((_, i) => i !== idx));
    setSavedAt(null);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const cleaned = quotes.filter((q) => q.text.trim().length > 0);
      const md = quotesToMarkdown(cleaned);
      const ciphertext = encrypt(md, key);
      const result = await saveSnapshotCiphertext("cytaty", ciphertext);
      if (result.error) throw new Error(result.error);
      setQuotes(cleaned);
      setSavedAt(Date.now());
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd zapisu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cv2-form-screen">
      <ChromeV2Hero
        eyebrow="Twoja kolekcja"
        title="Cytaty"
        subtitle="Dashboard losuje 1 cytat dziennie. Dodawaj swoje, edytuj lub usuwaj."
      />

      <div className="cytaty-list">
        {quotes.length === 0 && (
          <p className="text-muted" style={{ padding: "16px 0" }}>
            Brak cytatów. Dodaj pierwszy poniżej.
          </p>
        )}
        {quotes.map((q, i) => (
          <div key={i} className="cytaty-row">
            <div className="cytaty-row-icon">
              <QuoteIcon size={16} />
            </div>
            <div className="cytaty-row-fields">
              <textarea
                className="ci-textarea ci-textarea-sm"
                placeholder="Treść cytatu"
                value={q.text}
                maxLength={400}
                onChange={(e) => updateQuote(i, { text: e.target.value })}
              />
              <input
                type="text"
                className="ci-input ci-input-wide"
                placeholder="Autor"
                value={q.author}
                maxLength={120}
                onChange={(e) => updateQuote(i, { author: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="cytaty-row-remove"
              onClick={() => removeQuote(i)}
              aria-label="Usuń cytat"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        <button type="button" className="cytaty-add-btn" onClick={addQuote}>
          + Dodaj cytat
        </button>
      </div>

      {error && <p className="login-error">{error}</p>}

      <div className="ci-actions">
        <button
          type="button"
          className="cv2-btn cv2-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? "Zapisuję…"
            : savedAt
              ? "Zapisano ✓"
              : "Zapisz cytaty"}
        </button>
      </div>
    </div>
  );
}

export function ChromeV2CytatyClient(props: Props) {
  return (
    <ChromeV2PassphraseGate>
      <CytatyContent {...props} />
    </ChromeV2PassphraseGate>
  );
}
