"use client";

// Gdy nie możesz się zabrać za coś:
// 1. Wpisujesz CO zrobisz + plan
// 2. Klikasz "Zaczynam" → 5-min timer
// 3. Po 5 min raport: udało / nie udało / robię dalej + opcjonalny komentarz
// Wynik zapisany jako entry type='idea' z prefiksem "[Protokół] ..."

import { useEffect, useRef, useState } from "react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { encrypt } from "@/lib/crypto/aes";
import { addIdea } from "@/lib/supabase/entries";
import { getLogicalDateString } from "@/lib/date/day-boundary";

const OPEN_EVENT = "empty-page-open";
const TIMER_SECONDS = 5 * 60;

export function dispatchEmptyPageOpen() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_EVENT));
  }
}

type Phase = "plan" | "active" | "report";
type Outcome = "success" | "fail" | "continue" | null;

export function EmptyPageProtocol() {
  const { key } = useCryptoKey();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("plan");
  const [planText, setPlanText] = useState("");
  const [reportText, setReportText] = useState("");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const startTimeRef = useRef<number>(0);

  // Open event listener
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setPhase("plan");
      setPlanText("");
      setReportText("");
      setOutcome(null);
      setSecondsLeft(TIMER_SECONDS);
      setError("");
    };
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  // Timer countdown gdy active
  useEffect(() => {
    if (phase !== "active") return;
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = TIMER_SECONDS - elapsed;
      if (remaining <= 0) {
        setSecondsLeft(0);
        setPhase("report");
        clearInterval(interval);
        // Try notification (jeśli zgoda)
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("Protokół Pustej Kartki", {
            body: "5 minut minęło. Czas na raport.",
          });
        }
      } else {
        setSecondsLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Esc zamyka
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const startProtocol = () => {
    if (!planText.trim()) {
      setError("Wpisz co zamierzasz zrobić.");
      return;
    }
    setError("");
    setPhase("active");
    // Request notification permission (best-effort)
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  };

  const finishEarly = () => {
    setPhase("report");
  };

  const saveReport = async () => {
    if (!outcome) {
      setError("Wybierz wynik.");
      return;
    }
    if (!key) {
      setError("Brak klucza szyfrowania.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const outcomeLabel =
        outcome === "success" ? "✓ udało się"
        : outcome === "continue" ? "→ robię dalej"
        : "✕ nie udało się";
      const fullText = `[Protokół] ${planText.trim()}\n\nWynik: ${outcomeLabel}${reportText.trim() ? `\nUwagi: ${reportText.trim()}` : ""}`;
      const ciphertext = encrypt(JSON.stringify({ text: fullText }), key);
      const result = await addIdea(getLogicalDateString(), ciphertext);
      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
      setSaving(false);
      setOpen(false);
      setToast("Protokół zapisany");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd zapisu.");
      setSaving(false);
    }
  };

  const formatTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  if (!open) return toast ? <div className="quick-capture-toast" role="status">{toast}</div> : null;

  return (
    <>
      <div
        className="quick-capture-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        role="presentation"
      >
        <div className="quick-capture-modal empty-page-modal" role="dialog" aria-modal="true" aria-label="Protokół Pustej Kartki">
          <div className="quick-capture-header">
            <span className="quick-capture-title">Protokół Pustej Kartki</span>
            <span className="quick-capture-hint">
              {phase === "plan" && "Esc anuluj"}
              {phase === "active" && `${formatTime(secondsLeft)} pozostało`}
              {phase === "report" && "Raport"}
            </span>
          </div>

          {phase === "plan" && (
            <>
              <p className="empty-page-help">
                Co zrobisz? Krótki plan działania na 5 min.
              </p>
              <textarea
                className="quick-capture-textarea"
                value={planText}
                onChange={(e) => setPlanText(e.target.value)}
                placeholder=""
                rows={3}
                autoFocus
                maxLength={500}
              />
              {error && <p className="login-error" style={{ marginTop: 6 }}>{error}</p>}
              <div className="quick-capture-actions">
                <button type="button" className="btn-edit" onClick={() => setOpen(false)}>
                  Anuluj
                </button>
                <button
                  type="button"
                  className="btn-edit quick-capture-save"
                  onClick={startProtocol}
                  disabled={!planText.trim()}
                >
                  Zaczynam (5 min)
                </button>
              </div>
            </>
          )}

          {phase === "active" && (
            <div className="empty-page-active">
              <div className="empty-page-timer" aria-live="polite">
                {formatTime(secondsLeft)}
              </div>
              <p className="empty-page-plan-recap">
                <strong>Plan:</strong> {planText}
              </p>
              <p className="empty-page-help">
                Działaj. Apka przypomni za 5 minut. Możesz też zakończyć wcześniej.
              </p>
              <div className="quick-capture-actions">
                <button type="button" className="btn-edit" onClick={finishEarly}>
                  Zakończ teraz
                </button>
              </div>
            </div>
          )}

          {phase === "report" && (
            <>
              <p className="empty-page-help">
                <strong>Plan był:</strong> {planText}
              </p>
              <div className="empty-page-outcomes">
                <button
                  type="button"
                  className={`empty-page-outcome${outcome === "success" ? " active" : ""}`}
                  onClick={() => setOutcome("success")}
                >
                  ✓ Udało się
                </button>
                <button
                  type="button"
                  className={`empty-page-outcome${outcome === "continue" ? " active" : ""}`}
                  onClick={() => setOutcome("continue")}
                >
                  → Robię dalej
                </button>
                <button
                  type="button"
                  className={`empty-page-outcome${outcome === "fail" ? " active" : ""}`}
                  onClick={() => setOutcome("fail")}
                >
                  ✕ Nie udało się
                </button>
              </div>
              <textarea
                className="quick-capture-textarea"
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Krótki komentarz (opcjonalne) — co poszło, co dalej?"
                rows={2}
                maxLength={500}
              />
              {error && <p className="login-error" style={{ marginTop: 6 }}>{error}</p>}
              <div className="quick-capture-actions">
                <button type="button" className="btn-edit" onClick={() => setOpen(false)} disabled={saving}>
                  Pomiń
                </button>
                <button
                  type="button"
                  className="btn-edit quick-capture-save"
                  onClick={saveReport}
                  disabled={saving || !outcome}
                >
                  {saving ? "Zapisuję..." : "Zapisz"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
