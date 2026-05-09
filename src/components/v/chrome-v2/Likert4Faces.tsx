"use client";

import * as React from "react";
import { Smile, Meh, Frown, HelpCircle } from "lucide-react";

export type Likert4Value = "low" | "rather-low" | "rather-high" | "high" | "unknown";

export interface Likert4Labels {
  low: string;
  ratherLow: string;
  ratherHigh: string;
  high: string;
  unknown?: string;
}

interface Likert4FacesProps {
  value: Likert4Value;
  onChange: (v: Likert4Value) => void;
  showUnknown?: boolean;
  ariaLabel?: string;
  className?: string;
  labels?: Likert4Labels;
}

const DEFAULT_LABELS: Likert4Labels = {
  low: "Słabo",
  ratherLow: "Raczej słabo",
  ratherHigh: "Raczej dobrze",
  high: "Dobrze",
  unknown: "Nie wiem",
};

interface Item {
  value: Exclude<Likert4Value, "unknown">;
  Icon: typeof Smile;
}

const ICONS: Item[] = [
  { value: "low", Icon: Frown },
  { value: "rather-low", Icon: Meh },
  { value: "rather-high", Icon: Smile },
  { value: "high", Icon: Smile },
];

export function Likert4Faces({
  value,
  onChange,
  showUnknown = true,
  ariaLabel,
  className,
  labels,
}: Likert4FacesProps) {
  const cls = ["cv2-likert4", className ?? ""].filter(Boolean).join(" ");
  const lbl = { ...DEFAULT_LABELS, ...(labels ?? {}) };
  const labelMap: Record<Exclude<Likert4Value, "unknown">, string> = {
    low: lbl.low,
    "rather-low": lbl.ratherLow,
    "rather-high": lbl.ratherHigh,
    high: lbl.high,
  };
  return (
    <div className={cls} role="radiogroup" aria-label={ariaLabel}>
      {ICONS.map(({ value: v, Icon }) => {
        const active = value === v;
        const isHigh = v === "high";
        const label = labelMap[v];
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            className={active ? "cv2-likert4-face is-active" : "cv2-likert4-face"}
            onClick={() => onChange(active ? "unknown" : v)}
          >
            <span className="cv2-likert4-face-circle">
              <Icon size={28} strokeWidth={isHigh ? 2 : 1.5} />
            </span>
            <span className="cv2-likert4-label">{label}</span>
          </button>
        );
      })}
      {showUnknown && (
        <button
          type="button"
          role="radio"
          aria-checked={value === "unknown"}
          aria-label={lbl.unknown ?? "Nie wiem"}
          className={value === "unknown" ? "cv2-likert4-face is-active" : "cv2-likert4-face"}
          onClick={() => onChange("unknown")}
        >
          <span className="cv2-likert4-face-circle">
            <HelpCircle size={28} strokeWidth={1.5} />
          </span>
          <span className="cv2-likert4-label">{lbl.unknown ?? "Nie wiem"}</span>
        </button>
      )}
    </div>
  );
}
