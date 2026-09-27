// ═══════════════════════════════════════════════════
// LiveMapPage — Home page / Main Command Center View
// Ultra-Premium UI with Glassmorphic Panels & Neon Glows
// ═══════════════════════════════════════════════════

import type { Camera } from '@/types/camera';
import { useCameras } from '@/hooks/useCameras';
import { MapView } from '@/components/map/MapView';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  CameraIcon,
  RadioIcon,
  ArrowUpRightIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/** Derive status counts from the live camera array */
function getCameraStatusCounts(cameras: Camera[]) {
  return {
    online: cameras.filter((c) => c.status === 'online').length,
    offline: cameras.filter((c) => c.status === 'offline').length,
    total: cameras.length,
  };
}

// Simulated live detection feed entries
const mockLiveDetections = [
  { id: '1', plate: 'DL-01-AB-1234', camera: 'India Gate Junction', type: 'Car', time: '2s ago', confidence: 96, priority: 'normal' },
  { id: '2', plate: 'HR-26-CD-5678', camera: 'Connaught Place Circle', type: 'Truck', time: '5s ago', confidence: 94, priority: 'alert' },
  { id: '3', plate: 'DL-02-EF-9012', camera: 'AIIMS T-Junction', type: 'Bus', time: '12s ago', confidence: 91, priority: 'normal' },
  { id: '4', plate: 'UP-16-GH-3456', camera: 'Nehru Place Underpass', type: 'Car', time: '18s ago', confidence: 89, priority: 'normal' },
  { id: '5', plate: 'DL-03-IJ-7890', camera: 'Karol Bagh Crossing', type: 'Motorcycle', time: '25s ago', confidence: 88, priority: 'alert' },
  { id: '6', plate: 'RJ-14-KL-2345', camera: 'India Gate Junction', type: 'Car', time: '31s ago', confidence: 97, priority: 'normal' },
  { id: '7', plate: 'DL-04-MN-6789', camera: 'Dwarka Expressway Entry', type: 'Truck', time: '40s ago', confidence: 85, priority: 'normal' },
];

export function LiveMapPage() {
  const navigate = useNavigate();
  const { cameras, loading, error, refetch } = useCameras();

  if (loading) return <LoadingState message="Initializing city-wide intelligence map..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const statusCounts = getCameraStatusCounts(cameras);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-7rem)] gap-5 animate-fade-in">
      {/* Main Map Canvas Area */}
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-nero-border/80 shadow-2xl bg-nero-surface/40 backdrop-blur-md">
        {/* Map Header Floating Overlay Pill */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3 rounded-xl bg-nero-surface/90 backdrop-blur-md border border-nero-border px-4 py-2 shadow-xl">
          <div className="flex h-3 w-3 items-center justify-center">
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-nero-text-primary uppercase tracking-wider">New Delhi Command Sector</h3>
            <p className="text-[10px] font-mono text-nero-text-muted">GPS: 28.6129° N, 77.2295° E • Live Grid</p>
          </div>
        </div>

        {/* Leaflet Map Component */}
        <MapView cameras={cameras} />
      </div>

      {/* Right Command Panels */}
      <div className="flex w-full lg:w-[360px] flex-shrink-0 flex-col gap-5 h-full overflow-y-auto pr-1">
        {/* Camera Status Card */}
        <Card className="nero-card border-nero-border/80">
          <CardHeader
            title="Camera Infrastructure"
            subtitle={`${statusCounts.total} Virtual CCTV Feeds Placed`}
            action={<CameraIcon size={18} className="text-nero-accent" />}
          />

          {/* Status Metrics Counters */}
          <div className="grid grid-cols-2 gap-2.5 my-3">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center">
              <p className="text-xl font-black text-emerald-400">{statusCounts.online}</p>
              <p className="mt-0.5 text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest">Active</p>
            </div>
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-center">
              <p className="text-xl font-black text-rose-400">{statusCounts.offline}</p>
              <p className="mt-0.5 text-[9px] font-bold text-rose-400/80 uppercase tracking-widest">Offline</p>
            </div>
          </div>

          {/* Scrollable camera node list */}
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {cameras.map((cam) => (
              <div
                key={cam.id}
                onClick={() => navigate('/cameras')}
                className="flex items-center justify-between rounded-xl bg-nero-bg/60 border border-nero-border/50 px-3 py-2 transition-all hover:bg-nero-surface-hover hover:border-nero-accent/40 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      cam.status === 'online'
                        ? 'status-dot-online'
                        : 'status-dot-offline'
                    }`}
                  />
                  <span className="text-xs font-semibold text-nero-text-primary group-hover:text-nero-accent transition-colors truncate">
                    {cam.name}
                  </span>
                </div>
                <StatusBadge variant={cam.status} size="sm" />
              </div>
            ))}
          </div>
        </Card>

        {/* Live Activity Ticker Card */}
        <Card className="nero-card border-nero-border/80 flex-1 flex flex-col min-h-0">
          <CardHeader
            title="Real-Time Detections"
            subtitle="ANPR Vehicle Event Stream"
            action={
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5">
                <RadioIcon size={12} className="text-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Stream</span>
              </div>
            }
          />

          <div className="flex-1 space-y-2 overflow-y-auto min-h-0 pr-1 mt-1">
            {mockLiveDetections.map((det) => (
              <div
                key={det.id}
                onClick={() => navigate(`/vehicles?plate=${encodeURIComponent(det.plate)}`)}
                className={`group rounded-xl p-3 border transition-all cursor-pointer ${
                  det.priority === 'alert'
                    ? 'bg-rose-500/10 border-rose-500/40 hover:border-rose-500'
                    : 'bg-nero-bg/70 border-nero-border/70 hover:border-nero-accent/50 hover:bg-nero-surface-hover'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-nero-accent group-hover:text-white transition-colors">
                      {det.plate}
                    </span>
                    {det.priority === 'alert' && (
                      <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold uppercase text-rose-400">
                        Watchlist
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-nero-text-muted">{det.time}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-nero-text-secondary">
                  <span className="truncate max-w-[170px]">{det.camera}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase text-nero-text-muted">{det.type}</span>
                    <span className="rounded bg-nero-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      {det.confidence}%
                    </span>
                    <ArrowUpRightIcon size={12} className="text-nero-text-muted group-hover:text-nero-accent transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
