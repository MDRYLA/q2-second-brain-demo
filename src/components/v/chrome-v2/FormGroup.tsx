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
  const cls = ["cv2-form-group", className ?? ""].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      {label && (
        <label htmlFor={htmlFor} className="cv2-form-label">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="cv2-form-error">{error}</p>
      ) : helper ? (
        <p className="cv2-form-helper">{helper}</p>
      ) : null}
    </div>
  );
}
