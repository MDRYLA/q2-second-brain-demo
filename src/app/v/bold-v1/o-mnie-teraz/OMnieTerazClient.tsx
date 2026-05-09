"use client";

import { useState } from "react";
import { useCryptoKey } from "@/context/CryptoKeyContext";
import { MarkdownView } from "@/components/MarkdownView";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { BoldV1PassphraseGate } from "@/components/v/bold-v1/PassphraseGate";
import { BoldV1Hero } from "@/components/v/bold-v1/Hero";
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
    <div className="bv1-form-screen">
      <BoldV1Hero
        eyebrow="Kwartalny snapshot"
        title="O mnie teraz."
        subtitle="Kim jesteś w tym momencie życia · Aktualizuj kwartalnie"
      >
        {!editing && (
          <div style={{ marginTop: 16 }}>
            <button className="btn-edit" onClick={() => setEditing(true)}>
              {usingSeed ? "Edytuj (zapisz swoją)" : "Edytuj"}
            </button>
          </div>
        )}
      </BoldV1Hero>

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

export function BoldV1OMnieTerazClient({ initialCiphertext, seedContent }: Props) {
  return (
    <BoldV1PassphraseGate>
      <OMnieTerazContent
        initialCiphertext={initialCiphertext}
        seedContent={seedContent}
      />
    </BoldV1PassphraseGate>
  );
}
