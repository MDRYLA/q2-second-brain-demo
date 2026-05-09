import * as React from "react";

type Variant = "paper" | "paper-hero" | "warm";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const VARIANT_CLASS: Record<Variant, string> = {
  paper: "bv1-card",
  "paper-hero": "bv1-card-hero",
  warm: "bv1-card-warm",
};

export function Card({ variant = "paper", className, children, ...rest }: CardProps) {
  const cls = [VARIANT_CLASS[variant], className ?? ""].filter(Boolean).join(" ");
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
