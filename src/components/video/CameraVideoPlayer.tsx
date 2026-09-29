// ═══════════════════════════════════════════════════
// CameraVideoPlayer Component
// Pure CCTV Video Feed with robust CORS & CDN video playback
// ═══════════════════════════════════════════════════

import { useRef, useEffect } from 'react';
import type { Camera } from '@/types/camera';
import type { Detection } from '@/types';
import { useDetectionOverlay } from '@/hooks/useDetectionOverlay';
import { useCameraDetections } from '@/hooks/useCameraDetections';

interface CameraVideoPlayerProps {
  camera: Camera;
  detections?: Detection[];
}

const PRIMARY_CDN_FALLBACK = 'https://ngwrbxiaeressvmhfopb.supabase.co/storage/v1/object/public/videos/13052823_3840_2160_30fps.mp4';

/**
 * Determine the streamable video source URL.
 */
function resolveVideoSrc(videoUrl: string): string {
  if (!videoUrl) return PRIMARY_CDN_FALLBACK;
  if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
    return videoUrl;
  }
  return PRIMARY_CDN_FALLBACK;
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

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().catch((err) => {
        console.warn('Autoplay prevented or video play error:', err);
      });
    }
  }, [videoSrc]);

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
          crossOrigin="anonymous"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== PRIMARY_CDN_FALLBACK) {
              console.warn(`Video ${target.src} failed to load. Falling back to CORS-enabled CDN stream.`);
              target.muted = true;
              target.src = PRIMARY_CDN_FALLBACK;
              target.load();
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
