"use client";

// Modal textarea → save jako entry type='idea'. Zero kontekst-switchingu.

import { useEffect, useRef, useState } from "react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { encrypt } from "@/lib/crypto/aes";
import { addIdea } from "@/lib/supabase/entries";
import { getLogicalDateString } from "@/lib/date/day-boundary";
import { TagPicker } from "@/components/TagPicker";
import { appendTag } from "@/lib/utils/text";

const OPEN_EVENT = "quick-capture-open";

export function dispatchQuickCaptureOpen() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_EVENT));
  }
}

export function QuickCapture() {
  const { key } = useCryptoKey();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Globalny hotkey Cmd+Shift+Space (mac) / Ctrl+Shift+Space (win/linux).
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.code === "Space") {
        e.preventDefault();
        setOpen(true);
      }
    };
    const handleOpen = () => setOpen(true);
    window.addEventListener("keydown", handleKey);
    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener(OPEN_EVENT, handleOpen);
    };
  }, []);

  // Auto-focus textarea + reset state przy otwarciu.
  useEffect(() => {
    if (open) {
      setError("");
      setText("");
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  // Esc zamyka, Cmd/Ctrl+Enter zapisuje.
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, text]);

  // Auto-hide toast po 2s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const save = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Wpisz coś przed zapisem.");
      return;
    }
    if (!key) {
      setError("Brak klucza szyfrowania (zaloguj się ponownie).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const ciphertext = encrypt(JSON.stringify({ text: trimmed }), key);
      const result = await addIdea(getLogicalDateString(), ciphertext);
      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }
      setSaving(false);
      setText("");
      setOpen(false);
      setToast("Zapisano w pomysłach");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd zapisu.");
      setSaving(false);
    }
  };

  return (
    <>
      {open && (
        <div
          className="quick-capture-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          role="presentation"
        >
          <div
            className="quick-capture-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Quick capture — zapisz pomysł"
          >
            <div className="quick-capture-header">
              <span className="quick-capture-title">Pomysł / notka</span>
              <span className="quick-capture-hint">⌘⏎ zapisz · Esc anuluj</span>
            </div>
            <textarea
              ref={textareaRef}
              className="quick-capture-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Co Ci wpadło do głowy?"
              rows={4}
              maxLength={2000}
            />
            <TagPicker onPick={(tag) => setText((prev) => appendTag(prev, tag))} />
            {error && <p className="login-error" style={{ marginTop: 6 }}>{error}</p>}
            <div className="quick-capture-actions">
              <button
                type="button"
                className="btn-edit"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Anuluj
              </button>
              <button
                type="button"
                className="btn-edit quick-capture-save"
                onClick={save}
                disabled={saving || !text.trim()}
              >
                {saving ? "Zapisuję..." : "Zapisz"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="quick-capture-toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
