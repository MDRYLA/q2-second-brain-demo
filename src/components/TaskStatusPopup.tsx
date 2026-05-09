"use client";

// + opcjonalnego komentarza. Klik na chip statusu (1/2 / done / skipped) -> popup wyskakuje.
// User moze zapisac status z komentarzem albo sam status (anuluj komentarz).
// Wzorowane na .dzien-edit-backdrop + .dzien-edit-form z DzienPlanClient.

import { useEffect, useRef, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { TagPicker } from "@/components/TagPicker";
import { type TaskStatus } from "@/lib/plan/task-status";
import type { TaskNoteEntry } from "@/lib/plan/tydzien-types";
import { formatNoteTimestamp } from "@/lib/plan/task-notes";
import { appendTag } from "@/lib/utils/text";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Niezrobione",
  done: "Zrobione",
  partial: "Częściowo",
  skipped: "Pominięte",
};

const STATUS_ICONS: Record<TaskStatus, string> = {
  todo: "·",
  done: "✓",
  partial: "½",
  skipped: "✕",
};

interface Props {
  open: boolean;
  taskText: string;
  pendingStatus: TaskStatus;
  notes: TaskNoteEntry[];
  onSave: (status: TaskStatus, comment: string) => void;
  onCancel: () => void;
  onEditNote?: (noteId: string, text: string) => void;
  onDeleteNote?: (noteId: string) => void;
}

export function TaskStatusPopup({
  open,
  taskText,
  pendingStatus,
  notes,
  onSave,
  onCancel,
  onEditNote,
  onDeleteNote,
}: Props) {
  // stage 'comment' (textarea + zapisz). Default 'confirm' przy każdym otwarciu.
  const [mode, setMode] = useState<"confirm" | "comment">("confirm");
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setMode("confirm");
      setComment("");
      setEditingId(null);
    }
  }, [open]);

  // Focus textarea po przejściu do stage comment.
  useEffect(() => {
    if (open && mode === "comment") {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open, mode]);

  if (!open) return null;

  // Stage confirm: "Tak" → przepnij do comment view. "Nie" → zapisz status bez komentarza.
  const handleConfirmYes = () => setMode("comment");
  const handleConfirmNo = () => onSave(pendingStatus, "");

  const handleSave = () => {
    onSave(pendingStatus, comment.trim());
  };

  const handleEditSave = () => {
    if (editingId && onEditNote) {
      onEditNote(editingId, editDraft);
    }
    setEditingId(null);
    setEditDraft("");
  };

  return (
    <div
      className="dzien-edit-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="dzien-edit-form task-popup-form" role="dialog" aria-modal="true" aria-labelledby="task-popup-title">
        <div className="task-popup-header">
          <span className={`task-popup-status-badge task-popup-status-${pendingStatus}`}>
            {STATUS_ICONS[pendingStatus]}
          </span>
          <div className="task-popup-header-text">
            <h3 className="task-popup-title" id="task-popup-title">{taskText}</h3>
            <p className="task-popup-status-label">{STATUS_LABELS[pendingStatus]}</p>
          </div>
        </div>

        {/* Sesja 19 post-handoff v4 (2026-05-06) — 2-stage popup. Stage 'confirm' najpierw,
            stage 'comment' po klik 'Tak'. */}
        {mode === "confirm" ? (
          <>
            {/* Sesja 19 post-handoff v5 (2026-05-06) — różny tekst gdy zadanie ma już komentarze. */}
            <p className="task-popup-question">
              {notes.length > 0 ? "Czy chcesz dodać nowy komentarz?" : "Czy chcesz dodać komentarz?"}
            </p>
            <div className="task-popup-actions">
              <button type="button" className="task-popup-btn-primary" onClick={handleConfirmYes}>
                {notes.length > 0 ? "Tak, dodaj nowy" : "Tak, dodaj komentarz"}
              </button>
              <button type="button" className="task-popup-btn-secondary" onClick={handleConfirmNo}>
                Nie, zapisz status
              </button>
            </div>
          </>
        ) : (
          <>
            {notes.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p className="dash-task-note-label" style={{ marginBottom: 6 }}>
                  Wcześniejsze komentarze
                </p>
                <ul className="dash-task-note-list">
                  {notes.map((n) => (
                    <li key={n.id} className="dash-task-note-entry">
                      {editingId === n.id ? (
                        <>
                          <textarea
                            className="dash-task-note-textarea"
                            value={editDraft}
                            rows={2}
                            onChange={(e) => setEditDraft(e.target.value)}
                          />
                          <div className="dash-task-note-entry-actions">
                            <button type="button" className="dash-task-note-save" onClick={handleEditSave}>
                              Zapisz
                            </button>
                            <button
                              type="button"
                              className="dash-task-note-cancel"
                              onClick={() => setEditingId(null)}
                            >
                              Anuluj
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="dash-task-note-entry-content">
                            <span className="dash-task-note-entry-text">{n.text}</span>
                            {n.timestamp && (
                              <span className="dash-task-note-entry-time">{formatNoteTimestamp(n.timestamp)}</span>
                            )}
                          </div>
                          <div className="dash-task-note-entry-actions">
                            {onEditNote && (
                              <button
                                type="button"
                                className="dash-task-note-entry-edit"
                                onClick={() => {
                                  setEditingId(n.id);
                                  setEditDraft(n.text);
                                }}
                                aria-label="Edytuj"
                              >
                                <Pencil size={12} />
                              </button>
                            )}
                            {onDeleteNote && (
                              <button
                                type="button"
                                className="dash-task-note-entry-delete"
                                onClick={() => onDeleteNote(n.id)}
                                aria-label="Usuń"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="task-popup-comment-wrap" style={{ marginTop: 8 }}>
              <textarea
                ref={textareaRef}
                id="task-popup-comment"
                className="task-popup-textarea"
                value={comment}
                rows={3}
                maxLength={500}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleSave();
                  }
                  if (e.key === "Escape") onCancel();
                }}
              />
              <div style={{ marginTop: 6 }}>
                <TagPicker onPick={(tag) => setComment((c) => appendTag(c, tag))} />
              </div>
            </div>

            <div className="task-popup-actions">
              <button type="button" className="task-popup-btn-primary" onClick={handleSave}>
                Zapisz
              </button>
              <button type="button" className="task-popup-btn-secondary" onClick={onCancel}>
                Anuluj
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
