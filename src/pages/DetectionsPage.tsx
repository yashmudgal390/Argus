// ═══════════════════════════════════════════════════
// DetectionsPage Component (Phase 7 & UI Overhaul)
// Searchable, filterable detections log table with route deep-links
// ═══════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDetections } from '@/data/mockDetections';
import { mockCameras } from '@/data/mockCameras';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ListIcon,
  SearchIcon,
  NavigationIcon,
  FilterIcon,
  DatabaseIcon,
} from 'lucide-react';

export function DetectionsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [cameraFilter, setCameraFilter] = useState<string>('all');

  const allDetections = Object.values(mockDetections).flat();

  const filteredDetections = allDetections.filter((det) => {
    const normSearch = searchQuery.trim().toUpperCase();
    if (normSearch && !det.plate_text_raw.toUpperCase().includes(normSearch)) {
      return false;
    }
    if (vehicleTypeFilter !== 'all' && det.vehicle_type !== vehicleTypeFilter) {
      return false;
    }
    if (cameraFilter !== 'all' && det.camera_id !== cameraFilter) {
      return false;
    }
    return true;
  });

  const getCameraName = (camId: string) => {
    return mockCameras.find((c) => c.id === camId)?.name || camId;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-nero-text-primary">ANPR Detections Event Log</h1>
            <span className="rounded-full bg-nero-accent/15 border border-nero-accent/30 px-3 py-0.5 text-xs font-bold text-nero-accent">
              {allDetections.length} Events Logged
            </span>
          </div>
          <p className="text-xs text-nero-text-muted mt-1">
            Searchable repository of frame-by-frame YOLOv7 vehicle detections
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-nero-border bg-nero-surface/90 px-3 py-1.5">
            <FilterIcon size={14} className="text-nero-text-muted" />
            <select
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-nero-text-primary focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-nero-surface">All Vehicle Types</option>
              <option value="car" className="bg-nero-surface">Car</option>
              <option value="truck" className="bg-nero-surface">Truck</option>
              <option value="bus" className="bg-nero-surface">Bus</option>
              <option value="motorcycle" className="bg-nero-surface">Motorcycle</option>
            </select>
          </div>

          <select
            value={cameraFilter}
            onChange={(e) => setCameraFilter(e.target.value)}
            className="rounded-xl border border-nero-border bg-nero-surface px-3 py-1.5 text-xs font-semibold text-nero-text-primary focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-nero-surface">All Cameras</option>
            {mockCameras.map((cam) => (
              <option key={cam.id} value={cam.id} className="bg-nero-surface">
                {cam.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Input Bar */}
      <Card className="nero-card">
        <div className="relative">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-nero-text-muted" />
          <input
            type="text"
            placeholder="Search by license plate text (e.g. DL-01-AB-1234)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-nero-border bg-nero-bg/80 pl-11 pr-4 py-2.5 text-xs font-mono text-nero-text-primary placeholder:font-sans placeholder:text-nero-text-muted focus:border-nero-accent focus:bg-nero-bg focus:outline-none focus:ring-2 focus:ring-nero-accent/20 transition-all"
          />
        </div>
      </Card>

      {/* Detections Table Card */}
      <Card className="nero-card">
        <CardHeader
          title="Detections Event Stream"
          subtitle={`${filteredDetections.length} of ${allDetections.length} events matching filter`}
          action={<DatabaseIcon size={16} className="text-nero-accent" />}
        />

        {filteredDetections.length === 0 ? (
          <EmptyState
            icon={<ListIcon size={32} />}
            title="No Detections Match Search"
            description="Try altering your search plate text or filter parameters."
          />
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-nero-border text-xs text-nero-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4">Event ID</th>
                  <th className="py-3.5 px-4">Plate Text</th>
                  <th className="py-3.5 px-4">Camera Node</th>
                  <th className="py-3.5 px-4">Vehicle Class</th>
                  <th className="py-3.5 px-4">Confidence</th>
                  <th className="py-3.5 px-4">Video Offset</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nero-border/60 text-xs">
                {filteredDetections.map((det) => (
                  <tr key={det.event_id} className="hover:bg-nero-surface-hover transition-colors">
                    <td className="py-3.5 px-4 font-mono text-nero-text-muted text-[11px]">{det.event_id}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-nero-accent text-sm">
                      {det.plate_text_raw}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-nero-text-primary">
                      {getCameraName(det.camera_id)}
                    </td>
                    <td className="py-3.5 px-4 capitalize font-semibold text-nero-text-secondary">{det.vehicle_type}</td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono font-bold text-emerald-400">
                        {Math.round(det.confidence_score * 100)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-nero-text-muted">{det.timestamp}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/vehicles?plate=${encodeURIComponent(det.plate_text_raw)}`)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-nero-surface-elevated border border-nero-border hover:bg-nero-accent hover:text-nero-bg px-3 py-1.5 text-xs font-bold text-nero-text-secondary transition-all"
                      >
                        <NavigationIcon size={12} />
                        Track Route
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
