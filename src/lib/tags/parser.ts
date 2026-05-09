// Tagi extracted z dowolnego pola tekstowego (check-in/out/idea/note).

const TAG_REGEX = /#([a-ząęóśłżźćń0-9][a-ząęóśłżźćń0-9_-]{1,30})/giu;

/**
 * Wyciąga unique tagi (lowercase, bez `#`) z dowolnego stringa.
 * Filtr: pierwszy znak nie-numeryczny (żeby nie łapało `#1`, `#2026`).
 * Min length 2 znaki, max 30.
 */
export function extractTags(text: string | undefined | null): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of text.matchAll(TAG_REGEX)) {
    const raw = m[1].toLowerCase();
    if (/^\d+$/.test(raw)) continue; // tylko liczby — odrzuć (np. ID #123)
    if (seen.has(raw)) continue;
    seen.add(raw);
    out.push(raw);
  }
  return out;
}

/**
 * Wyciąga tagi z wielu pól tekstowych jednocześnie.
 * Używane np. dla check-in/out (firstAction + intentions + excitedAbout + ...).
 */
export function extractTagsMulti(...fields: (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  for (const f of fields) {
    for (const t of extractTags(f)) seen.add(t);
  }
  return [...seen];
}
