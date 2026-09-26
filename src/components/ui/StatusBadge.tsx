// ═══════════════════════════════════════════════════
// StatusBadge — Shared status/priority badge component
// Status→color mapping is centralized here per design.md
// ═══════════════════════════════════════════════════

import type { CameraStatus, AlertPriority } from '@/types';

type BadgeVariant = CameraStatus | AlertPriority | 'info';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  online:      { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  offline:     { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400' },
  maintenance: { bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  low:         { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  medium:      { bg: 'bg-amber-500/15',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  high:        { bg: 'bg-red-500/15',     text: 'text-red-400',     dot: 'bg-red-400' },
  critical:    { bg: 'bg-red-600/20',     text: 'text-red-300',     dot: 'bg-red-500' },
  info:        { bg: 'bg-blue-500/15',    text: 'text-blue-400',    dot: 'bg-blue-400' },
};

const defaultLabels: Record<BadgeVariant, string> = {
  online: 'Online',
  offline: 'Offline',
  maintenance: 'Maintenance',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
  info: 'Info',
};

export function StatusBadge({ variant, label, pulse = false, size = 'sm' }: StatusBadgeProps) {
  const style = variantStyles[variant];
  const displayLabel = label ?? defaultLabels[variant];
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${style.bg} ${style.text} ${sizeClasses}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${style.dot} ${pulse ? 'animate-pulse' : ''}`}
      />
      {displayLabel}
    </span>
  );
}
