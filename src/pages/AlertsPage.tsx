// ═══════════════════════════════════════════════════
// AlertsPage Component (Phase 4 & UI Overhaul)
// Watchlist alerts management, filterable feed, acknowledge actions
// ═══════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AlertRecord, AlertPriority } from '@/types';
import { fetchAlerts, acknowledgeAlert } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  CheckCircle2Icon,
  NavigationIcon,
  ShieldAlertIcon,
  FilterIcon,
  ClockIcon,
  BellRingIcon,
} from 'lucide-react';

export function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('unack');

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert(id, 'Admin Operator');
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, acknowledged: true, acknowledged_by: 'Admin Operator', acknowledged_at: new Date().toISOString() }
            : a
        )
      );
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  if (loading) return <LoadingState message="Connecting to real-time watchlist alert stream..." />;
  if (error) return <ErrorState message={error} onRetry={loadAlerts} />;

  const filteredAlerts = alerts.filter((alert) => {
    if (priorityFilter !== 'all' && alert.priority !== priorityFilter) return false;
    if (statusFilter === 'unack' && alert.acknowledged) return false;
    if (statusFilter === 'ack' && !alert.acknowledged) return false;
    return true;
  });

  const unackCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-nero-text-primary">Watchlist Threat Alerts</h1>
            {unackCount > 0 && (
              <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-0.5 text-xs font-bold text-rose-400 flex items-center gap-1.5 shadow-lg shadow-rose-500/10">
                <BellRingIcon size={12} className="animate-bounce" />
                {unackCount} Pending Action
              </span>
            )}
          </div>
          <p className="text-xs text-nero-text-muted mt-1">
            Real-time automated alerts generated when camera ANPR matches watchlist targets
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-nero-border bg-nero-surface/90 px-3 py-1.5">
            <FilterIcon size={14} className="text-nero-text-muted" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-nero-text-primary focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-nero-surface">All Priorities</option>
              <option value="critical" className="bg-nero-surface">Critical</option>
              <option value="high" className="bg-nero-surface">High</option>
              <option value="medium" className="bg-nero-surface">Medium</option>
              <option value="low" className="bg-nero-surface">Low</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-nero-border bg-nero-surface px-3 py-1.5 text-xs font-semibold text-nero-text-primary focus:outline-none cursor-pointer"
          >
            <option value="unack" className="bg-nero-surface">Pending Only</option>
            <option value="ack" className="bg-nero-surface">Acknowledged</option>
            <option value="all" className="bg-nero-surface">All Status</option>
          </select>
        </div>
      </div>

      {/* Alert Feed Cards */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon={<ShieldAlertIcon size={32} />}
          title="No Watchlist Alerts Found"
          description="There are currently no alert records matching your selected filter criteria."
        />
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isUnack = !alert.acknowledged;
            return (
              <Card
                key={alert.id}
                className={`nero-card transition-all duration-300 ${
                  isUnack
                    ? 'border-l-4 border-l-rose-500 border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-nero-surface to-nero-surface shadow-lg shadow-rose-500/10'
                    : 'opacity-80 border-nero-border'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-black text-nero-accent">
                        {alert.plate_text}
                      </span>
                      <StatusBadge variant={alert.priority as AlertPriority} />
                      <span className="rounded bg-nero-surface-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-nero-text-secondary border border-nero-border">
                        {alert.category}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-nero-text-primary">
                      {alert.reason}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-nero-text-muted">
                      <span className="flex items-center gap-1 font-mono">
                        <ClockIcon size={12} />
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                      <span>Node: <strong className="text-nero-text-secondary font-semibold">{alert.camera_name}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/vehicles?plate=${encodeURIComponent(alert.plate_text)}`)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-nero-surface-elevated border border-nero-border px-3.5 py-2 text-xs font-semibold text-nero-text-primary hover:bg-nero-accent hover:text-nero-bg hover:border-nero-accent transition-all shadow-sm"
                    >
                      <NavigationIcon size={13} />
                      View Route
                    </button>

                    {isUnack ? (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-4 py-2 text-xs font-bold hover:bg-emerald-500 hover:text-nero-bg transition-all shadow-md shadow-emerald-500/10"
                      >
                        <CheckCircle2Icon size={15} />
                        Acknowledge
                      </button>
                    ) : (
                      <div className="text-right text-[11px] text-nero-text-muted font-mono">
                        <div className="flex items-center justify-end gap-1 text-emerald-400 font-bold">
                          <CheckCircle2Icon size={13} />
                          Acknowledged
                        </div>
                        <span>by {alert.acknowledged_by}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
