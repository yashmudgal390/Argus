// ═══════════════════════════════════════════════════
// MapView — Leaflet map wrapper component
// Dark-themed map with camera markers
// ═══════════════════════════════════════════════════

import { MapContainer, TileLayer } from 'react-leaflet';
import type { CameraFeed } from '@/types';
import { CameraMarker } from './CameraMarker';

interface MapViewProps {
  cameras: CameraFeed[];
  onCameraClick?: (camera: CameraFeed) => void;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// Default center: New Delhi
const DEFAULT_CENTER: [number, number] = [28.6100, 77.2000];
const DEFAULT_ZOOM = 12;

export function MapView({
  cameras,
  onCameraClick,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = '',
}: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`h-full w-full rounded-xl ${className}`}
      zoomControl={true}
      attributionControl={true}
    >
      {/* Dark-themed map tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
      />

      {/* Camera markers */}
      {cameras.map((camera) => (
        <CameraMarker
          key={camera.id}
          camera={camera}
          onClick={onCameraClick}
        />
      ))}
    </MapContainer>
  );
}
