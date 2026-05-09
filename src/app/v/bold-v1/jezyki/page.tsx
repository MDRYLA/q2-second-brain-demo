import { fetchLanguages, fetchVocabulary } from "@/lib/supabase/languages";
import { BoldV1JezykiClient } from "./JezykiClient";

export default async function BoldV1JezykiPage() {
  const languages = await fetchLanguages();
  const firstLangId = languages[0]?.id ?? null;
  const initialVocab = firstLangId ? await fetchVocabulary(firstLangId) : [];
  return (
    <BoldV1JezykiClient
      initialLanguages={languages}
      initialVocabulary={initialVocab}
      initialActiveLanguageId={firstLangId}
    />
  );
}
