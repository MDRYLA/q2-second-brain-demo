import * as React from "react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...rest },
  ref,
) {
  const cls = ["bv1-input", invalid ? "is-invalid" : "", className ?? ""].filter(Boolean).join(" ");
  return <input ref={ref} className={cls} {...rest} />;
});
