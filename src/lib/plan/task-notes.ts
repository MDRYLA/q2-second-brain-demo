// Backwards compat: stary `task.note: string` → wirtualnie [{ id: "legacy", text, timestamp: "" }].

import type { TaskNoteEntry, TydzienTask } from "@/lib/plan/tydzien-types";
import type { TaskStatus } from "@/lib/plan/task-status";

function makeId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 9);
}

/**
 * Zwraca normalizowaną listę komentarzy zadania (legacy `note: string` jako pierwszy entry).
 */
export function getNotes(task: Pick<TydzienTask, "note" | "notes">): TaskNoteEntry[] {
  if (task.notes && task.notes.length > 0) return task.notes;
  if (task.note && task.note.trim().length > 0) {
    return [{ id: "legacy", text: task.note, timestamp: "" }];
  }
  return [];
}

/**
 * Dodaje nowy comment z auto-timestamp (now).
 */
export function addNote(
  task: TydzienTask,
  text: string,
  status?: TaskStatus,
): TydzienTask {
  const trimmed = text.trim();
  if (!trimmed) return task;
  const now = new Date().toISOString();
  const existing = getNotes(task).filter((n) => n.id !== "legacy" || n.text.trim().length > 0);
  // Migracja legacy: zachowaj jako entry z generowanym id.
  const migrated = existing.map((n) => (n.id === "legacy" ? { ...n, id: makeId() } : n));
  const newEntry: TaskNoteEntry = {
    id: makeId(),
    text: trimmed,
    timestamp: now,
    status,
  };
  return { ...task, notes: [...migrated, newEntry], note: undefined };
}

/**
 * Edytuje istniejący comment.
 */
export function editNote(
  task: TydzienTask,
  noteId: string,
  newText: string,
): TydzienTask {
  const trimmed = newText.trim();
  const notes = getNotes(task);
  const updated = notes
    .map((n) => (n.id === noteId ? { ...n, text: trimmed } : n))
    .filter((n) => n.text.length > 0);
  return { ...task, notes: updated, note: undefined };
}

/**
 * Usuwa comment.
 */
export function deleteNote(task: TydzienTask, noteId: string): TydzienTask {
  const notes = getNotes(task).filter((n) => n.id !== noteId);
  return { ...task, notes, note: undefined };
}

/**
 * Format daty: "6 maj 15:30" (skrócone).
 */
export function formatNoteTimestamp(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("pl-PL", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
