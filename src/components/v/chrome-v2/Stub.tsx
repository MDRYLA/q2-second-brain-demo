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
export function ChromeV2Stub({
  eyebrow,
  title,
  description,
  mainAppHref,
  mainAppLabel = "Otwórz pełną wersję w głównej apce",
}: Props) {
  return (
    <div style={{ maxWidth: 720 }}>
      <div className="cv2-eyebrow" style={{ marginBottom: 8 }}>
        {eyebrow}
      </div>
      <h1 className="cv2-page-title" style={{ marginBottom: 24 }}>
        {title}
      </h1>
      <div className="cv2-card" style={{ padding: 32 }}>
        <div className="cv2-body" style={{ marginBottom: 24, color: "var(--cv2-text-on-card)" }}>
          {description}
        </div>
        <div
          className="cv2-handwritten"
          style={{ marginBottom: 24, fontSize: 18, color: "var(--cv2-text-muted)" }}
        >
          ten ekran w designie wariantu — w trakcie budowy
        </div>
        <Link href={mainAppHref as Route} className="cv2-btn cv2-btn-primary">
          {mainAppLabel} →
        </Link>
      </div>
    </div>
  );
}
