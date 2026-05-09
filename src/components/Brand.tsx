"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface BrandProps {
  size?: number;
  showName?: boolean;
}

/**
 * Brand component — logo Second Brain (auto-switch white/green per dark mode)
 * + "Second Brain" tekst Cormorant pod.
 *
 * Logo files in /public/:
 * - second-brain-logo.png (zielony — light mode)
 * - second-brain-logo-cream.png (kremowy — dark mode, dodany przez Kacpra 2026-04-27)
 *
 * Watches data-theme attribute on <html> via MutationObserver.
 */
export function Brand({ size = 36, showName = true }: BrandProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const t = root.getAttribute("data-theme");
      setTheme(t === "dark" ? "dark" : "light");
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const src =
    theme === "dark"
      ? "/second-brain-logo-cream.png"
      : "/second-brain-logo.png";

  return (
    <div className="brand">
      <Image
        src={src}
        alt="Q2"
        width={size}
        height={size}
        priority
        unoptimized
        style={{ width: "100%", maxWidth: size, height: "auto" }}
      />
      {showName && <span className="brand-name">Q2</span>}
    </div>
  );
}
