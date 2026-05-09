"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface CryptoKeyContextValue {
  key: Uint8Array | null;
  setKey: (key: Uint8Array) => void;
  clearKey: () => void;
}

const CryptoKeyContext = createContext<CryptoKeyContextValue>({
  key: null,
  setKey: () => {},
  clearKey: () => {},
});

export function CryptoKeyProvider({ children }: { children: ReactNode }) {
  const [key, setKeyState] = useState<Uint8Array | null>(null);

  return (
    <CryptoKeyContext.Provider
      value={{
        key,
        setKey: (k: Uint8Array) => setKeyState(k),
        clearKey: () => setKeyState(null),
      }}
    >
      {children}
    </CryptoKeyContext.Provider>
  );
}

export function useCryptoKey() {
  return useContext(CryptoKeyContext);
}
