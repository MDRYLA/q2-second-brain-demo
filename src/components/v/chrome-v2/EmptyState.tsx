import * as React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="cv2-empty-state">
      {icon && <div className="cv2-empty-state-icon">{icon}</div>}
      <h3 className="cv2-empty-state-title">{title}</h3>
      {description && <p className="cv2-empty-state-desc">{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
