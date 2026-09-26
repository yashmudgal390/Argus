// ═══════════════════════════════════════════════════
// useDetectionOverlay Hook
// Reusable hook syncing video playback time with canvas bounding boxes
// Strictly mandated by .cursorrules
// ═══════════════════════════════════════════════════

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Detection } from '@/types';

/** Helper to parse timestamp format "MM:SS.mmm" or seconds number */
function parseTimestampToSeconds(ts: string): number {
  if (!ts.includes(':')) return parseFloat(ts) || 0;
  const parts = ts.split(':');
  const minutes = parseFloat(parts[0]) || 0;
  const seconds = parseFloat(parts[1]) || 0;
  return minutes * 60 + seconds;
}

export function useDetectionOverlay(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  detections: Detection[]
) {
  const [activeDetections, setActiveDetections] = useState<Detection[]>([]);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderOverlay = () => {
      if (!video || !canvas || !ctx) return;

      // Sync canvas display size to video actual size
      const rect = video.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      const currentTime = video.currentTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Find detections active near video.currentTime (within a 1.5-second window)
      const currentDets = detections.filter((d) => {
        const detTime = parseTimestampToSeconds(d.timestamp);
        return Math.abs(detTime - currentTime) <= 1.5;
      });

      setActiveDetections(currentDets);

      // Scale coordinates from 640x360 base video resolution to canvas rendered dimensions
      const scaleX = canvas.width / 640;
      const scaleY = canvas.height / 360;

      currentDets.forEach((det) => {
        const { x, y, width, height } = det.bbox;
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;
        const scaledW = width * scaleX;
        const scaledH = height * scaleY;

        // Bounding box styling
        ctx.strokeStyle = '#3b82f6'; // NERO Accent
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
        ctx.shadowBlur = 8;

        // Draw rectangle
        ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);
        ctx.shadowBlur = 0; // Reset shadow

        // Bounding box corner ticks for tech/AI look
        const cornerLen = 8;
        ctx.strokeStyle = '#22c55e'; // Green corner highlight
        ctx.lineWidth = 3;
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(scaledX, scaledY + cornerLen);
        ctx.lineTo(scaledX, scaledY);
        ctx.lineTo(scaledX + cornerLen, scaledY);
        ctx.stroke();

        // Label background tag
        const labelText = `${det.plate_text_raw} (${det.vehicle_type.toUpperCase()}) ${Math.round(det.confidence_score * 100)}%`;
        ctx.font = '600 11px Inter, sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const tagHeight = 20;
        const tagWidth = textMetrics.width + 12;

        ctx.fillStyle = '#111827';
        ctx.fillRect(scaledX, Math.max(0, scaledY - tagHeight - 2), tagWidth, tagHeight);

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.strokeRect(scaledX, Math.max(0, scaledY - tagHeight - 2), tagWidth, tagHeight);

        // Label text
        ctx.fillStyle = '#22c55e';
        ctx.fillText(labelText, scaledX + 6, Math.max(14, scaledY - 7));
      });

      animFrameRef.current = requestAnimationFrame(renderOverlay);
    };

    animFrameRef.current = requestAnimationFrame(renderOverlay);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [videoRef, canvasRef, detections]);

  return { activeDetections };
}
