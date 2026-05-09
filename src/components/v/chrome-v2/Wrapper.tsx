"use client";

import type { ReactNode } from "react";
import { useSkin } from "@/context/SkinContext";

interface Props {
  children: ReactNode;
  fontVariables?: string;
}

export function ChromeV2Wrapper({ children, fontVariables = "" }: Props) {
  const { skin } = useSkin();
  return (
    <div className={`v-chrome-v2 ${fontVariables}`.trim()} data-skin={skin} suppressHydrationWarning>
      {children}
    </div>
  );
}
