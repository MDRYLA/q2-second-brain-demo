"use client";

import type { ReactNode } from "react";
import { useSkin } from "@/context/SkinContext";

interface Props {
  children: ReactNode;
  fontVariables: string;
}

export function BoldV1Wrapper({ children, fontVariables }: Props) {
  const { skin } = useSkin();
  return (
    <div className={`v-bold-v1 ${fontVariables}`} data-skin={skin} suppressHydrationWarning>
      {children}
    </div>
  );
}
