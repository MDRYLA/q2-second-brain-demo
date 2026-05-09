// Biblioteka cwiczen dla /silownia — 30 popularnych (10 push / 10 pull / 10 legs).
// Plus kategorie 'core' i 'cardio' dla custom sesji.

export type ExerciseGroup = "push" | "pull" | "legs" | "core" | "cardio";

export interface ExerciseTemplate {
  id: string;       // 'bench-press'
  name: string;     // 'Bench Press'
  group: ExerciseGroup;
  primary: string;  // 'Klatka piersiowa' (opis partii)
}

export const EXERCISES: ExerciseTemplate[] = [
  // PUSH (10)
  { id: "bench-press",      name: "Bench Press",                group: "push", primary: "Klatka" },
  { id: "incline-bench",    name: "Incline Bench Press",        group: "push", primary: "Klatka gora" },
  { id: "ohp",              name: "Overhead Press",             group: "push", primary: "Barki" },
  { id: "dips",             name: "Dipsy",                      group: "push", primary: "Klatka/Tricep" },
  { id: "tricep-pushdown",  name: "Pushdown na tricepsa",       group: "push", primary: "Tricep" },
  { id: "lateral-raise",    name: "Lateral Raise",              group: "push", primary: "Barki bok" },
  { id: "cable-fly",        name: "Cable Fly",                  group: "push", primary: "Klatka" },
  { id: "pushup",           name: "Pompki",                     group: "push", primary: "Klatka" },
  { id: "french-press",     name: "French Press (Skullcrusher)", group: "push", primary: "Tricep" },
  { id: "pec-deck",         name: "Pec Deck",                   group: "push", primary: "Klatka" },

  // PULL (10)
  { id: "deadlift",         name: "Martwy Ciag",                group: "pull", primary: "Plecy/Nogi" },
  { id: "pullup",           name: "Podciagnacia",               group: "pull", primary: "Plecy" },
  { id: "barbell-row",      name: "Wioslowanie sztanga",        group: "pull", primary: "Plecy" },
  { id: "lat-pulldown",     name: "Sciaganie wyciagu gornego",  group: "pull", primary: "Plecy" },
  { id: "bicep-curl",       name: "Uginanie ramion (sztanga)",  group: "pull", primary: "Bicep" },
  { id: "face-pull",        name: "Face Pull",                  group: "pull", primary: "Tylne barki" },
  { id: "hammer-curl",      name: "Hammer Curl",                group: "pull", primary: "Bicep" },
  { id: "cable-row",        name: "Wioslowanie wyciagu",        group: "pull", primary: "Plecy" },
  { id: "t-bar-row",        name: "T-Bar Row",                  group: "pull", primary: "Plecy" },
  { id: "shrug",            name: "Wzruszenia (shrugs)",        group: "pull", primary: "Trapez" },

  // LEGS (10)
  { id: "squat",            name: "Przysiad ze sztanga",        group: "legs", primary: "Nogi" },
  { id: "rdl",              name: "Romanian Deadlift",          group: "legs", primary: "Tylne uda" },
  { id: "leg-press",        name: "Wyciskanie nogami",          group: "legs", primary: "Nogi" },
  { id: "leg-curl",         name: "Uginanie nog (lezac)",       group: "legs", primary: "Tylne uda" },
  { id: "leg-extension",    name: "Prostowanie nog",            group: "legs", primary: "Czworoglowy" },
  { id: "calf-raise",       name: "Wspiecia na palce",          group: "legs", primary: "Lydki" },
  { id: "lunge",            name: "Wykroki",                    group: "legs", primary: "Nogi" },
  { id: "hip-thrust",       name: "Hip Thrust",                 group: "legs", primary: "Posladki" },
  { id: "bulgarian-split",  name: "Bulgarski przysiad",         group: "legs", primary: "Nogi" },
  { id: "goblet-squat",     name: "Goblet Squat",               group: "legs", primary: "Nogi" },

  // CORE (4)
  { id: "plank",            name: "Plank (deska)",              group: "core", primary: "Brzuch" },
  { id: "ab-wheel",         name: "Rolka ab",                   group: "core", primary: "Brzuch" },
  { id: "hanging-leg-raise", name: "Unoszenie nog (zwis)",      group: "core", primary: "Brzuch dol" },
  { id: "russian-twist",    name: "Russian Twist",              group: "core", primary: "Skosne" },

  // CARDIO (3)
  { id: "rowing",           name: "Wioslarz",                   group: "cardio", primary: "Cardio" },
  { id: "bike",             name: "Rower stacjonarny",          group: "cardio", primary: "Cardio" },
  { id: "treadmill",        name: "Biezna",                     group: "cardio", primary: "Cardio" },
];

export function exercisesByGroup(group: ExerciseGroup): ExerciseTemplate[] {
  return EXERCISES.filter((e) => e.group === group);
}

export function findExerciseById(id: string): ExerciseTemplate | undefined {
  return EXERCISES.find((e) => e.id === id);
}

