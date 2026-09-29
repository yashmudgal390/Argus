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
        attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
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
