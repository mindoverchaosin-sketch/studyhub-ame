import type { ReactNode } from "react";

interface GlassPanelProps {
  children?: ReactNode;
}

export function GlassPanel({ children }: GlassPanelProps) {
  return (
    <div className="glass-panel">
      {children}
    </div>
  );
}
