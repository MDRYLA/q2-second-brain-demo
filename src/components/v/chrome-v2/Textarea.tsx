import * as React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, ...rest },
  ref,
) {
  const cls = ["cv2-textarea", invalid ? "is-invalid" : "", className ?? ""].filter(Boolean).join(" ");
  return <textarea ref={ref} className={cls} {...rest} />;
});
