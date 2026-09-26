// ═══════════════════════════════════════════════════
// CameraMarker — Individual camera marker on the map
// Colored by status (green/red/amber) per design.md
// ═══════════════════════════════════════════════════

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { CameraFeed } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface CameraMarkerProps {
  camera: CameraFeed;
  onClick?: (camera: CameraFeed) => void;
}

/** Create a custom circle icon colored by camera status */
function createCameraIcon(status: CameraFeed['status']): L.DivIcon {
  const colorMap = {
    online: '#22c55e',
    offline: '#ef4444',
    maintenance: '#f59e0b',
  };
  const color = colorMap[status];
  const pulseClass = status === 'online' ? 'animation: pulse 2s infinite;' : '';

  return L.divIcon({
    className: 'camera-marker-icon',
    html: `
      <div style="position: relative; width: 32px; height: 32px;">
        <div style="
          position: absolute; inset: 0;
          background: ${color}30;
          border-radius: 50%;
          ${pulseClass}
        "></div>
        <div style="
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 14px; height: 14px;
          background: ${color};
          border: 2.5px solid #000000;
          border-radius: 50%;
          box-shadow: 0 0 8px ${color}80;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export function CameraMarker({ camera, onClick }: CameraMarkerProps) {
  const icon = createCameraIcon(camera.status);

  return (
    <Marker
      position={[camera.lat, camera.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(camera),
      }}
    >
      <Popup>
        <div className="min-w-[180px] space-y-2 p-1">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-nero-text-primary">
              {camera.name}
            </h4>
            <StatusBadge variant={camera.status} />
          </div>
          <div className="space-y-1 text-xs text-nero-text-secondary">
            <p>Code: <span className="font-mono text-nero-text-primary">{camera.code}</span></p>
            <p>Zone: {camera.zone}</p>
            <p>Direction: {camera.direction}</p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
