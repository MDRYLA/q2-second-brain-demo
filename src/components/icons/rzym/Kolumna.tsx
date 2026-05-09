import type { LucideProps } from "lucide-react";

export function Kolumna({
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
      {/* Capital (top) — entablature */}
      <path d="M 38 28 L 162 28" />
      <path d="M 50 44 L 150 44" />
      {/* Shaft sides */}
      <path d="M 60 44 L 60 156" />
      <path d="M 140 44 L 140 156" />
      {/* Single central flute */}
      <path d="M 100 50 L 100 150" />
      {/* Base */}
      <path d="M 50 156 L 150 156" />
      <path d="M 38 172 L 162 172" />
    </svg>
  );
}
