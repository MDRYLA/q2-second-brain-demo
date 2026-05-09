"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { IconChoiceMap, ModuleSlug } from "@/lib/icons/registry";

const STORAGE_KEY = "sb-icon-choices";

interface IconsContextValue {
  choices: IconChoiceMap;
  setChoice: (slug: ModuleSlug, optionId: string) => void;
  resetAll: () => void;
}

const IconsContext = createContext<IconsContextValue>({
  choices: {},
  setChoice: () => {},
  resetAll: () => {},
});

export function IconsProvider({ children }: { children: ReactNode }) {
  const [choices, setChoices] = useState<IconChoiceMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as IconChoiceMap;
        setChoices(parsed);
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const setChoice = (slug: ModuleSlug, optionId: string) => {
    setChoices((prev) => {
      const next = { ...prev, [slug]: optionId };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const resetAll = () => {
    setChoices({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Avoid SSR/CSR mismatch — only render real choices after hydration
  return (
    <IconsContext.Provider value={{ choices: hydrated ? choices : {}, setChoice, resetAll }}>
      {children}
    </IconsContext.Provider>
  );
}

export function useIconChoices() {
  return useContext(IconsContext);
}
