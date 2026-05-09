import type { LucideProps } from "lucide-react";

export function Lira({
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
      {/* Crossbar (top yoke) */}
      <path d="M 50 38 Q 100 24 150 38" />
      {/* Arms — curved horns */}
      <path d="M 56 40 Q 38 80 56 120" />
      <path d="M 144 40 Q 162 80 144 120" />
      {/* Body — soundbox bottom */}
      <path d="M 56 120 Q 100 180 144 120" />
      {/* Strings — 3 (z 5) */}
      <path d="M 80 50 L 80 134 M 100 48 L 100 142 M 120 50 L 120 134" />
    </svg>
  );
}
