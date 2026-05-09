import Link from "next/link";
import type { Route } from "next";

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  mainAppHref: string;
  mainAppLabel?: string;
}

/**
 * Stub w stylu Bold v1 — używany dla TIER 3 ekranów (rzadko używanych) podczas testów wariantów.
 * Każdy stub ma layout wariantu + link do pełnej wersji w głównej apce `/`.
 */
export function BoldV1Stub({
  eyebrow,
  title,
  description,
  mainAppHref,
  mainAppLabel = "Otwórz pełną wersję w głównej apce",
}: Props) {
  return (
    <div style={{ maxWidth: 720 }}>
      <div className="bv1-eyebrow" style={{ marginBottom: 8 }}>
        {eyebrow}
      </div>
      <h1 className="bv1-page-title" style={{ marginBottom: 24 }}>
        {title}
      </h1>
      <div className="bv1-card" style={{ padding: 32 }}>
        <div className="bv1-body" style={{ marginBottom: 24, color: "var(--bv1-text-on-card)" }}>
          {description}
        </div>
        <div
          className="bv1-handwritten"
          style={{ marginBottom: 24, fontSize: 18, color: "var(--bv1-text-muted)" }}
        >
          ten ekran w designie wariantu — w trakcie budowy
        </div>
        <Link href={mainAppHref as Route} className="bv1-btn bv1-btn-primary">
          {mainAppLabel} →
        </Link>
      </div>
    </div>
  );
}
