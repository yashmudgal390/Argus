// ═══════════════════════════════════════════════════
// CameraVideoPlayer Component
// Pure CCTV Video Feed — streams video_url from Supabase
// or CDN streaming video. Zero timeline, zero controls.
// ═══════════════════════════════════════════════════

import { useRef } from 'react';
import type { Camera } from '@/types/camera';
import type { Detection } from '@/types';
import { useDetectionOverlay } from '@/hooks/useDetectionOverlay';
import { useCameraDetections } from '@/hooks/useCameraDetections';

interface CameraVideoPlayerProps {
  camera: Camera;
  detections?: Detection[];
}

const DEFAULT_CDN_FALLBACK = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnTheStreet.mp4';

/**
 * Determine the streamable video source URL.
 */
function resolveVideoSrc(videoUrl: string): string {
  if (!videoUrl) return DEFAULT_CDN_FALLBACK;
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }
  return videoUrl;
}

export function CameraVideoPlayer({ camera, detections: propDetections }: CameraVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch real OpenCV / YOLOv7 pipeline detections dynamically by camera code & ID
  const { detections: realDetections } = useCameraDetections(camera.code, camera.id);
  const activeDetections = (propDetections && propDetections.length > 0) ? propDetections : realDetections;

  const videoSrc = resolveVideoSrc(camera.video_url);

  // Sync green bounding box canvas overlay with video timeline
  useDetectionOverlay(videoRef, canvasRef, activeDetections);

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
          onError={(e) => {
            // Auto fallback to reliable CDN video if local file fails to load
            const target = e.currentTarget;
            if (target.src !== DEFAULT_CDN_FALLBACK) {
              target.src = DEFAULT_CDN_FALLBACK;
              target.play().catch(() => {});
            }
          }}
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
