"use client";

import { useMemo, useState, useTransition } from "react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { ChromeV2PassphraseGate } from "@/components/v/chrome-v2/PassphraseGate";
import { ChromeV2Hero } from "@/components/v/chrome-v2/Hero";
import { Button } from "@/components/v/chrome-v2/Button";
import { Input } from "@/components/v/chrome-v2/Input";
import { Textarea } from "@/components/v/chrome-v2/Textarea";
import { encrypt, decrypt } from "@/lib/crypto/aes";
import {
  createNote,
  updateNote,
  deleteNote,
  type KnowledgeNoteRow,
} from "@/lib/supabase/knowledge";
import { addIdea, deleteIdea, type EntryMeta } from "@/lib/supabase/entries";
import { getLogicalDateString } from "@/lib/date/day-boundary";

const IDEA_TAGS = [
  "praca",
  "relacje",
  "pomysł",
  "obawa",
  "wdzięczność",
  "refleksja",
  "konflikt",
  "wzorzec",
  "cień",
  "zwycięstwo",
] as const;
type IdeaTag = (typeof IDEA_TAGS)[number];

interface NoteData {
  title: string;
  body: string;
  tags: string[];
}
interface IdeaPayload {
  text: string;
  tags: IdeaTag[];
}
interface MergedItem {
  id: string;
  kind: "note" | "idea";
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
}

function decodeNote(ciphertext: string, key: Uint8Array): NoteData {
  try {
    const plain = JSON.parse(decrypt(ciphertext, key)) as Partial<NoteData>;
    return {
      title: plain.title ?? "(bez tytułu)",
      body: plain.body ?? "",
      tags: plain.tags ?? [],
    };
  } catch {
    return { title: "[błąd odczytu]", body: "", tags: [] };
  }
}

function decodeIdea(ciphertext: string, key: Uint8Array): IdeaPayload {
  try {
    const plain = decrypt(ciphertext, key);
    if (plain.trim().startsWith("{")) {
      const parsed = JSON.parse(plain) as { text?: string; tags?: string[] };
      const tags = (parsed.tags ?? []).filter((t): t is IdeaTag =>
        (IDEA_TAGS as readonly string[]).includes(t),
      );
      return { text: parsed.text ?? plain, tags };
    }
    return { text: plain, tags: [] };
  } catch {
    return { text: "[błąd odczytu]", tags: [] };
  }
}

interface Props {
  initialNotes: KnowledgeNoteRow[];
  initialIdeas: EntryMeta[];
}

function NotatkiContent({ initialNotes, initialIdeas }: Props) {
  const { key } = useCryptoKey();
  const [notes, setNotes] = useState<KnowledgeNoteRow[]>(initialNotes);
  const [ideas, setIdeas] = useState<EntryMeta[]>(initialIdeas);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Edit state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingBody, setEditingBody] = useState("");

  // Add modal state
  const [showAdd, setShowAdd] = useState(false);
  const [newKind, setNewKind] = useState<"note" | "idea">("note");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newSelectedTags, setNewSelectedTags] = useState<IdeaTag[]>([]);

  // Search/filter
  const [search, setSearch] = useState("");
  const [filterKind, setFilterKind] = useState<"" | "note" | "idea">("");

  const merged: MergedItem[] = useMemo(() => {
    if (!key) return [];
    const noteItems: MergedItem[] = notes.map((n) => {
      const d = decodeNote(n.ciphertext, key);
      return {
        id: n.id,
        kind: "note" as const,
        title: d.title,
        body: d.body,
        tags: d.tags,
        createdAt: n.created_at,
      };
    });
    const ideaItems: MergedItem[] = ideas.map((i) => {
      const d = decodeIdea(i.ciphertext, key);
      const text = d.text;
      const firstLine = text.split("\n")[0]?.slice(0, 80) ?? "";
      return {
        id: i.id,
        kind: "idea" as const,
        title: firstLine || "(pomysł bez tytułu)",
        body: text,
        tags: d.tags,
        createdAt: i.created_at,
      };
    });
    return [...noteItems, ...ideaItems].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }, [notes, ideas, key]);

  const filtered = useMemo(() => {
    return merged.filter((m) => {
      if (filterKind && m.kind !== filterKind) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !m.title.toLowerCase().includes(q) &&
          !m.body.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [merged, filterKind, search]);

  if (!key) return null;

  const handleAdd = () => {
    if (!newBody.trim() && newKind === "idea") {
      setError("Tekst pomysłu nie może być pusty.");
      return;
    }
    if (!newTitle.trim() && !newBody.trim() && newKind === "note") {
      setError("Tytuł lub treść notatki nie mogą być puste.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        if (newKind === "note") {
          const data: NoteData = {
            title: newTitle.trim() || "(bez tytułu)",
            body: newBody,
            tags: newSelectedTags,
          };
          const ciphertext = encrypt(JSON.stringify(data), key);
          const tagsHash: string[] = [];
          const { id, error: e } = await createNote(ciphertext, tagsHash);
          if (e || !id) throw new Error(e ?? "Błąd zapisu");
          setNotes((prev) => [
            {
              id,
              ciphertext,
              tags_hash: tagsHash,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        } else {
          const payload: IdeaPayload = {
            text: newBody.trim(),
            tags: newSelectedTags,
          };
          const ciphertext = encrypt(JSON.stringify(payload), key);
          const ideaDate = getLogicalDateString();
          const { id, error: e } = await addIdea(ideaDate, ciphertext);
          if (e || !id) throw new Error(e ?? "Błąd zapisu");
          setIdeas((prev) => [
            {
              id,
              entry_date: ideaDate,
              entry_type: "idea",
              mood_word: null,
              ciphertext,
              created_at: new Date().toISOString(),
            } as EntryMeta,
            ...prev,
          ]);
        }
        setShowAdd(false);
        setNewTitle("");
        setNewBody("");
        setNewSelectedTags([]);
        setNewKind("note");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd zapisu");
      }
    });
  };

  const startEditNote = (item: MergedItem) => {
    if (item.kind !== "note") return;
    setEditingNoteId(item.id);
    setEditingTitle(item.title);
    setEditingBody(item.body);
  };

  const saveEditNote = () => {
    if (!editingNoteId) return;
    setError(""); // Faza 7 fresh-review: clear error przed nową próbą
    startTransition(async () => {
      try {
        const note = notes.find((n) => n.id === editingNoteId);
        if (!note) return;
        const decoded = decodeNote(note.ciphertext, key);
        const data: NoteData = {
          title: editingTitle.trim() || "(bez tytułu)",
          body: editingBody,
          tags: decoded.tags,
        };
        const ciphertext = encrypt(JSON.stringify(data), key);
        const tagsHash: string[] = [];
        const { error: e } = await updateNote(editingNoteId, ciphertext, tagsHash);
        if (e) throw new Error(e);
        setNotes((prev) =>
          prev.map((n) =>
            n.id === editingNoteId
              ? { ...n, ciphertext, tags_hash: tagsHash, updated_at: new Date().toISOString() }
              : n,
          ),
        );
        setEditingNoteId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd edycji");
      }
    });
  };

  const handleDelete = (item: MergedItem) => {
    if (!confirm("Usunąć ten element?")) return;
    setError(""); // Faza 7 fresh-review: clear error przed delete
    startTransition(async () => {
      try {
        if (item.kind === "note") {
          const { error: e } = await deleteNote(item.id);
          if (e) throw new Error(e);
          setNotes((prev) => prev.filter((n) => n.id !== item.id));
        } else {
          const { error: e } = await deleteIdea(item.id);
          if (e) throw new Error(e);
          setIdeas((prev) => prev.filter((i) => i.id !== item.id));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Błąd usuwania");
      }
    });
  };

  const toggleNewTag = (tag: IdeaTag) => {
    setNewSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <div className="cv2-form-screen">
      <ChromeV2Hero
        eyebrow="Notatki + Pomysły"
        title="Notatki"
        subtitle="Wszystko w jednym miejscu — notatki i pomysły"
      >
        <div style={{ marginTop: 16 }}>
          <Button variant="primary" onClick={() => setShowAdd(true)}>
            + Dodaj
          </Button>
        </div>
      </ChromeV2Hero>

      {/* Search + filter */}
      <section className="cv2-form-section">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Input
            type="search"
            placeholder="Szukaj…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: "1 1 240px" }}
          />
          <div className="cv2-radio-row">
            {([
              { val: "", label: "Wszystkie" },
              { val: "note", label: "Notatki" },
              { val: "idea", label: "Pomysły" },
            ] as const).map((opt) => (
              <button
                key={opt.val}
                type="button"
                className={filterKind === opt.val ? "cv2-radio-btn is-active" : "cv2-radio-btn"}
                onClick={() => setFilterKind(opt.val)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <p className="cv2-form-error">{error}</p>}

      {/* Merged list */}
      <section className="cv2-form-section">
        {filtered.length === 0 ? (
          <p style={{ color: "rgba(26, 26, 26, 0.55)", textAlign: "center", padding: 24 }}>
            Brak elementów. Dodaj pierwszą notatkę lub pomysł.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((item) => (
              <li
                key={`${item.kind}-${item.id}`}
                style={{
                  padding: 16,
                  background: "#f8f7f4",
                  border: "1px solid rgba(0, 0, 0, 0.10)",
                  borderLeft: `3px solid ${item.kind === "note" ? "var(--cv2-accent-blue)" : "var(--cv2-accent-bronze)"}`,
                  borderRadius: "14px",
                }}
              >
                {editingNoteId === item.id ? (
                  <div>
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      placeholder="Tytuł"
                      style={{ marginBottom: 8 }}
                    />
                    <Textarea
                      value={editingBody}
                      onChange={(e) => setEditingBody(e.target.value)}
                      rows={6}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <Button variant="primary" onClick={saveEditNote} disabled={pending}>
                        Zapisz
                      </Button>
                      <Button variant="ghost" onClick={() => setEditingNoteId(null)}>
                        Anuluj
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1a1a1a" }}>
                        {item.title}
                      </h3>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 999,
                          textTransform: "uppercase",
                          letterSpacing: "0.10em",
                          background: item.kind === "note" ? "var(--cv2-accent-blue)" : "var(--cv2-accent-bronze)",
                          color: item.kind === "note" ? "#ffffff" : "#1a1a1a",
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {item.kind === "note" ? "Notatka" : "Pomysł"}
                      </span>
                    </div>
                    {item.body && (
                      <p style={{ margin: "0 0 8px", color: "#1a1a1a", fontSize: 14, whiteSpace: "pre-wrap" }}>
                        {item.body.length > 200 ? item.body.slice(0, 200) + "…" : item.body}
                      </p>
                    )}
                    {item.tags.length > 0 && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: "#ffffff",
                              color: "rgba(26, 26, 26, 0.55)",
                              border: "1px solid rgba(0, 0, 0, 0.10)",
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      {item.kind === "note" && (
                        <Button variant="ghost" onClick={() => startEditNote(item)}>
                          Edytuj
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => handleDelete(item)} disabled={pending}>
                        Usuń
                      </Button>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(26, 26, 26, 0.55)" }}>
                        {new Date(item.createdAt).toLocaleDateString("pl-PL")}
                      </span>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add modal */}
      {showAdd && (
        <div
          role="presentation"
          onClick={() => { setShowAdd(false); setError(""); }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(14, 20, 32, 0.78)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{
              background: "#ffffff",
              borderRadius: "var(--cv2-radius-lg)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: 32,
              maxWidth: 560,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 24px 64px rgba(0, 0, 0, 0.55), 0 8px 16px rgba(0, 0, 0, 0.30)",
            }}
          >
            <h2 className="cv2-form-section-title" style={{ marginBottom: 16 }}>
              Nowy element
            </h2>

            <div className="cv2-radio-row" style={{ marginBottom: 16 }}>
              {(["note", "idea"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={newKind === kind ? "cv2-radio-btn is-active" : "cv2-radio-btn"}
                  onClick={() => setNewKind(kind)}
                >
                  {kind === "note" ? "Notatka" : "Pomysł"}
                </button>
              ))}
            </div>

            {newKind === "note" && (
              <div style={{ marginBottom: 12 }}>
                <label className="cv2-form-label">Tytuł</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Krótki tytuł"
                />
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label className="cv2-form-label">
                {newKind === "note" ? "Treść" : "Tekst pomysłu"}
              </label>
              <Textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={6}
                placeholder=""
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="cv2-form-label">Tagi</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {IDEA_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleNewTag(tag)}
                    className={newSelectedTags.includes(tag) ? "cv2-radio-btn is-active" : "cv2-radio-btn"}
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="cv2-form-actions">
              <Button variant="ghost" onClick={() => { setShowAdd(false); setError(""); }}>
                Anuluj
              </Button>
              <Button variant="primary" onClick={handleAdd} disabled={pending}>
                {pending ? "Zapisuję…" : "Dodaj"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChromeV2NotatkiClient(props: Props) {
  return (
    <ChromeV2PassphraseGate>
      <NotatkiContent {...props} />
    </ChromeV2PassphraseGate>
  );
}
