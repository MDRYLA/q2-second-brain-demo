import { fetchLanguages, fetchVocabulary } from "@/lib/supabase/languages";
import { ChromeV2JezykiClient } from "./JezykiClient";

export default async function ChromeV2JezykiPage() {
  const languages = await fetchLanguages();
  const firstLangId = languages[0]?.id ?? null;
  const initialVocab = firstLangId ? await fetchVocabulary(firstLangId) : [];
  return (
    <ChromeV2JezykiClient
      initialLanguages={languages}
      initialVocabulary={initialVocab}
      initialActiveLanguageId={firstLangId}
    />
  );
}
