// ═══════════════════════════════════════════════════
// Card — Reusable card panel primitive
// Dark surface with soft rounded corners per design.md
// ═══════════════════════════════════════════════════

import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  id?: string;
}

export function Card({ children, className = '', hover = false, onClick, id }: CardProps) {
  return (
    <div
      id={id}
      className={`
        rounded-xl border border-nero-border bg-nero-surface p-4
        ${hover ? 'nero-card cursor-pointer hover:bg-nero-surface-hover' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold text-nero-text-primary">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-nero-text-muted">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
