"use client";

import { useState } from "react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { MarkdownView } from "@/components/MarkdownView";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { ChromeV2PassphraseGate } from "@/components/v/chrome-v2/PassphraseGate";
import { ChromeV2Hero } from "@/components/v/chrome-v2/Hero";
import { saveSnapshotCiphertext } from "@/lib/supabase/snapshots";
import { encrypt, decrypt } from "@/lib/crypto/aes";

interface Props {
  initialCiphertext: string | null;
  seedContent: string;
}

function KonstytucjaContent({ initialCiphertext, seedContent }: Props) {
  const { key } = useCryptoKey();
  const [ciphertext, setCiphertext] = useState(initialCiphertext);
  const [editing, setEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saveError, setSaveError] = useState("");

  if (!key) return null;

  const handleEditClick = () => {
    setShowModal(true);
  };

  const handleSave = async (markdown: string) => {
    const newCiphertext = encrypt(markdown, key);
    const result = await saveSnapshotCiphertext("konstytucja", newCiphertext);
    if (result.error) throw new Error(result.error);
    setCiphertext(newCiphertext);
    setEditing(false);
    setSaveError("");
  };

  let decryptedInitial = "";
  if (ciphertext && key) {
    try {
      decryptedInitial = decrypt(ciphertext, key);
    } catch {
      decryptedInitial = "";
    }
  }

  // Pre-fill editor with seed when no snapshot exists yet
  const editorInitial = decryptedInitial || (ciphertext ? "" : seedContent);
  const usingSeed = !ciphertext && seedContent.trim().length > 0;

  return (
    <div className="cv2-form-screen">
      <ChromeV2Hero
        eyebrow="Twoje wartości"
        title="Konstytucja"
        subtitle="Role · Wartości · Zasady życia"
      >
        {!editing && (
          <div style={{ marginTop: 16 }}>
            <button className="btn-edit" onClick={handleEditClick}>
              {usingSeed ? "Edytuj (zapisz swoją)" : "Edytuj"}
            </button>
          </div>
        )}
      </ChromeV2Hero>

      {saveError && <p className="login-error">{saveError}</p>}

      {editing ? (
        <div style={{ marginTop: 24 }}>
          <MarkdownEditor
            initialMarkdown={editorInitial}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            placeholder="Napisz swoją Konstytucję w Markdown…"
          />
        </div>
      ) : (
        <div style={{ marginTop: 24 }}>
          <MarkdownView
            ciphertext={ciphertext}
            cryptoKey={key}
            seedFallback={seedContent}
            seedBanner="Treść wczytana z seed (Konstytucja v3). Kliknij Edytuj aby zapisać własną wersję — od tego momentu treść będzie szyfrowana w bazie."
            emptyMessage="Konstytucja jest pusta. Kliknij Edytuj, aby ją napisać."
          />
        </div>
      )}

      {/* Modal — guardrail #6: Konstytucja jest święta */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <h2 id="modal-title" className="modal-title">
              Konstytucja jest święta
            </h2>
            <p className="modal-body">
              Zmiany w Konstytucji powinny być przemyślane i podejmowane{" "}
              <strong>wyłącznie w niedzielnym przeglądzie tygodniowym</strong> lub
              kwartalnym resecie — nie w impulsie chwili.
            </p>
            <p className="modal-body" style={{ marginTop: 8 }}>
              Jeśli masz przemyślaną zmianę — kontynuuj. Jeśli to impuls po
              trudnym dniu — wróć jutro.
            </p>
            <div className="modal-actions">
              <button
                className="md-btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Anuluj
              </button>
              <button
                className="btn-edit"
                onClick={() => {
                  setShowModal(false);
                  setEditing(true);
                }}
              >
                Rozumiem — edytuj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChromeV2KonstytucjaClient({ initialCiphertext, seedContent }: Props) {
  return (
    <ChromeV2PassphraseGate>
      <KonstytucjaContent
        initialCiphertext={initialCiphertext}
        seedContent={seedContent}
      />
    </ChromeV2PassphraseGate>
  );
}
