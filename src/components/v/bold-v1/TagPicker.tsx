"use client";

import { TagPicker as BaseTagPicker } from "@/components/TagPicker";

interface Props {
  onPick: (hashtag: string) => void;
}

/**
 * bold-v1 wrapper around base TagPicker.
 * Wrapper class `.bv1-tagpicker-wrap` allows CSS override w tokens.css
 * (cream pills, accent-red selected, dashed red + button).
 *
 * Uwaga: base używa Lucide icons (Tag, Settings, X, Plus) — ZACHOWANE w trigger,
 * to drobny trade-off (icons w action buttons, nie w content layouts).
 */
export function TagPicker({ onPick }: Props) {
  return (
    <span className="bv1-tagpicker-wrap">
      <BaseTagPicker onPick={onPick} />
    </span>
  );
}
