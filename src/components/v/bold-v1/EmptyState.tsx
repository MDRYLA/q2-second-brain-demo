import * as React from "react";
import Image from "next/image";

interface EmptyStateProps {
  iconSrc?: string;
  iconAlt?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ iconSrc, iconAlt = "", title, description, action }: EmptyStateProps) {
  return (
    <div className="bv1-empty-state">
      {iconSrc && (
        <Image
          src={iconSrc}
          alt={iconAlt}
          width={64}
          height={64}
          className="bv1-empty-state-icon"
          unoptimized
        />
      )}
      <h3 className="bv1-empty-state-title">{title}</h3>
      {description && <p className="bv1-empty-state-desc">{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
