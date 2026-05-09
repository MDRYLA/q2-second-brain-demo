"use client";

import { useSkin, type Skin } from "@/context/SkinContext";

interface Props {
  className?: string;
}

const LABEL: Record<Skin, string> = {
  default: "Default",
  "baby-blue": "Baby Blue",
};

export function SkinToggle({ className }: Props) {
  const { skin, setSkin } = useSkin();
  const otherSkin: Skin = skin === "default" ? "baby-blue" : "default";

  return (
    <div className={`v-skin-toggle ${className ?? ""}`} role="group" aria-label="Skin / paleta">
      <button
        type="button"
        className={`v-skin-pill ${skin === "default" ? "v-skin-active" : "v-skin-inactive"}`}
        onClick={() => setSkin("default")}
        aria-pressed={skin === "default"}
      >
        {LABEL.default}
      </button>
      <button
        type="button"
        className={`v-skin-pill ${skin === "baby-blue" ? "v-skin-active" : "v-skin-inactive"}`}
        onClick={() => setSkin("baby-blue")}
        aria-pressed={skin === "baby-blue"}
      >
        {LABEL["baby-blue"]}
      </button>
      <span className="sr-only">Aktualnie: {LABEL[skin]}, kliknij aby przełączyć na {LABEL[otherSkin]}</span>
    </div>
  );
}
