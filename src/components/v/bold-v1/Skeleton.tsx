import * as React from "react";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  rounded?: boolean;
  className?: string;
}

export function Skeleton({ width, height = 20, rounded, className }: SkeletonProps) {
  const cls = ["bv1-skeleton", rounded ? "is-rounded" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <div
      className={cls}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      aria-hidden
    />
  );
}
