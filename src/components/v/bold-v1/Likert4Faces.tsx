"use client";

import * as React from "react";

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

const STROKE = 2.2;
const HEAD_FILL = "var(--bv1-accent-yellow)";
const PETAL_FILL = "var(--bv1-accent-yellow)";
const CENTER_FILL = "var(--bv1-accent-red)";

interface FaceProps {
  size?: number;
}

// Decyzja AskUserQuestion: tylko bv1 (Magazine cartoon), cv2 zostaje lucide.
// Spójne z TickIcons.tsx — currentColor stroke + var(--bv1-accent-yellow) head + var(--bv1-accent-red) center.

// Niska / Słabo — kwiatek zwiędły, głowa pochylona, opadające płatki
function FaceLow({ size = 44 }: FaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden>
      {/* łodyga skrzywiona w dół */}
      <path d="M 30 50 Q 28 40 22 32" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" fill="none" />
      {/* opadający listek */}
      <ellipse cx="32" cy="42" rx="4" ry="2" fill="currentColor" opacity="0.5" transform="rotate(35 32 42)" />
      {/* głowa pochylona — opacity blada */}
      <g transform="translate(22 32) rotate(-30)">
        {/* opadające płatki — tylko 3 z 6 */}
        <ellipse cx="0" cy="-7" rx="3.5" ry="5" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} opacity="0.45" />
        <ellipse cx="-7" cy="-2" rx="3.5" ry="5" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} opacity="0.45" transform="rotate(-60)" />
        <ellipse cx="7" cy="-2" rx="3.5" ry="5" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} opacity="0.45" transform="rotate(60)" />
        {/* środek z buźką smutną */}
        <circle cx="0" cy="0" r="4" fill={CENTER_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} />
        {/* zamknięte oczy + frown */}
        <path d="M -2 -1 Q -1 0 0 -1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M 0 -1 Q 1 0 2 -1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M -1.5 2 Q 0 1 1.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
      {/* podstawa */}
      <path d="M 22 50 Q 30 53 38 50" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

// Raczej niska — kwiatek osłabiony, głowa lekko pochylona, 4-5 płatków
function FaceRatherLow({ size = 44 }: FaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden>
      {/* łodyga prosto */}
      <path d="M 30 50 L 30 28" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      {/* mały listek */}
      <ellipse cx="22" cy="42" rx="4" ry="2" fill="currentColor" opacity="0.7" transform="rotate(-25 22 42)" />
      {/* głowa lekko pochylona */}
      <g transform="translate(30 22) rotate(-12)">
        {/* 5 płatków z 6 — jeden pomijany (lewy-dolny) */}
        <ellipse cx="0" cy="-9" rx="4" ry="6" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} opacity="0.75" />
        <ellipse cx="8" cy="-4" rx="4" ry="6" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} opacity="0.75" transform="rotate(60)" />
        <ellipse cx="8" cy="5" rx="4" ry="6" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} opacity="0.75" transform="rotate(120)" />
        <ellipse cx="-8" cy="5" rx="4" ry="6" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} opacity="0.75" transform="rotate(-120)" />
        <ellipse cx="-8" cy="-4" rx="4" ry="6" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} opacity="0.75" transform="rotate(-60)" />
        {/* środek + lekko smutna buźka */}
        <circle cx="0" cy="0" r="5" fill={CENTER_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} />
        <circle cx="-1.8" cy="-0.8" r="0.6" fill="currentColor" />
        <circle cx="1.8" cy="-0.8" r="0.6" fill="currentColor" />
        <path d="M -2 2 Q 0 1.2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
      {/* podstawa */}
      <path d="M 22 50 Q 30 53 38 50" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Raczej wysoka / Raczej dobrze — kwiatek prosto, 6 płatków, mała buźka
function FaceRatherHigh({ size = 44 }: FaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden>
      {/* łodyga prosto */}
      <path d="M 30 50 L 30 26" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      {/* listek */}
      <ellipse cx="22" cy="40" rx="4" ry="2" fill="currentColor" transform="rotate(-25 22 40)" />
      {/* głowa pełna 6 płatków */}
      <g transform="translate(30 20)">
        <ellipse cx="0" cy="-9" rx="4" ry="6" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} />
        <ellipse cx="0" cy="-9" rx="4" ry="6" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} transform="rotate(60)" />
        <ellipse cx="0" cy="-9" rx="4" ry="6" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} transform="rotate(120)" />
        <ellipse cx="0" cy="-9" rx="4" ry="6" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} transform="rotate(180)" />
        <ellipse cx="0" cy="-9" rx="4" ry="6" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} transform="rotate(240)" />
        <ellipse cx="0" cy="-9" rx="4" ry="6" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} transform="rotate(300)" />
        {/* środek + uśmiech */}
        <circle cx="0" cy="0" r="5" fill={CENTER_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} />
        <circle cx="-1.8" cy="-0.8" r="0.6" fill="currentColor" />
        <circle cx="1.8" cy="-0.8" r="0.6" fill="currentColor" />
        <path d="M -2 1.5 Q 0 2.8 2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
      {/* podstawa */}
      <path d="M 22 50 Q 30 53 38 50" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Wysoka / Dobrze — kwiatek w pełnym rozkwicie + iskierki + 2 listki
function FaceHigh({ size = 44 }: FaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden>
      {/* iskierki dookoła (energia) */}
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M 6 12 L 6 16 M 4 14 L 8 14" />
        <path d="M 52 10 L 52 14 M 50 12 L 54 12" />
        <path d="M 8 32 L 8 36 M 6 34 L 10 34" />
        <path d="M 52 30 L 52 34 M 50 32 L 54 32" />
      </g>
      {/* łodyga prosto */}
      <path d="M 30 50 L 30 30" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" />
      {/* dwa listki */}
      <ellipse cx="22" cy="42" rx="4" ry="2" fill="currentColor" transform="rotate(-25 22 42)" />
      <ellipse cx="38" cy="40" rx="4" ry="2" fill="currentColor" transform="rotate(25 38 40)" />
      {/* głowa pełna 6 płatków + zewnętrzna warstwa większa */}
      <g transform="translate(30 22)">
        {/* zewnętrzne większe płatki */}
        <ellipse cx="0" cy="-11" rx="4.5" ry="7" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} />
        <ellipse cx="0" cy="-11" rx="4.5" ry="7" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} transform="rotate(60)" />
        <ellipse cx="0" cy="-11" rx="4.5" ry="7" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} transform="rotate(120)" />
        <ellipse cx="0" cy="-11" rx="4.5" ry="7" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} transform="rotate(180)" />
        <ellipse cx="0" cy="-11" rx="4.5" ry="7" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} transform="rotate(240)" />
        <ellipse cx="0" cy="-11" rx="4.5" ry="7" fill={PETAL_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} transform="rotate(300)" />
        {/* środek z dużym uśmiechem + policzki */}
        <circle cx="0" cy="0" r="5.5" fill={CENTER_FILL} stroke="currentColor" strokeWidth={STROKE - 0.4} />
        <circle cx="-2" cy="-1" r="0.7" fill="currentColor" />
        <circle cx="2" cy="-1" r="0.7" fill="currentColor" />
        <path d="M -2.5 1.5 Q 0 4 2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        {/* policzki */}
        <circle cx="-4" cy="1.5" r="0.9" fill="currentColor" opacity="0.4" />
        <circle cx="4" cy="1.5" r="0.9" fill="currentColor" opacity="0.4" />
      </g>
      {/* podstawa */}
      <path d="M 22 50 Q 30 53 38 50" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Nie wiem — kwiatek z pytajnikiem (przerywana ellipsa głowy)
function FaceUnknown({ size = 44 }: FaceProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" aria-hidden>
      <path d="M 30 50 L 30 30" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" strokeDasharray="3 2" />
      <circle cx="30" cy="22" r="10" fill="none" stroke="currentColor" strokeWidth={STROKE} strokeDasharray="4 3" />
      {/* znak zapytania */}
      <path d="M 26 18 Q 26 14 30 14 Q 34 14 34 18 Q 34 22 30 24 L 30 26" stroke="currentColor" strokeWidth={STROKE} strokeLinecap="round" fill="none" />
      <circle cx="30" cy="29" r="1.2" fill="currentColor" />
    </svg>
  );
}

const FACES: Record<Likert4Value, (props: FaceProps) => React.JSX.Element> = {
  low: FaceLow,
  "rather-low": FaceRatherLow,
  "rather-high": FaceRatherHigh,
  high: FaceHigh,
  unknown: FaceUnknown,
};

export function Likert4Faces({
  value,
  onChange,
  showUnknown = true,
  ariaLabel,
  className,
  labels,
}: Likert4FacesProps) {
  const cls = ["bv1-likert4", className ?? ""].filter(Boolean).join(" ");
  const lbl = { ...DEFAULT_LABELS, ...(labels ?? {}) };
  const items: { value: Exclude<Likert4Value, "unknown">; label: string }[] = [
    { value: "low", label: lbl.low },
    { value: "rather-low", label: lbl.ratherLow },
    { value: "rather-high", label: lbl.ratherHigh },
    { value: "high", label: lbl.high },
  ];
  return (
    <div className={cls} role="radiogroup" aria-label={ariaLabel}>
      {items.map(({ value: v, label }) => {
        const Face = FACES[v];
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            className={active ? "bv1-likert4-face is-active" : "bv1-likert4-face"}
            onClick={() => onChange(active ? "unknown" : v)}
          >
            <Face size={44} />
            <span className="bv1-likert4-label">{label}</span>
          </button>
        );
      })}
      {showUnknown && (
        <button
          type="button"
          role="radio"
          aria-checked={value === "unknown"}
          aria-label={lbl.unknown ?? "Nie wiem"}
          className={value === "unknown" ? "bv1-likert4-face is-active" : "bv1-likert4-face"}
          onClick={() => onChange("unknown")}
        >
          <FaceUnknown size={44} />
          <span className="bv1-likert4-label">{lbl.unknown ?? "Nie wiem"}</span>
        </button>
      )}
    </div>
  );
}
