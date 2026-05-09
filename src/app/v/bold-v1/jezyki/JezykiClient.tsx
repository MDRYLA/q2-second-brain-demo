"use client";

import { useState } from "react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { BoldV1PassphraseGate } from "@/components/v/bold-v1/PassphraseGate";
import { BoldV1Hero } from "@/components/v/bold-v1/Hero";
import { encrypt, decrypt } from "@/lib/crypto/aes";
import {
  createLanguage,
  createVocabulary,
  deleteVocabulary,
  fetchVocabulary,
  type LanguageRow,
  type VocabularyRow,
} from "@/lib/supabase/languages";
import {
  LANGUAGE_LEVELS,
  type LanguageData,
  type LanguageLevel,
  type VocabularyData,
} from "@/lib/types/language";

interface Props {
  initialLanguages: LanguageRow[];
  initialVocabulary: VocabularyRow[];
  initialActiveLanguageId: string | null;
}

interface DecryptedLanguage extends LanguageRow, LanguageData {}

export function BoldV1JezykiClient(props: Props) {
  return (
    <BoldV1PassphraseGate>
      <JezykiInner {...props} />
    </BoldV1PassphraseGate>
  );
}

function JezykiInner({ initialLanguages, initialVocabulary, initialActiveLanguageId }: Props) {
  const { key } = useCryptoKey();
  const [languages, setLanguages] = useState<LanguageRow[]>(initialLanguages);
  const [activeLangId, setActiveLangId] = useState<string | null>(initialActiveLanguageId);
  const [vocabulary, setVocabulary] = useState<VocabularyRow[]>(initialVocabulary);
  const [error, setError] = useState("");
  const [showAddLang, setShowAddLang] = useState(initialLanguages.length === 0);

  // Add language form state
  const [newLangCode, setNewLangCode] = useState("en");
  const [newLangName, setNewLangName] = useState("English");
  const [newLangCurrent, setNewLangCurrent] = useState<LanguageLevel>("B1");
  const [newLangTarget, setNewLangTarget] = useState<LanguageLevel>("B2");

  // Add vocabulary form state
  const [newWord, setNewWord] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newSource, setNewSource] = useState("");

  if (!key) return null;

  const decryptLang = (row: LanguageRow): DecryptedLanguage => {
    try {
      const data = JSON.parse(decrypt(row.ciphertext, key)) as Partial<LanguageData>;
      return {
        ...row,
        name: data.name ?? row.code.toUpperCase(),
        currentLevel: data.currentLevel ?? "A0",
        targetLevel: data.targetLevel ?? "A1",
        dailyMinutesTarget: data.dailyMinutesTarget ?? 5,
      };
    } catch {
      return {
        ...row,
        name: row.code.toUpperCase(),
        currentLevel: "A0",
        targetLevel: "A1",
        dailyMinutesTarget: 5,
      };
    }
  };

  const decryptVocab = (row: VocabularyRow): VocabularyRow & VocabularyData => {
    try {
      const data = JSON.parse(decrypt(row.ciphertext, key)) as Partial<VocabularyData>;
      return {
        ...row,
        word: data.word ?? "",
        definition: data.definition ?? "",
        example: data.example,
        source: data.source,
        pronunciation: data.pronunciation,
      };
    } catch {
      return { ...row, word: "[błąd dekrypcji]", definition: "" };
    }
  };

  const handleAddLanguage = async () => {
    setError("");
    if (!newLangCode.trim() || !newLangName.trim()) {
      setError("Kod i nazwa są wymagane.");
      return;
    }
    const data: LanguageData = {
      name: newLangName.trim(),
      currentLevel: newLangCurrent,
      targetLevel: newLangTarget,
      dailyMinutesTarget: 5,
    };
    const ciphertext = encrypt(JSON.stringify(data), key);
    const { id, error: err } = await createLanguage(newLangCode.trim().toLowerCase(), ciphertext);
    if (err || !id) {
      setError(err ?? "Błąd dodawania języka.");
      return;
    }
    const newRow: LanguageRow = {
      id,
      code: newLangCode.trim().toLowerCase(),
      ciphertext,
      created_at: new Date().toISOString(),
    };
    setLanguages((prev) => [...prev, newRow]);
    setActiveLangId(id);
    setVocabulary([]);
    setShowAddLang(false);
  };

  const handleAddVocabulary = async () => {
    setError("");
    if (!activeLangId) {
      setError("Wybierz język.");
      return;
    }
    if (!newWord.trim() || !newDefinition.trim()) {
      setError("Słowo i definicja są wymagane.");
      return;
    }
    const data: VocabularyData = {
      word: newWord.trim(),
      definition: newDefinition.trim(),
      example: newExample.trim() || undefined,
      source: newSource.trim() || undefined,
    };
    const ciphertext = encrypt(JSON.stringify(data), key);
    const { id, error: err } = await createVocabulary(activeLangId, ciphertext);
    if (err || !id) {
      setError(err ?? "Błąd dodawania słowa.");
      return;
    }
    const newRow: VocabularyRow = {
      id,
      language_id: activeLangId,
      ciphertext,
      fsrs_difficulty: 0,
      fsrs_stability: 0,
      fsrs_retrievability: 1,
      next_review_at: new Date().toISOString(),
      reps: 0,
      lapses: 0,
      state: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setVocabulary((prev) => [newRow, ...prev]);
    // Clear form, keep source (often same article)
    setNewWord("");
    setNewDefinition("");
    setNewExample("");
  };

  const handleDeleteVocab = async (id: string) => {
    const { error: err } = await deleteVocabulary(id);
    if (err) {
      setError(err);
      return;
    }
    setVocabulary((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSwitchLanguage = async (langId: string) => {
    setActiveLangId(langId);
    const fresh = await fetchVocabulary(langId);
    setVocabulary(fresh);
  };

  const decryptedLanguages = languages.map(decryptLang);
  const activeLang = decryptedLanguages.find((l) => l.id === activeLangId);
  const decryptedVocab = vocabulary.map(decryptVocab);

  return (
    <div className="bv1-form-screen">
      <BoldV1Hero
        eyebrow="Nauka"
        title="Języki."
        subtitle="5 minut dziennie. Słowo → definicja → przykład z kontekstu. (W1 MVP)"
      />

      {error && <p className="login-error" style={{ marginBottom: 12 }}>{error}</p>}

      {/* Language tabs / add */}
      <section className="bv1-form-section">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {decryptedLanguages.map((lang) => (
            <button
              key={lang.id}
              type="button"
              className={`btn-edit${lang.id === activeLangId ? " active" : ""}`}
              onClick={() => handleSwitchLanguage(lang.id)}
            >
              {lang.name} ({lang.currentLevel} → {lang.targetLevel})
            </button>
          ))}
          {!showAddLang && (
            <button type="button" className="btn-edit" onClick={() => setShowAddLang(true)}>
              + Dodaj język
            </button>
          )}
        </div>

        {showAddLang && (
          <div className="bv1-form-section" style={{ marginTop: 12 }}>
            <h3 className="bv1-form-section-title">Nowy język</h3>
            <div className="ci-row" style={{ flexWrap: "wrap", gap: 8 }}>
              <input
                type="text"
                className="ci-input ci-input-sm"
                placeholder="Kod (en/es/de…)"
                maxLength={5}
                value={newLangCode}
                onChange={(e) => setNewLangCode(e.target.value)}
              />
              <input
                type="text"
                className="ci-input"
                placeholder="Nazwa (English, Español…)"
                maxLength={50}
                value={newLangName}
                onChange={(e) => setNewLangName(e.target.value)}
              />
              <select
                className="ci-input ci-input-sm"
                value={newLangCurrent}
                onChange={(e) => setNewLangCurrent(e.target.value as LanguageLevel)}
                aria-label="Poziom obecny"
              >
                {LANGUAGE_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <span className="text-muted">→</span>
              <select
                className="ci-input ci-input-sm"
                value={newLangTarget}
                onChange={(e) => setNewLangTarget(e.target.value as LanguageLevel)}
                aria-label="Poziom docelowy"
              >
                {LANGUAGE_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <button type="button" className="btn-edit" onClick={handleAddLanguage}>
                Dodaj
              </button>
              {languages.length > 0 && (
                <button type="button" className="login-link-btn" onClick={() => setShowAddLang(false)}>
                  Anuluj
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Add vocabulary form */}
      {activeLang && (
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">Nowe słowo — {activeLang.name}</h2>
          <p className="text-muted ci-section-hint">
            Zassane z artykułu/podcastu. Definicja własnymi słowami {">"} kopia z translatora.
          </p>
          <div className="ci-field" style={{ marginTop: 8 }}>
            <label className="ci-field-label" htmlFor="vocab-word">Słowo / fraza</label>
            <input
              id="vocab-word"
              type="text"
              className="ci-input ci-input-wide"
              maxLength={120}
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddVocabulary();
              }}
            />
          </div>
          <div className="ci-field" style={{ marginTop: 8 }}>
            <label className="ci-field-label" htmlFor="vocab-definition">Definicja</label>
            <textarea
              id="vocab-definition"
              className="ci-textarea ci-textarea-sm"
              maxLength={400}
              value={newDefinition}
              onChange={(e) => setNewDefinition(e.target.value)}
            />
          </div>
          <div className="ci-field" style={{ marginTop: 8 }}>
            <label className="ci-field-label" htmlFor="vocab-example">Przykład (opcjonalne)</label>
            <textarea
              id="vocab-example"
              className="ci-textarea ci-textarea-sm"
              maxLength={400}
              value={newExample}
              onChange={(e) => setNewExample(e.target.value)}
            />
          </div>
          <div className="ci-field" style={{ marginTop: 8 }}>
            <label className="ci-field-label" htmlFor="vocab-source">Źródło (URL/nazwa, opcjonalne)</label>
            <input
              id="vocab-source"
              type="text"
              className="ci-input ci-input-wide"
              maxLength={300}
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
            />
          </div>
          <div className="ci-actions" style={{ marginTop: 12 }}>
            <button type="button" className="btn-edit" onClick={handleAddVocabulary}>
              Dodaj słowo (Cmd/Ctrl+Enter)
            </button>
          </div>
        </section>
      )}

      {/* Vocabulary vault */}
      {activeLang && decryptedVocab.length > 0 && (
        <section className="bv1-form-section">
          <h2 className="bv1-form-section-title">
            Vault — {decryptedVocab.length} słów
          </h2>
          <ul className="plan-bullets" style={{ marginTop: 8 }}>
            {decryptedVocab.map((v) => (
              <li key={v.id} className="plan-bullet-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{v.word}</div>
                  <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
                    {v.definition}
                  </div>
                  {v.example && (
                    <div className="text-muted" style={{ fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
                      „{v.example}”
                    </div>
                  )}
                  {v.source && (
                    <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                      źródło: {v.source}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="plan-bullet-remove"
                  onClick={() => handleDeleteVocab(v.id)}
                  aria-label={`Usuń ${v.word}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeLang && decryptedVocab.length === 0 && (
        <p className="text-muted" style={{ marginTop: 16, fontStyle: "italic" }}>
          Vault pusty — dodaj pierwsze słowo wyżej.
        </p>
      )}
    </div>
  );
}
