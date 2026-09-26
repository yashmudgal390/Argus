// ═══════════════════════════════════════════════════
// CameraVideoPlayer Component
// Pure CCTV Video Feed — 100% Cropped Google Drive Controls Bar
// Zero timeline, zero volume, zero speed, zero controls
// ═══════════════════════════════════════════════════

import { useRef } from 'react';
import type { CameraFeed, Detection } from '@/types';
import { useDetectionOverlay } from '@/hooks/useDetectionOverlay';
import { getDirectVideoUrl } from '@/utils/urlUtils';

interface CameraVideoPlayerProps {
  camera: CameraFeed;
  detections: Detection[];
  onUpdateVideoUrl?: (newUrl: string) => void;
}

export function CameraVideoPlayer({ camera, detections }: CameraVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine if video is stored locally in public folder
  const isPublic = typeof camera.video_url === 'string' && camera.video_url.startsWith('/videos/');
  const videoSrc = isPublic ? camera.video_url : getDirectVideoUrl(camera.video_url || '', camera.id);

  // Sync bounding box canvas overlay
  useDetectionOverlay(videoRef, canvasRef, detections);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {/* Video Container — Fullscreen video without controls, looping */}
      <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-black flex items-center justify-center shadow-2xl">
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
        {/* Detection overlay canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none w-full h-full z-10"
        />
      </div>

      {/* Camera Footer */}
      <div className="w-full flex items-center justify-between mt-3 text-xs text-nero-text-muted">
        <span className="font-semibold text-nero-text-primary">{camera.name} ({camera.code})</span>
        <span>Zone: {camera.zone} • Direction: {camera.direction}</span>
      </div>
    </div>
  );
}
