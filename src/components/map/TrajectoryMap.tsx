// ═══════════════════════════════════════════════════
// TrajectoryMap Component
// Renders polyline route + numbered stop pins on Leaflet map
// ═══════════════════════════════════════════════════

import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import type { TrajectoryWaypoint } from '@/types';

interface TrajectoryMapProps {
  waypoints: TrajectoryWaypoint[];
  className?: string;
}

/** Custom Leaflet divIcon with numbered stop badge */
function createWaypointIcon(stopNumber: number): L.DivIcon {
  return L.divIcon({
    className: 'trajectory-stop-icon',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        background: #3b82f6;
        color: #ffffff;
        border: 2px solid #000000;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 13px;
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.7);
      ">
        ${stopNumber}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

/** Helper component to auto-fit map bounds around waypoints */
function MapBoundsFitter({ waypoints }: { waypoints: TrajectoryWaypoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (waypoints.length === 0) return;
    const bounds = L.latLngBounds(waypoints.map((w) => [w.lat, w.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [waypoints, map]);

  return null;
}

export function TrajectoryMap({ waypoints, className = '' }: TrajectoryMapProps) {
  if (waypoints.length === 0) return null;

  const positions: [number, number][] = waypoints.map((w) => [w.lat, w.lng]);
  const center: [number, number] = positions[0];

  return (
    <MapContainer
      center={center}
      zoom={12}
      className={`h-full w-full rounded-xl ${className}`}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
      />

      <MapBoundsFitter waypoints={waypoints} />

      {/* Trajectory Polyline */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: '#3b82f6',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
        }}
      />

      {/* Waypoint Stop Markers */}
      {waypoints.map((waypoint, index) => (
        <Marker
          key={`${waypoint.camera_id}-${index}`}
          position={[waypoint.lat, waypoint.lng]}
          icon={createWaypointIcon(index + 1)}
        >
          <Popup>
            <div className="p-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-nero-accent text-white font-bold text-xs flex items-center justify-center">
                  {index + 1}
                </span>
                <h4 className="font-bold text-sm text-nero-text-primary">{waypoint.camera_name}</h4>
              </div>
              <p className="text-xs text-nero-text-muted">
                Time: {new Date(waypoint.timestamp).toLocaleTimeString()}
              </p>
              {waypoint.time_since_previous_seconds && (
                <p className="text-xs text-nero-accent font-medium">
                  +{Math.round(waypoint.time_since_previous_seconds / 60)} mins from previous stop
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
