import * as React from "react";

interface ActionRowProps {
  children: React.ReactNode;
  className?: string;
}

export function ActionRow({ children, className }: ActionRowProps) {
  const cls = ["cv2-action-row", className ?? ""].filter(Boolean).join(" ");
  return <div className={cls}>{children}</div>;
}
