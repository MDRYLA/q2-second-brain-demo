import * as React from "react";

type Variant = "glass" | "glass-hero";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const VARIANT_CLASS: Record<Variant, string> = {
  glass: "cv2-card",
  "glass-hero": "cv2-card-hero",
};

export function Card({ variant = "glass", className, children, ...rest }: CardProps) {
  const cls = [VARIANT_CLASS[variant], className ?? ""].filter(Boolean).join(" ");
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
