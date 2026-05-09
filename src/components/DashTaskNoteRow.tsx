"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import type { TaskStatus } from "@/lib/plan/task-status";
import type { TaskNoteEntry } from "@/lib/plan/tydzien-types";
import { formatNoteTimestamp } from "@/lib/plan/task-notes";

// Dodawanie nowych komentarzy przeniesione do TaskStatusPopup (modal) — wywoływany przy kliknieciu
// chipa statusu zadania. DashTaskNoteRow tylko pokazuje historie + pozwala edit/delete.

interface Props {
  taskId: string;
  taskText: string;
  status: TaskStatus;
  notes: TaskNoteEntry[];
  onEditNote?: (taskId: string, noteId: string, text: string) => void;
  onDeleteNote?: (taskId: string, noteId: string) => void;
}

export function DashTaskNoteRow({
  taskId,
  taskText,
  status,
  notes,
  onEditNote,
  onDeleteNote,
}: Props) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<string>("");

  const statusIcon =
    status === "partial" ? "½" : status === "done" ? "✓" : status === "skipped" ? "✕" : "·";

  const submitEdit = () => {
    if (!editingId) return;
    if (onEditNote) onEditNote(taskId, editingId, editDraft);
    setEditingId(null);
    setEditDraft("");
  };

  // Bez notek nic nie renderujemy — popup obsługuje dodawanie.
  if (notes.length === 0) return null;

  if (!expanded) {
    return (
      <div className="dash-task-note-row collapsed">
        <button
          type="button"
          className="dash-task-note-display"
          onClick={() => setExpanded(true)}
          aria-label={`Pokaz ${notes.length} komentarze`}
        >
          <span>
            {notes.length}{" "}
            {notes.length === 1 ? "komentarz" : notes.length < 5 ? "komentarze" : "komentarzy"} — pokaż
          </span>
          <Pencil size={12} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="dash-task-note-row editing">
      <div className="dash-task-note-row-header">
        <span className="dash-task-note-label">
          {statusIcon} {taskText}
        </span>
        <button
          type="button"
          className="dash-task-note-collapse"
          onClick={() => setExpanded(false)}
          aria-label="Zwiń"
        >
          <X size={14} />
        </button>
      </div>

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
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      submitEdit();
                    }
                    if (e.key === "Escape") {
                      setEditingId(null);
                    }
                  }}
                />
                <div className="dash-task-note-entry-actions">
                  <button type="button" className="dash-task-note-save" onClick={submitEdit}>
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
                      onClick={() => onDeleteNote(taskId, n.id)}
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
  );
}
