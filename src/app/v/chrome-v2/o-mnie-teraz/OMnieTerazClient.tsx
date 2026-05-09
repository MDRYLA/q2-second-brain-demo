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

function OMnieTerazContent({ initialCiphertext, seedContent }: Props) {
  const { key } = useCryptoKey();
  const [ciphertext, setCiphertext] = useState(initialCiphertext);
  const [editing, setEditing] = useState(false);

  if (!key) return null;

  const handleSave = async (markdown: string) => {
    const newCiphertext = encrypt(markdown, key);
    const result = await saveSnapshotCiphertext("o_mnie_teraz", newCiphertext);
    if (result.error) throw new Error(result.error);
    setCiphertext(newCiphertext);
    setEditing(false);
  };

  let decryptedInitial = "";
  if (ciphertext && key) {
    try {
      decryptedInitial = decrypt(ciphertext, key);
    } catch {
      decryptedInitial = "";
    }
  }

  const editorInitial = decryptedInitial || (ciphertext ? "" : seedContent);
  const usingSeed = !ciphertext && seedContent.trim().length > 0;

  return (
    <div className="cv2-form-screen">
      <ChromeV2Hero
        eyebrow="Kwartalny snapshot"
        title="O mnie teraz"
        subtitle="Kim jesteś w tym momencie życia · Aktualizuj kwartalnie"
      >
        {!editing && (
          <div style={{ marginTop: 16 }}>
            <button className="btn-edit" onClick={() => setEditing(true)}>
              {usingSeed ? "Edytuj (zapisz swoją)" : "Edytuj"}
            </button>
          </div>
        )}
      </ChromeV2Hero>

      <div style={{ marginTop: 24 }}>
        {editing ? (
          <MarkdownEditor
            initialMarkdown={editorInitial}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            placeholder="Opisz siebie — status zawodowy, relacje, cele, kontekst życiowy…"
          />
        ) : (
          <MarkdownView
            ciphertext={ciphertext}
            cryptoKey={key}
            seedFallback={seedContent}
            seedBanner="Treść wczytana z seed (snapshot kwartalny). Kliknij Edytuj aby zapisać własną wersję — od tego momentu treść będzie szyfrowana w bazie."
            emptyMessage="Sekcja pusta. Kliknij Edytuj, aby opisać siebie."
          />
        )}
      </div>
    </div>
  );
}

export function ChromeV2OMnieTerazClient({ initialCiphertext, seedContent }: Props) {
  return (
    <ChromeV2PassphraseGate>
      <OMnieTerazContent
        initialCiphertext={initialCiphertext}
        seedContent={seedContent}
      />
    </ChromeV2PassphraseGate>
  );
}
