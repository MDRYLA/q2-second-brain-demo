"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("sb-theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sb-theme", next);
  }

  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Tryb jasny" : "Tryb ciemny";

  return (
    <button
      onClick={toggle}
      title={label}
      aria-label={theme === "dark" ? "Włącz tryb jasny" : "Włącz tryb ciemny"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "11px",
        opacity: 0.55,
        padding: "4px 8px",
        border: "1px solid currentColor",
        borderRadius: "6px",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        letterSpacing: "0.03em",
      }}
    >
      <Icon size={11} />
      {label}
    </button>
  );
}
