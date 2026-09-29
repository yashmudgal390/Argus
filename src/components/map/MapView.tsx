// ═══════════════════════════════════════════════════
// MapView — Leaflet map wrapper component
// Dark-themed map with camera markers
// ═══════════════════════════════════════════════════

import { MapContainer, TileLayer } from 'react-leaflet';
import type { Camera } from '@/types/camera';
import { CameraMarker } from './CameraMarker';

interface MapViewProps {
  cameras: Camera[];
  onCameraClick?: (camera: Camera) => void;
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
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
        subdomains="abcd"
        maxZoom={20}
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
