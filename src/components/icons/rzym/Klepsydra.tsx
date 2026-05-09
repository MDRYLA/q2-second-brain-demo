import type { LucideProps } from "lucide-react";

export function Klepsydra({
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
      {/* Top frame */}
      <path d="M 50 32 L 150 32" />
      {/* Bottom frame */}
      <path d="M 50 168 L 150 168" />
      {/* Hourglass silhouette — single Z path */}
      <path d="M 60 32 L 100 100 L 60 168 M 140 32 L 100 100 L 140 168" />
      {/* Sand bottom dune */}
      <path d="M 78 156 Q 100 142 122 156" />
    </svg>
  );
}
