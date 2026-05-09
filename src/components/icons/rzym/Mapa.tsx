import type { LucideProps } from "lucide-react";

export function Mapa({
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
      {/* Top roll — papyrus scroll */}
      <ellipse cx="100" cy="40" rx="58" ry="10" />
      {/* Body sides */}
      <path d="M 42 40 L 42 160 M 158 40 L 158 160" />
      {/* Text lines — 3 (z 5) */}
      <path d="M 60 78 L 140 78 M 60 100 L 130 100 M 60 122 L 140 122" />
      {/* Bottom roll */}
      <ellipse cx="100" cy="160" rx="58" ry="10" />
    </svg>
  );
}
