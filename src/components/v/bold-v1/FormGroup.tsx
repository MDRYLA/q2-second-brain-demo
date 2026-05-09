import * as React from "react";

interface FormGroupProps {
  label?: string;
  htmlFor?: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({ label, htmlFor, helper, error, children, className }: FormGroupProps) {
  const cls = ["bv1-form-group", className ?? ""].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      {label && (
        <label htmlFor={htmlFor} className="bv1-form-label">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="bv1-form-error">{error}</p>
      ) : helper ? (
        <p className="bv1-form-helper">{helper}</p>
      ) : null}
    </div>
  );
}
