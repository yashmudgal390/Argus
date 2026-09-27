// ═══════════════════════════════════════════════════
// CameraMarker — Individual camera marker on the map
// Colored by status (green/red) per design.md
// Popup includes "View feed" button that navigates to /cameras
// ═══════════════════════════════════════════════════

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Camera } from '@/types/camera';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';

interface CameraMarkerProps {
  camera: Camera;
  onClick?: (camera: Camera) => void;
}

/** Create a custom circle icon colored by camera status */
function createCameraIcon(status: Camera['status']): L.DivIcon {
  const colorMap: Record<Camera['status'], string> = {
    online: '#22c55e',
    offline: '#ef4444',
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
  const navigate = useNavigate();

  return (
    <Marker
      position={[camera.latitude, camera.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(camera),
      }}
    >
      <Popup>
        <div className="min-w-[200px] space-y-2.5 p-1">
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate('/cameras');
            }}
            className="w-full mt-1 rounded-lg bg-nero-accent/20 border border-nero-accent/40 px-3 py-1.5 text-xs font-semibold text-nero-accent hover:bg-nero-accent/30 transition-colors"
          >
            ▶ View feed
          </button>
        </div>
      </Popup>
    </Marker>
  );
}
