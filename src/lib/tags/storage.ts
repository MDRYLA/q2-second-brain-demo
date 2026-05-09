// User tags list in localStorage (per device).

const KEY = "sb-user-tags";

const DEFAULTS = [
  "aha",
  "blocker",
  "czytanie",
  "deepwork",
  "energia-niska",
  "energia-wysoka",
  "family",
  "flow",
  "friend",
  "kreatywność",
  "praca",
  "rower",
  "siłownia",
  "stres",
];

function readRaw(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return null;
  }
}

function writeRaw(tags: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(tags));
  } catch {
    // ignore
  }
}

// Broadcast change to other TagPickers in the same tab.
// localStorage event does not fire in the tab that wrote — custom event supplements.
const TAGS_UPDATED_EVENT = "sb-tags-updated";
function broadcastTagsChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TAGS_UPDATED_EVENT));
}

export const TAGS_EVENT = TAGS_UPDATED_EVENT;

function normalize(tag: string): string {
  return tag.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
}

export function getUserTags(): string[] {
  const raw = readRaw();
  if (raw === null) {
    // first run — seed defaults
    writeRaw(DEFAULTS);
    return [...DEFAULTS];
  }
  return [...raw].sort((a, b) => a.localeCompare(b, "pl"));
}

export function addUserTag(tag: string): string[] {
  const norm = normalize(tag);
  if (!norm || norm.length < 2 || norm.length > 32) return getUserTags();
  const current = readRaw() ?? [...DEFAULTS];
  if (current.includes(norm)) return [...current].sort((a, b) => a.localeCompare(b, "pl"));
  const next = [...current, norm].sort((a, b) => a.localeCompare(b, "pl"));
  writeRaw(next);
  broadcastTagsChange();
  return next;
}

export function removeUserTag(tag: string): string[] {
  const norm = normalize(tag);
  const current = readRaw() ?? [...DEFAULTS];
  const next = current.filter((t) => t !== norm).sort((a, b) => a.localeCompare(b, "pl"));
  writeRaw(next);
  broadcastTagsChange();
  return next;
}

export function resetUserTags(): string[] {
  writeRaw(DEFAULTS);
  broadcastTagsChange();
  return [...DEFAULTS];
}
