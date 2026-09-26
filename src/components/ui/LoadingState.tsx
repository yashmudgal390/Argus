// ═══════════════════════════════════════════════════
// LoadingState — Consistent loading spinner/skeleton
// Every data view must handle loading explicitly
// ═══════════════════════════════════════════════════

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-nero-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-nero-accent" />
      </div>
      <p className="mt-4 text-sm text-nero-text-muted">{message}</p>
    </div>
  );
}
