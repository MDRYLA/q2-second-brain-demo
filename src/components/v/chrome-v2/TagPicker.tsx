"use client";

import { TagPicker as BaseTagPicker } from "@/components/TagPicker";

interface Props {
  onPick: (hashtag: string) => void;
}

/**
 * chrome-v2 wrapper around base TagPicker.
 * Wrapper class `.cv2-tagpicker-wrap` allows CSS override w tokens.css
 * (glass pills, blue glow selected, JetBrains Mono prefix).
 */
export function TagPicker({ onPick }: Props) {
  return (
    <span className="cv2-tagpicker-wrap">
      <BaseTagPicker onPick={onPick} />
    </span>
  );
}
