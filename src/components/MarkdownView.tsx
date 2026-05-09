"use client";

import ReactMarkdown from "react-markdown";
import { decrypt } from "@/lib/crypto/aes";

interface MarkdownViewProps {
  ciphertext: string | null;
  cryptoKey: Uint8Array;
  emptyMessage?: string;
  /** Raw markdown shown when ciphertext is null (e.g. first login pre-seed). */
  seedFallback?: string;
  /** Banner shown above content when seedFallback is rendered. */
  seedBanner?: string;
  className?: string;
}

export function MarkdownView({
  ciphertext,
  cryptoKey,
  emptyMessage = "Brak treści.",
  seedFallback,
  seedBanner,
  className,
}: MarkdownViewProps) {
  if (!ciphertext) {
    if (seedFallback && seedFallback.trim().length > 0) {
      return (
        <div className={`markdown-content${className ? ` ${className}` : ""}`}>
          {seedBanner && <p className="seed-banner">{seedBanner}</p>}
          <ReactMarkdown>{seedFallback}</ReactMarkdown>
        </div>
      );
    }
    return <p className="text-muted">{emptyMessage}</p>;
  }

  let content: string;
  try {
    content = decrypt(ciphertext, cryptoKey);
  } catch {
    return (
      <p className="text-muted">
        Błąd deszyfrowania — sprawdź hasło lub odśwież stronę.
      </p>
    );
  }

  return (
    <div className={`markdown-content${className ? ` ${className}` : ""}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
