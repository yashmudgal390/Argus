// ═══════════════════════════════════════════════════
// EmptyState — Consistent empty/no-data display
// Every data view must handle empty explicitly
// ═══════════════════════════════════════════════════

import { InboxIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-nero-surface-elevated text-nero-text-muted">
        {icon ?? <InboxIcon size={28} />}
      </div>
      <h3 className="text-base font-semibold text-nero-text-primary">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-nero-text-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
