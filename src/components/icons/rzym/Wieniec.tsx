import type { LucideProps } from "lucide-react";

export function Wieniec({
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
      {/* Left branch — arc bottom up to top */}
      <path d="M 100 170 Q 30 150 30 100 Q 30 50 100 30" />
      {/* Right branch */}
      <path d="M 100 170 Q 170 150 170 100 Q 170 50 100 30" />
      {/* Left leaves — 2 ovals */}
      <path d="M 36 120 Q 22 116 26 102 Q 40 110 36 120 Z" />
      <path d="M 50 70 Q 38 58 46 48 Q 56 58 50 70 Z" />
      {/* Right leaves — mirror */}
      <path d="M 164 120 Q 178 116 174 102 Q 160 110 164 120 Z" />
      <path d="M 150 70 Q 162 58 154 48 Q 144 58 150 70 Z" />
      {/* Ribbon at bottom */}
      <path d="M 92 170 L 78 184 M 108 170 L 122 184" />
    </svg>
  );
}
