import * as React from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "cv2-btn cv2-btn-primary",
  secondary: "cv2-btn cv2-btn-secondary",
  ghost: "cv2-btn cv2-btn-ghost",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", fullWidth, className, type = "button", ...rest },
  ref,
) {
  const cls = [VARIANT_CLASS[variant], fullWidth ? "is-full" : "", className ?? ""].filter(Boolean).join(" ");
  return <button ref={ref} type={type} className={cls} {...rest} />;
});
