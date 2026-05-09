// Pure functions używane w parseInitial CheckIn/CheckOut przy refactor pól
// 5-point Likert → 4-point + sentinel "Nie wiem", oraz proactivity 1-5 → 4 booleany,
// oraz aglutynacja whatWorked/whatFailed/whatDiscovered → eveningReview.
//
// Każdy helper jest pure i testowany w __tests__/legacy-migration.test.ts.

// 5-point mood/energy (check-in i check-out) → Likert4 + sentinel.
// Środkowe wartości ("średni", "neutralny") mapują na "unknown" — explicit anti-acquiescence
// zamiast sztucznego forcing na sąsiada (false precision). Wartości 4-point passthrough.
export const LEGACY_MOOD_MAP_IN: Record<string, string> = {
  "niski": "niski",
  "średnio-niski": "raczej niski",
  "średni": "unknown",
  "średnio-wysoki": "raczej wysoki",
  "wysoki": "wysoki",
  // Energy mapping (in)
  "niska": "niska",
  "średnio-niska": "raczej niska",
  "średnia": "unknown",
  "średnio-wysoka": "raczej wysoka",
  "wysoka": "wysoka",
};

export const LEGACY_MOOD_MAP_OUT: Record<string, string> = {
  // moodWord (out): zły / średnio zły / neutralny / średnio dobry / dobry
  "zły": "zły",
  "średnio zły": "raczej zły",
  "neutralny": "unknown",
  "średnio dobry": "raczej dobry",
  "dobry": "dobry",
  // energyEndWord: wyczerpany / zmęczony / neutralny / naładowany / pełen energii
  "wyczerpany": "wyczerpany",
  "zmęczony": "zmęczony",
  "naładowany": "naładowany",
  "pełen energii": "pełen energii",
};

// "częściowo" jest klasyczny midpoint click — mapuje na "unknown" anti-acquiescence.
export const LEGACY_ADHERENCE_MAP: Record<string, string> = {
  "brak": "brak",
  "głównie brak": "raczej brak",
  "częściowo": "unknown",
  "głównie zgodnie": "raczej zgodnie",
  "zgodnie": "zgodnie",
  "unknown": "unknown",
};

export const LEGACY_KNOWLEDGE_MAP: Record<string, string> = {
  "nie": "nie",
  "raczej nie": "raczej nie",
  "częściowo": "unknown",
  "raczej tak": "raczej tak",
  "tak": "tak",
};

// Generic apply helper. Brak wpisu w map → passthrough (np. już zmigrowane wartości).
export function applyLegacyMood(value: string, map: Record<string, string>): string {
  if (!value) return value;
  return map[value] ?? value;
}

// Proaktywność 1-5 (legacy) → 4 booleany + flag unknown.
// Heurystyka jest CELOWO ograniczona: liczy tylko ile zachowań ✓, NIE które.
// Wybór: zacząłem zanim mnie zmuszono (startedFirst) + wziąłem odpowiedzialność (ownedMistake)
// jako "core" — najczęstsze proactivity behaviors per Frese Personal Initiative Scale.
export interface ProactiveBooleans {
  startedFirst: boolean;
  saidNo: boolean;
  changedPlan: boolean;
  ownedMistake: boolean;
  unknown: boolean;
}

export function mapLegacyProactivity(p: number | undefined): ProactiveBooleans {
  const empty: ProactiveBooleans = {
    startedFirst: false,
    saidNo: false,
    changedPlan: false,
    ownedMistake: false,
    unknown: false,
  };
  if (p === undefined || p === 0) return empty;
  if (p === -1) return { ...empty, unknown: true };
  if (p >= 4) {
    return { startedFirst: true, saidNo: true, changedPlan: true, ownedMistake: true, unknown: false };
  }
  if (p === 3) {
    return { startedFirst: true, saidNo: false, changedPlan: false, ownedMistake: true, unknown: false };
  }
  return empty; // p ≤ 2 → 0 ✓
}

// Aglutynacja: whatWorked + whatFailed + whatDiscovered → eveningReview (textarea)
// + 3 mini-tagi (true gdy źródłowe pole nie-puste). Wynik łączy 3 sekcje labelami.
export interface EveningMerge {
  review: string;
  worked: boolean;
  failed: boolean;
  discovered: boolean;
}

export function mergeLegacyEvening(
  worked?: string,
  failed?: string,
  discovered?: string,
): EveningMerge {
  const w = (worked ?? "").trim();
  const f = (failed ?? "").trim();
  const d = (discovered ?? "").trim();
  const parts: string[] = [];
  if (w) parts.push(`Co zadziałało: ${w}`);
  if (f) parts.push(`Co nie wyszło: ${f}`);
  if (d) parts.push(`Odkryłem: ${d}`);
  return {
    review: parts.join("\n\n"),
    worked: w.length > 0,
    failed: f.length > 0,
    discovered: d.length > 0,
  };
}
