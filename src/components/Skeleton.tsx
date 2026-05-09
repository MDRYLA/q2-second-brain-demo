// Anti-pattern wykluczony: NIE cytaty-on-load (Headspace/Calm pattern, anti-pattern w wellness apps).

interface SkeletonProps {
  variant?: "text" | "card" | "circle" | "block";
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({ variant = "text", width, height, className }: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === "number" ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === "number" ? `${height}px` : height;
  return (
    <div
      className={`skeleton skeleton-${variant}${className ? ` ${className}` : ""}`}
      style={style}
      aria-hidden="true"
    />
  );
}
