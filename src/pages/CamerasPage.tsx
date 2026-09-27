// ═══════════════════════════════════════════════════
// CamerasPage Component
// Minimal Icon Styling, Clean Camera Cards (No Image Previews),
// Live Video Modal Player on Camera Click
// ═══════════════════════════════════════════════════

import { useState } from 'react';
import type { Camera } from '@/types/camera';
import { useCameras } from '@/hooks/useCameras';
import { mockDetections } from '@/data/mockDetections';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CameraVideoPlayer } from '@/components/video/CameraVideoPlayer';
import { VideoIcon, XIcon, FilterIcon, CameraIcon, PlayIcon } from 'lucide-react';

export function CamerasPage() {
  const { cameras, loading, error, refetch } = useCameras();
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('all');

  if (loading) return <LoadingState message="Connecting to camera feeds..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (cameras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-nero-text-muted">
        <CameraIcon size={48} className="mb-4 opacity-40" />
        <p className="text-sm font-medium">No cameras found</p>
        <p className="text-xs mt-1">Check your Supabase connection or seed the cameras table.</p>
      </div>
    );
  }

  const zones = ['all', ...new Set(cameras.map((c) => c.zone))];
  const filteredCameras = selectedZone === 'all'
    ? cameras
    : cameras.filter((c) => c.zone === selectedZone);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-nero-text-primary">Camera Feeds</h1>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              {cameras.length} Active Feeds
            </span>
          </div>
          <p className="text-xs text-nero-text-muted mt-0.5">
            Click any camera card to launch live video stream with synchronized YOLOv7 detections
          </p>
        </div>

          {/* Zone Selector */}
          <div className="flex items-center gap-2 rounded-lg border border-nero-border bg-nero-surface px-3 py-1.5 text-xs">
            <FilterIcon size={13} className="text-nero-text-muted" />
            <span className="text-nero-text-muted">Zone:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-transparent font-medium text-nero-text-primary focus:outline-none cursor-pointer"
            >
              {zones.map((zone) => (
                <option key={zone} value={zone} className="bg-nero-surface text-nero-text-primary">
                  {zone === 'all' ? 'All Zones' : zone}
                </option>
              ))}
            </select>
          </div>
        </div>


      {/* Expanded Modal Camera Player */}
      {selectedCamera && (
        <div className="rounded-xl border border-nero-accent/50 bg-nero-surface p-5 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-nero-border">
            <div className="flex items-center gap-2.5">
              <VideoIcon size={18} className="text-nero-accent" />
              <div>
                <h2 className="text-sm font-semibold text-nero-text-primary flex items-center gap-2">
                  Live Stream: {selectedCamera.name}
                  <span className="font-mono text-xs text-nero-accent">({selectedCamera.code})</span>
                </h2>
                <p className="text-[11px] text-nero-text-muted">
                  Zone: {selectedCamera.zone} • Direction: {selectedCamera.direction}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCamera(null)}
              className="rounded-lg p-1.5 text-nero-text-muted hover:bg-nero-surface-hover hover:text-white transition-colors"
            >
              <XIcon size={18} />
            </button>
          </div>

          <CameraVideoPlayer
            camera={selectedCamera}
          />
        </div>
      )}

      {/* Camera Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCameras.map((camera) => {
          const detCount = (mockDetections[camera.id] || []).length;
          const isSelected = selectedCamera?.id === camera.id;
          return (
            <Card
              key={camera.id}
              hover
              onClick={() => setSelectedCamera(camera)}
              className={`p-4 cursor-pointer transition-all border ${
                isSelected
                  ? 'border-nero-accent bg-nero-surface-hover ring-1 ring-nero-accent'
                  : 'border-nero-border bg-nero-surface hover:border-nero-border-light'
              }`}
            >
              {/* Header: Status badge + Camera Code */}
              <div className="flex items-center justify-between mb-2">
                <StatusBadge variant={camera.status} size="sm" />
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-nero-surface-elevated text-nero-accent border border-nero-border">
                  {camera.code}
                </span>
              </div>

              {/* Title & Zone */}
              <div className="my-2">
                <h3 className="text-sm font-semibold text-nero-text-primary group-hover:text-nero-accent transition-colors truncate">
                  {camera.name}
                </h3>
                <p className="text-xs text-nero-text-muted mt-0.5">{camera.zone}</p>
              </div>

              {/* Footer: Detections & Stream action button */}
              <div className="mt-3 pt-3 border-t border-nero-border flex items-center justify-between text-xs">
                <span className="text-nero-text-muted flex items-center gap-1.5 text-[11px]">
                  <CameraIcon size={13} className="text-nero-text-muted" />
                  {detCount} detections
                </span>
                <span className="font-medium text-nero-accent flex items-center gap-1 hover:underline">
                  <PlayIcon size={12} fill="currentColor" />
                  Stream &rarr;
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
