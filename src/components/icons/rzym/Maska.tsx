import type { LucideProps } from "lucide-react";

export function Maska({
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
      {/* Face oval — antique mask */}
      <path d="M 100 28 C 60 28 44 70 44 110 C 44 156 70 184 100 184 C 130 184 156 156 156 110 C 156 70 140 28 100 28 Z" />
      {/* Eyes — almond shapes */}
      <path d="M 64 90 Q 78 82 92 90 Q 78 98 64 90 Z" />
      <path d="M 108 90 Q 122 82 136 90 Q 122 98 108 90 Z" />
      {/* Mouth — slight upward arc (contemplative) */}
      <path d="M 78 148 Q 100 158 122 148" />
    </svg>
  );
}
