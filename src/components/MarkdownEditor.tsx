"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownEditorProps {
  initialMarkdown: string;
  onSave: (markdown: string) => Promise<void>;
  onCancel?: () => void;
  label?: string;
  placeholder?: string;
}

export function MarkdownEditor({
  initialMarkdown,
  onSave,
  onCancel,
  label,
  placeholder = "Zacznij pisać w Markdown…",
}: MarkdownEditorProps) {
  const [value, setValue] = useState(initialMarkdown);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await onSave(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd zapisu.");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = value !== initialMarkdown;

  return (
    <div className="md-editor">
      {label && <p className="md-editor-label">{label}</p>}
      <div className="md-editor-tabs">
        <button
          className={`md-tab${!preview ? " active" : ""}`}
          onClick={() => setPreview(false)}
          type="button"
        >
          Edytuj
        </button>
        <button
          className={`md-tab${preview ? " active" : ""}`}
          onClick={() => setPreview(true)}
          type="button"
        >
          Podgląd
        </button>
      </div>

      {preview ? (
        <div className="md-editor-preview markdown-content">
          {value.trim() ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted">{placeholder}</p>
          )}
        </div>
      ) : (
        <textarea
          className="md-editor-textarea"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={18}
        />
      )}

      {error && <p className="login-error">{error}</p>}

      <div className="md-editor-actions">
        {onCancel && (
          <button
            className="md-btn-cancel"
            onClick={onCancel}
            type="button"
            disabled={saving}
          >
            Anuluj
          </button>
        )}
        <button
          className="md-btn-save"
          onClick={handleSave}
          type="button"
          disabled={saving || !isDirty}
        >
          {saving ? "Zapisywanie…" : saved ? "Zapisano ✓" : "Zapisz"}
        </button>
      </div>
    </div>
  );
}
