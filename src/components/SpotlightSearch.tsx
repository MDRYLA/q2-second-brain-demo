"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Search, X } from "lucide-react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { decrypt } from "@/lib/crypto/aes";
import { fetchRecentEntries, fetchAllIdeas } from "@/lib/supabase/entries";
import { fetchNotes } from "@/lib/supabase/knowledge";
import type { EntryMeta } from "@/lib/supabase/entries";
import type { KnowledgeNoteRow } from "@/lib/supabase/knowledge";
import { Skeleton } from "@/components/Skeleton";

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  href: Route;
  source: "Check-in" | "Check-out" | "Pomysł" | "Wiedza" | "Ważne";
  date?: string;
}

const MAX_SNIPPET = 140;

function snippet(text: string, query: string): string {
  if (!query) return text.slice(0, MAX_SNIPPET);
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx < 0) return text.slice(0, MAX_SNIPPET);
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + query.length + 80);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

export function SpotlightSearch() {
  const { key } = useCryptoKey();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entries, setEntries] = useState<EntryMeta[]>([]);
  const [ideas, setIdeas] = useState<EntryMeta[]>([]);
  const [notes, setNotes] = useState<KnowledgeNoteRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("spotlight-open", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("spotlight-open", onOpenEvent);
    };
  }, [open]);

  // Lazy load data on first open
  useEffect(() => {
    if (open && !loaded && key) {
      (async () => {
        try {
          const [recent, ideasList, notesList] = await Promise.all([
            fetchRecentEntries(["checkin", "checkout"], 30),
            fetchAllIdeas(),
            fetchNotes(200),
          ]);
          setEntries(recent);
          setIdeas(ideasList);
          setNotes(notesList);
          setLoaded(true);
          setLoadError(null);
        } catch (err) {
          console.error("[SpotlightSearch] load failed:", err);
          setLoadError(
            err instanceof Error
              ? `Nie udało się załadować danych: ${err.message}`
              : "Nie udało się załadować danych. Sprawdź połączenie i odśwież stronę."
          );
          setLoaded(true);
        }
      })();
    }
  }, [open, loaded, key]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery("");
    }
  }, [open]);

  const results: SearchResult[] = useMemo(() => {
    if (!key || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    const out: SearchResult[] = [];

    // Check-in / Check-out
    for (const e of entries) {
      try {
        const data = JSON.parse(decrypt(e.ciphertext, key)) as Record<string, unknown>;
        const fields: string[] = [];
        if (e.entry_type === "checkin") {
          fields.push(
            (data.firstAction as string) ?? "",
            (data.intentions as string) ?? "",
            (data.excitedAbout as string) ?? "",
            (data.worriedAbout as string) ?? "",
          );
        } else if (e.entry_type === "checkout") {
          fields.push(
            (data.oneSentence as string) ?? "",
            (data.whatWorked as string) ?? "",
            (data.whatFailed as string) ?? "",
            (data.whatDiscovered as string) ?? "",
            (data.whoTalkedTo as string) ?? "",
          );
        }
        const combined = fields.join(" \n ");
        if (combined.toLowerCase().includes(q)) {
          out.push({
            id: e.id,
            title: e.entry_type === "checkin" ? "Check-in" : "Check-out",
            snippet: snippet(combined.trim(), query),
            href: `/journal/${e.entry_date}` as Route,
            source: e.entry_type === "checkin" ? "Check-in" : "Check-out",
            date: e.entry_date,
          });
        }
      } catch {
        // skip
      }
    }

    // Pomysły
    for (const idea of ideas) {
      try {
        const data = JSON.parse(decrypt(idea.ciphertext, key)) as { text?: string };
        const text = data.text ?? "";
        if (text.toLowerCase().includes(q)) {
          out.push({
            id: idea.id,
            title: text.slice(0, 60) + (text.length > 60 ? "…" : ""),
            snippet: snippet(text, query),
            href: "/pomysly" as Route,
            source: "Pomysł",
            date: idea.entry_date,
          });
        }
      } catch {
        // skip
      }
    }

    // Wiedza notes
    for (const note of notes) {
      try {
        const data = JSON.parse(decrypt(note.ciphertext, key)) as {
          title?: string;
          body?: string;
          tags?: string[];
        };
        const combined = `${data.title ?? ""} ${data.body ?? ""} ${(data.tags ?? []).join(" ")}`;
        if (combined.toLowerCase().includes(q)) {
          out.push({
            id: note.id,
            title: data.title || "(bez tytułu)",
            snippet: snippet(data.body ?? "", query),
            href: "/wiedza" as Route,
            source: "Wiedza",
          });
        }
      } catch {
        // skip
      }
    }

    return out.slice(0, 30);
  }, [query, entries, ideas, notes, key]);

  if (!open) return null;

  return (
    <div className="spotlight-overlay" onClick={() => setOpen(false)} role="presentation">
      <div
        className="spotlight-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="spotlight-input"
      >
        <div className="spotlight-search-bar">
          <Search size={16} aria-hidden />
          <input
            id="spotlight-input"
            ref={inputRef}
            type="text"
            className="spotlight-input"
            placeholder="Szukaj w check-in/out, pomysłach, wiedzy…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button
            type="button"
            className="spotlight-close"
            onClick={() => setOpen(false)}
            aria-label="Zamknij"
          >
            <X size={16} />
          </button>
          <kbd className="spotlight-hint">Esc</kbd>
        </div>

        {!loaded && (
          <div className="spotlight-loading" aria-busy="true">
            <Skeleton variant="text" width="80%" height="14px" />
            <Skeleton variant="text" width="60%" height="14px" />
            <Skeleton variant="text" width="70%" height="14px" />
          </div>
        )}

        {loaded && loadError && (
          <p className="spotlight-empty" style={{ color: "var(--blood, #f87171)" }}>
            {loadError}
          </p>
        )}

        {loaded && !loadError && !query.trim() && (
          <p className="spotlight-empty">
            Wpisz frazę. Szukamy w ostatnich 30 dniach check-in/out, wszystkich pomysłach i notatkach wiedzy.
          </p>
        )}

        {loaded && query.trim() && results.length === 0 && (
          <p className="spotlight-empty">Brak wyników dla &ldquo;{query}&rdquo;.</p>
        )}

        {loaded && results.length > 0 && (
          <ul className="spotlight-results">
            {results.map((r) => (
              <li key={`${r.source}-${r.id}`}>
                <Link
                  href={r.href}
                  className="spotlight-result"
                  onClick={() => setOpen(false)}
                >
                  <span className="spotlight-result-source">{r.source}</span>
                  <span className="spotlight-result-title">{r.title}</span>
                  {r.date && <span className="spotlight-result-date">{r.date}</span>}
                  {r.snippet && <span className="spotlight-result-snippet">{r.snippet}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
