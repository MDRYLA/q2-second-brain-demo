"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Skin = "default" | "baby-blue";

interface SkinContextValue {
  skin: Skin;
  setSkin: (skin: Skin) => void;
}

const SkinContext = createContext<SkinContextValue>({
  skin: "default",
  setSkin: () => {},
});

const STORAGE_KEY = "sb-skin-v1";

export function SkinProvider({ children }: { children: ReactNode }) {
  const [skin, setSkinState] = useState<Skin>("default");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "baby-blue" || stored === "default") {
        setSkinState(stored);
      }
    } catch {
      // ignore — SSR/private mode
    }
  }, []);

  const setSkin = (next: Skin) => {
    setSkinState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    // Cross-tab sync via custom event
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sb-skin-changed", { detail: next }));
    }
  };

  // Listen for cross-component changes (toggle in other panel updates DOM)
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<Skin>;
      if (ev.detail === "baby-blue" || ev.detail === "default") {
        setSkinState(ev.detail);
      }
    };
    window.addEventListener("sb-skin-changed", handler);
    return () => window.removeEventListener("sb-skin-changed", handler);
  }, []);

  return <SkinContext.Provider value={{ skin, setSkin }}>{children}</SkinContext.Provider>;
}

export function useSkin(): SkinContextValue {
  return useContext(SkinContext);
}
