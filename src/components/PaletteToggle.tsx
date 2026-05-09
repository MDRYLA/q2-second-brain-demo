"use client";

import { useEffect } from "react";

// Komponent renderuje NIC, ale jednorazowo czyści zalegające localStorage z poprzednich sesji.
export default function PaletteToggle() {
  useEffect(() => {
    document.documentElement.setAttribute("data-palette", "ziemia");
    try {
      const stored = localStorage.getItem("sb-palette");
      if (stored && stored !== "ziemia") {
        localStorage.removeItem("sb-palette");
      }
    } catch {
      // ignore
    }
  }, []);
  return null;
}
