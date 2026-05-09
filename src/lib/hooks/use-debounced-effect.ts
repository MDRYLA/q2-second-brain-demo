"use client";

import { useEffect, useRef } from "react";

/**
 * Run effect po `delay` ms ciszy (debounce). Reset timer gdy deps się zmienią.
 *
 * Auto-save use case (sesja 14):
 *   useDebouncedEffect(() => { void persist(form); }, 800, [form]);
 *
 * Cleanup uruchamiany jak każdy useEffect — przed nowym wywołaniem effect-u
 * lub przy unmount. Force flush przy unmount NIE jest wbudowany — komponent
 * musi sam wywołać save jeśli chce final flush (np. via onbeforeunload).
 */
export function useDebouncedEffect(
  effect: () => void,
  delay: number,
  deps: React.DependencyList
): void {
  const ref = useRef<number | null>(null);
  useEffect(() => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current);
    }
    ref.current = window.setTimeout(() => {
      effect();
      ref.current = null;
    }, delay);
    return () => {
      if (ref.current !== null) {
        window.clearTimeout(ref.current);
        ref.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
