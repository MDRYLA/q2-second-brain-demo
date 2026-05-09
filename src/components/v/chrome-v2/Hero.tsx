"use client";

import type { ReactNode } from "react";

// cv2 ekranów oprócz dashboard. Cv2 = Apple Vision minimal sygnatura — BEZ obrazków
// Cormorant italic subtitle.

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function ChromeV2Hero({ eyebrow, title, subtitle, children }: Props) {
  return (
    <header className="cv2-screen-header">
      <p className="cv2-header-eyebrow">{eyebrow}</p>
      <h1 className="cv2-header-title">{title}</h1>
      {subtitle && <p className="cv2-header-subtitle">{subtitle}</p>}
      {children}
    </header>
  );
}
