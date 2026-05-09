import * as React from "react";

interface SectionHeaderProps {
  children: React.ReactNode;
  onCard?: boolean;
  action?: React.ReactNode;
  as?: "h2" | "h3";
}

export function SectionHeader({ children, onCard, action, as = "h2" }: SectionHeaderProps) {
  const Tag = as;
  const headerCls = ["bv1-section-h", onCard ? "on-card" : ""].filter(Boolean).join(" ");

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
        <Tag className={headerCls} style={{ marginBottom: 0 }}>
          {children}
        </Tag>
        <div>{action}</div>
      </div>
    );
  }

  return <Tag className={headerCls}>{children}</Tag>;
}
