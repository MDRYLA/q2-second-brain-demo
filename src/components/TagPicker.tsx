"use client";

// localStorage persist per device. Sortowanie alfabetyczne.

import { useEffect, useRef, useState } from "react";
import { Tag, Settings, X, Plus } from "lucide-react";
import { addUserTag, getUserTags, removeUserTag, TAGS_EVENT } from "@/lib/tags/storage";

interface Props {
  onPick: (hashtag: string) => void; // przekazuje "#xxx" do parent
}

export function TagPicker({ onPick }: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Plus storage event na cross-tab sync (np. user edytuje na desktopie i mobilu).
  useEffect(() => {
    const refresh = () => setTags(getUserTags());
    refresh();
    window.addEventListener(TAGS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(TAGS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handlePick = (tag: string) => {
    onPick(`#${tag}`);
    setDropdownOpen(false);
  };

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    const next = addUserTag(trimmed);
    setTags(next);
    setNewTag("");
  };

  const handleRemove = (tag: string) => {
    const next = removeUserTag(tag);
    setTags(next);
  };

  return (
    <div className="tag-picker" ref={wrapperRef}>
      <button
        type="button"
        className="tag-picker-trigger"
        onClick={() => setDropdownOpen((p) => !p)}
        aria-label="Wybierz tag"
        title="Wstaw tag"
      >
        <Tag size={14} aria-hidden />
        <span>Tagi</span>
      </button>

      {dropdownOpen && (
        <div className="tag-picker-dropdown" role="menu">
          <div className="tag-picker-dropdown-header">
            <span>Wybierz tag</span>
            <button
              type="button"
              className="tag-picker-edit-btn"
              onClick={() => {
                setEditOpen(true);
                setDropdownOpen(false);
              }}
              aria-label="Edytuj listę tagów"
              title="Edytuj listę"
            >
              <Settings size={14} />
            </button>
          </div>
          {tags.length === 0 ? (
            <p className="tag-picker-empty">Brak tagów. Kliknij ⚙ żeby dodać.</p>
          ) : (
            <ul className="tag-picker-list">
              {tags.map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    className="tag-picker-item"
                    onClick={() => handlePick(t)}
                  >
                    #{t}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {editOpen && (
        <div
          className="tag-picker-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditOpen(false);
          }}
          role="presentation"
        >
          <div className="tag-picker-modal" role="dialog" aria-modal="true" aria-label="Edytuj listę tagów">
            <div className="tag-picker-modal-header">
              <span>Edytuj listę tagów</span>
              <button
                type="button"
                className="tag-picker-modal-close"
                onClick={() => setEditOpen(false)}
                aria-label="Zamknij"
              >
                <X size={16} />
              </button>
            </div>
            <div className="tag-picker-modal-add">
              <input
                type="text"
                className="tag-picker-modal-input"
                placeholder="Nowy tag (bez #)"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                maxLength={32}
              />
              <button
                type="button"
                className="tag-picker-modal-add-btn"
                onClick={handleAdd}
                disabled={!newTag.trim()}
              >
                <Plus size={14} /> Dodaj
              </button>
            </div>
            <ul className="tag-picker-modal-list">
              {tags.map((t) => (
                <li key={t} className="tag-picker-modal-item">
                  <span>#{t}</span>
                  <button
                    type="button"
                    className="tag-picker-modal-remove"
                    onClick={() => handleRemove(t)}
                    aria-label={`Usuń tag ${t}`}
                    title="Usuń"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
              {tags.length === 0 && (
                <li className="tag-picker-empty">Brak tagów. Dodaj pierwszy powyżej.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
