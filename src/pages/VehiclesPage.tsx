// ═══════════════════════════════════════════════════
// VehiclesPage Component (Phase 3 & UI Overhaul)
// Vehicle Search & Multi-Camera Journey Trajectory View
// ═══════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Trajectory } from '@/types';
import { searchVehicles, fetchTrajectoryByPlate } from '@/lib/supabase';
import { Card, CardHeader } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TrajectoryMap } from '@/components/map/TrajectoryMap';
import {
  SearchIcon,
  CarIcon,
  NavigationIcon,
  ClockIcon,
  MapPinIcon,
  SparklesIcon,
} from 'lucide-react';

export function VehiclesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPlate = searchParams.get('plate') || '';

  const [searchQuery, setSearchQuery] = useState(initialPlate);
  const [selectedPlate, setSelectedPlate] = useState<string | null>(initialPlate || null);
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTrajectory, setLoadingTrajectory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load matching vehicles
  const loadVehicles = async (query: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await searchVehicles(query);
      if (!selectedPlate && data.length > 0) {
        setSelectedPlate(data[0].plate_text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPlate) {
      setTrajectory(null);
      return;
    }

    const loadTrajectory = async () => {
      setLoadingTrajectory(true);
      try {
        const traj = await fetchTrajectoryByPlate(selectedPlate);
        setTrajectory(traj);
      } catch (err) {
        console.error('Failed to load trajectory:', err);
      } finally {
        setLoadingTrajectory(false);
      }
    };

    loadTrajectory();
  }, [selectedPlate]);

  useEffect(() => {
    loadVehicles(searchQuery);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVehicles(searchQuery);
  };

  const handleSelectPlate = (plate: string) => {
    setSelectedPlate(plate);
    setSearchQuery(plate);
    setSearchParams({ plate });
  };

  if (loading) return <LoadingState message="Searching ANPR vehicle trajectory logs..." />;
  if (error) return <ErrorState message={error} onRetry={() => loadVehicles(searchQuery)} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Plate Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-nero-text-primary">Multi-Camera Vehicle Trajectory</h1>
            <span className="rounded-full bg-nero-accent/15 border border-nero-accent/30 px-3 py-0.5 text-xs font-bold text-nero-accent flex items-center gap-1.5">
              <SparklesIcon size={12} />
              AI Route Reconstruction
            </span>
          </div>
          <p className="text-xs text-nero-text-muted mt-1">
            Trace exact multi-camera visit sequences and travel duration across city camera nodes
          </p>
        </div>

        {/* Quick select plate chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-medium text-nero-text-muted shrink-0">Sample Targets:</span>
          {['DL-01-AB-1234', 'HR-26-CD-5678', 'DL-02-EF-9012'].map((p) => (
            <button
              key={p}
              onClick={() => handleSelectPlate(p)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-mono font-bold transition-all shadow-sm ${
                selectedPlate === p
                  ? 'bg-nero-accent text-nero-bg border border-nero-accent shadow-nero-accent/30 scale-105'
                  : 'bg-nero-surface/80 border border-nero-border text-nero-text-secondary hover:text-nero-text-primary hover:border-nero-accent/50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Search Bar */}
      <Card className="nero-card border-nero-border/80">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-nero-text-muted" />
            <input
              type="text"
              placeholder="Search by license plate number (e.g. DL-01-AB-1234)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-nero-border bg-nero-bg/80 pl-11 pr-4 py-2.5 text-xs font-mono text-nero-text-primary placeholder:font-sans placeholder:text-nero-text-muted focus:border-nero-accent focus:bg-nero-bg focus:outline-none focus:ring-2 focus:ring-nero-accent/20 transition-all"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-nero-accent px-6 py-2.5 text-xs font-bold text-nero-bg transition-all hover:bg-nero-accent-hover hover:shadow-lg hover:shadow-nero-accent/25"
          >
            Trace Journey
          </button>
        </form>
      </Card>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Map & Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-[440px] p-0 overflow-hidden relative border-nero-border/80 shadow-2xl rounded-2xl">
            {loadingTrajectory ? (
              <LoadingState message="Reconstructing camera visit polyline path..." />
            ) : trajectory && trajectory.waypoints.length > 0 ? (
              <TrajectoryMap waypoints={trajectory.waypoints} />
            ) : (
              <EmptyState
                icon={<NavigationIcon size={32} />}
                title="Select a Vehicle Plate"
                description="Search or select a license plate target above to trace its multi-camera journey path."
              />
            )}
          </Card>

          {/* Timeline Bar */}
          {trajectory && trajectory.waypoints.length > 0 && (
            <Card className="nero-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-nero-text-primary flex items-center gap-2">
                  <ClockIcon size={16} className="text-nero-accent" />
                  Journey Sequence Timeline
                </span>
                <span className="text-xs text-nero-text-muted font-mono">
                  Total Travel: <strong className="text-nero-accent font-bold">{Math.round(trajectory.total_travel_time_seconds / 60)} mins</strong>
                </span>
              </div>

              <div className="relative py-4 px-2">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-nero-accent/80 via-nero-cyan to-emerald-400 -translate-y-1/2 rounded-full" />
                <div className="relative flex justify-between">
                  {trajectory.waypoints.map((wp, idx) => (
                    <div key={idx} className="flex flex-col items-center group cursor-pointer">
                      <div className="h-7 w-7 rounded-full bg-nero-accent text-nero-bg font-black text-xs flex items-center justify-center border-2 border-nero-surface shadow-lg shadow-nero-accent/30 group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </div>
                      <span className="mt-2 text-[10px] font-bold text-nero-text-primary truncate max-w-[100px] text-center">
                        {wp.camera_name}
                      </span>
                      <span className="text-[9px] font-mono text-nero-text-muted">
                        {new Date(wp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right: Vehicle Summary & Visit Cards */}
        <div className="space-y-4">
          {trajectory && (
            <Card className="nero-card">
              <CardHeader
                title="Target Summary"
                subtitle="ANPR Track Record"
                action={<CarIcon size={18} className="text-nero-accent" />}
              />

              <div className="space-y-3 my-2">
                <div className="flex items-center justify-between pb-2 border-b border-nero-border/60">
                  <span className="text-xs text-nero-text-muted">License Plate</span>
                  <span className="font-mono text-sm font-bold text-nero-accent">
                    {trajectory.plate_text}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-nero-border/60">
                  <span className="text-xs text-nero-text-muted">Vehicle Class</span>
                  <span className="text-xs font-bold uppercase text-nero-text-primary">
                    {trajectory.vehicle_type}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-nero-border/60">
                  <span className="text-xs text-nero-text-muted">Cameras Visited</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {trajectory.camera_count} nodes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-nero-text-muted">Time Span</span>
                  <span className="text-xs font-mono text-nero-text-secondary">
                    {new Date(trajectory.first_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(trajectory.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Journey Waypoints Panel */}
          <Card className="nero-card flex-1">
            <CardHeader
              title="Camera Visit Sequence"
              subtitle="Ordered Stop Log"
              action={<MapPinIcon size={16} className="text-nero-text-muted" />}
            />

            <div className="space-y-2.5 mt-2 max-h-[340px] overflow-y-auto pr-1">
              {!trajectory || trajectory.waypoints.length === 0 ? (
                <p className="text-xs text-nero-text-muted py-8 text-center">
                  Select a vehicle plate to view camera stops.
                </p>
              ) : (
                trajectory.waypoints.map((wp, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 items-start p-3 rounded-xl bg-nero-bg/70 border border-nero-border hover:border-nero-accent/40 transition-colors"
                  >
                    <div className="h-6 w-6 rounded-full bg-nero-accent/20 border border-nero-accent/40 text-nero-accent font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-nero-text-primary truncate">
                        {wp.camera_name}
                      </h5>
                      <p className="text-[10px] font-mono text-nero-text-muted mt-0.5">
                        {new Date(wp.timestamp).toLocaleString()}
                      </p>
                      {wp.time_since_previous_seconds && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-emerald-400">
                          +{Math.round(wp.time_since_previous_seconds / 60)} mins elapsed from Stop {idx}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
