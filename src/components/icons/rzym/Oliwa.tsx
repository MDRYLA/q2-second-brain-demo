import type { LucideProps } from "lucide-react";

export function Oliwa({
  size = 24,
  strokeWidth = 1.25,
  className,
  ...props
}: LucideProps) {
  const sw = (typeof strokeWidth === "number" ? strokeWidth : 1.25) * (200 / 24);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      {/* Stem — diagonal */}
      <path d="M 36 168 Q 100 100 168 36" />
      {/* Leaves — 4 almond shapes (po 2 z kazdej strony) */}
      <path d="M 72 138 Q 56 130 52 144 Q 64 152 72 138 Z" />
      <path d="M 86 122 Q 100 116 102 130 Q 92 138 86 122 Z" />
      <path d="M 112 96 Q 96 88 92 102 Q 104 110 112 96 Z" />
      <path d="M 126 80 Q 140 74 142 88 Q 132 96 126 80 Z" />
      {/* Olives — 2 berries */}
      <circle cx="80" cy="118" r="4" fill="currentColor" stroke="none" />
      <circle cx="118" cy="76" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}
