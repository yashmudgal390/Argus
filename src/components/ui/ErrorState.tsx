// ═══════════════════════════════════════════════════
// ErrorState — Consistent error display
// Every data view must handle errors explicitly
// ═══════════════════════════════════════════════════

import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
        <AlertTriangleIcon size={28} />
      </div>
      <h3 className="text-base font-semibold text-nero-text-primary">Error</h3>
      <p className="mt-1 max-w-sm text-sm text-nero-text-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-nero-surface-elevated px-4 py-2 text-sm font-medium text-nero-text-primary transition-colors hover:bg-nero-surface-hover"
        >
          <RefreshCwIcon size={14} />
          Try again
        </button>
      )}
    </div>
  );
}
