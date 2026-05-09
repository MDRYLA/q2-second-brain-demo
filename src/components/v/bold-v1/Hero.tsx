"use client";

import Image from "next/image";
import type { ReactNode } from "react";

// zkałdkach tez uzywaj tych obrazkow". Reuse na check-in/out/plan-dzien/plan-tydzien.
// Dashboard używa inline JSX (zachowany — kompleks z pillami/handwriting).

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Faza 11 A1: opcjonalny — gdy brak, hero bez ikonki (ekrany "Inne" jak notatki/timeline/etc) */
  illuSrc?: string;
  illuAlt?: string;
  illuW?: number;
  illuH?: number;
  illuFilter?: string;
  children?: ReactNode;
};

export function BoldV1Hero({
  eyebrow,
  title,
  subtitle,
  illuSrc,
  illuAlt = "",
  illuW = 96,
  illuH = 160,
  illuFilter,
  children,
}: Props) {
  return (
    <section className="bv1-section bv1-hero-with-illu">
      <div>
        <div className="bv1-eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>
        <h1 className="bv1-hero-title">{title}</h1>
        {subtitle && (
          <p className="bv1-page-subtitle" style={{ marginTop: 12 }}>{subtitle}</p>
        )}
        {children}
      </div>
      {illuSrc && (
        <Image
          src={illuSrc}
          alt={illuAlt}
          width={illuW}
          height={illuH}
          priority
          unoptimized
          className="bv1-illu-img bv1-hero-illu"
          style={{ width: illuW, height: "auto", filter: illuFilter }}
        />
      )}
    </section>
  );
}
