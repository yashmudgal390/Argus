// ═══════════════════════════════════════════════════
// AnalyticsPage Component (Phase 5 & UI Overhaul)
// City-level traffic analytics: Congestion, Origin-Destination, Corridors
// ═══════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import type { CongestionMetric, ODPair, CorridorStats } from '@/types';
import { fetchCongestionMetrics, fetchODPairs, fetchCorridors } from '@/lib/supabase';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  FlameIcon,
  ArrowRightLeftIcon,
  RouteIcon,
  ClockIcon,
  TrendingUpIcon,
  BarChart3Icon,
} from 'lucide-react';

type AnalyticsTab = 'congestion' | 'od' | 'corridors';

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('congestion');
  const [timeRange, setTimeRange] = useState<string>('morning_peak');

  const [congestion, setCongestion] = useState<CongestionMetric[]>([]);
  const [odPairs, setODPairs] = useState<ODPair[]>([]);
  const [corridors, setCorridors] = useState<CorridorStats[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cData, odData, corrData] = await Promise.all([
        fetchCongestionMetrics(),
        fetchODPairs(),
        fetchCorridors(),
      ]);
      setCongestion(cData);
      setODPairs(odData);
      setCorridors(corrData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState message="Aggregating city traffic intelligence..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Window Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-nero-text-primary">Traffic Intelligence Analytics</h1>
            <span className="rounded-full bg-nero-accent/15 border border-nero-accent/30 px-3 py-0.5 text-xs font-bold text-nero-accent flex items-center gap-1.5">
              <BarChart3Icon size={12} />
              Aggregated Metrics
            </span>
          </div>
          <p className="text-xs text-nero-text-muted mt-1">
            City-level traffic volume, arterial corridors, and origin-destination movement flows
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-nero-border bg-nero-surface/90 px-3 py-1.5">
          <ClockIcon size={14} className="text-nero-text-muted" />
          <span className="text-xs font-medium text-nero-text-muted">Window:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-nero-text-primary focus:outline-none cursor-pointer"
          >
            <option value="morning_peak" className="bg-nero-surface">Morning Peak (08:00 - 10:00)</option>
            <option value="evening_peak" className="bg-nero-surface">Evening Peak (17:00 - 19:00)</option>
            <option value="full_day" className="bg-nero-surface">Last 24 Hours</option>
          </select>
        </div>
      </div>

      {/* Glassmorphic Tabs Bar */}
      <div className="flex border-b border-nero-border/80 space-x-6">
        <button
          onClick={() => setActiveTab('congestion')}
          className={`flex items-center gap-2 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'congestion'
              ? 'border-nero-accent text-nero-accent'
              : 'border-transparent text-nero-text-secondary hover:text-nero-text-primary'
          }`}
        >
          <FlameIcon size={16} />
          Zone Congestion Density
        </button>

        <button
          onClick={() => setActiveTab('od')}
          className={`flex items-center gap-2 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'od'
              ? 'border-nero-accent text-nero-accent'
              : 'border-transparent text-nero-text-secondary hover:text-nero-text-primary'
          }`}
        >
          <ArrowRightLeftIcon size={16} />
          Movement Patterns (OD Pairs)
        </button>

        <button
          onClick={() => setActiveTab('corridors')}
          className={`flex items-center gap-2 py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'corridors'
              ? 'border-nero-accent text-nero-accent'
              : 'border-transparent text-nero-text-secondary hover:text-nero-text-primary'
          }`}
        >
          <RouteIcon size={16} />
          Arterial Corridors
        </button>
      </div>

      {/* TAB 1: CONGESTION */}
      {activeTab === 'congestion' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {congestion.map((item, idx) => (
              <Card key={idx} className="nero-card">
                <CardHeader
                  title={item.zone}
                  subtitle={item.time_bucket}
                  action={
                    <StatusBadge
                      variant={item.congestion_level === 'high' ? 'high' : item.congestion_level === 'medium' ? 'medium' : 'low'}
                      label={`${item.congestion_level.toUpperCase()}`}
                    />
                  }
                />
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-nero-text-muted">Detected Volume:</span>
                    <span className="font-mono font-bold text-nero-text-primary">{item.detection_count} vehicles</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-nero-text-muted">Avg Speed:</span>
                    <span className="font-mono font-bold text-nero-accent">{item.avg_speed} km/h</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="nero-card">
            <CardHeader
              title="Zone Density Rankings"
              subtitle="Aggregated volume distribution per city sector"
              action={<TrendingUpIcon size={16} className="text-nero-accent" />}
            />
            <div className="space-y-4 mt-3">
              {congestion.map((item, idx) => {
                const maxVol = 2000;
                const pct = Math.min(100, Math.round((item.detection_count / maxVol) * 100));
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-nero-text-primary">{item.zone}</span>
                      <span className="font-mono text-nero-text-secondary">{item.detection_count} detections ({item.avg_speed} km/h avg)</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-nero-border overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.congestion_level === 'high'
                            ? 'bg-gradient-to-r from-rose-500 to-red-600'
                            : item.congestion_level === 'medium'
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                            : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: ORIGIN-DESTINATION (OD) */}
      {activeTab === 'od' && (
        <div className="space-y-6">
          <Card className="nero-card">
            <CardHeader
              title="Origin-Destination Movement Patterns"
              subtitle="Multi-camera journey flow pairs"
              action={<ArrowRightLeftIcon size={16} className="text-nero-accent" />}
            />
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-nero-border text-xs text-nero-text-muted uppercase tracking-wider">
                    <th className="py-3.5 px-4">Origin Sector</th>
                    <th className="py-3.5 px-4">Destination Sector</th>
                    <th className="py-3.5 px-4">Trips Tracked</th>
                    <th className="py-3.5 px-4">Avg Travel Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nero-border/60 text-xs">
                  {odPairs.map((pair, idx) => (
                    <tr key={idx} className="hover:bg-nero-surface-hover transition-colors">
                      <td className="py-3.5 px-4 font-bold text-nero-text-primary">{pair.origin_zone}</td>
                      <td className="py-3.5 px-4 font-bold text-nero-text-primary">{pair.destination_zone}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-nero-accent">{pair.trip_count} trips</td>
                      <td className="py-3.5 px-4 font-mono text-nero-text-secondary">
                        {Math.round(pair.avg_travel_time_seconds / 60)} mins
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: CORRIDORS */}
      {activeTab === 'corridors' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {corridors.map((corr) => (
            <Card key={corr.id} className="nero-card">
              <CardHeader
                title={corr.name}
                subtitle={`${corr.from_zone} → ${corr.to_zone}`}
                action={<RouteIcon size={18} className="text-nero-accent" />}
              />
              <div className="space-y-3 mt-3">
                <div className="flex justify-between text-xs pb-2 border-b border-nero-border/60">
                  <span className="text-nero-text-muted">Total Trajectories:</span>
                  <span className="font-mono font-bold text-nero-accent">{corr.trajectory_count} trips</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-nero-border/60">
                  <span className="text-nero-text-muted">Avg Travel Duration:</span>
                  <span className="font-mono font-bold text-nero-text-primary">{Math.round(corr.avg_travel_time_seconds / 60)} mins</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-nero-text-muted">Peak Window:</span>
                  <span className="font-mono text-amber-400 font-bold">{corr.peak_hour} ({corr.peak_count} vehicles)</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
