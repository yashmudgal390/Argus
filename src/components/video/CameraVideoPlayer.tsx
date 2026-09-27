// ═══════════════════════════════════════════════════
// CameraVideoPlayer Component
// Pure CCTV Video Feed — streams video_url from Supabase
// or local public folder. Zero timeline, zero controls.
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

/**
 * Determine the streamable video source URL.
 *
 * Priority:
 * 1. If `video_url` is already a full URL (http/https) — use it directly
 *    (covers Supabase Storage URLs and any other remote source).
 * 2. If it's a relative path (e.g. `/videos/...`) — use as-is (Vite public dir).
 * 3. Fallback to empty string (no video).
 */
function resolveVideoSrc(videoUrl: string): string {
  if (!videoUrl) return '';
  // Full URLs (Supabase Storage, CDN, etc.)
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }
  // Relative paths served by Vite from /public
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
