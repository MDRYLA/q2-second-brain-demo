import * as React from "react";

interface SectionHeaderProps {
  children: React.ReactNode;
  action?: React.ReactNode;
  as?: "h2" | "h3";
}

export function SectionHeader({ children, action, as = "h2" }: SectionHeaderProps) {
  const Tag = as;

  if (action) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <Tag className="cv2-section-h" style={{ marginBottom: 0 }}>
          {children}
        </Tag>
        <div>{action}</div>
      </div>
    );
  }

  return <Tag className="cv2-section-h">{children}</Tag>;
}
