
export type LanguageLevel = "A0" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LanguageData {
  name: string;             // "English", "Español"
  currentLevel: LanguageLevel;
  targetLevel: LanguageLevel;
  dailyMinutesTarget: number; // domyślnie 5
}

export interface VocabularyData {
  word: string;
  definition: string;
  example?: string;          // przykładowe zdanie z kontekstu
  source?: string;           // URL artykułu / nazwa newsletter / podcast
  pronunciation?: string;    // IPA lub fonetyczny zapis
}

export const LANGUAGE_LEVELS: LanguageLevel[] = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
