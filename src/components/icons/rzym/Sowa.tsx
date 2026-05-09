import type { LucideProps } from "lucide-react";

export function Sowa({
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
      {/* Body silhouette — owl shape */}
      <path d="M 100 38 C 56 38 40 80 40 118 C 40 154 64 178 100 178 C 136 178 160 154 160 118 C 160 80 144 38 100 38 Z" />
      {/* Ear tufts */}
      <path d="M 60 50 L 50 32 M 140 50 L 150 32" />
      {/* Eyes — large circles */}
      <circle cx="76" cy="92" r="14" />
      <circle cx="124" cy="92" r="14" />
      {/* Beak */}
      <path d="M 100 104 L 92 118 L 108 118 Z" />
    </svg>
  );
}
