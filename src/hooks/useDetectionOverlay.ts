// ═══════════════════════════════════════════════════
// useDetectionOverlay Hook
// Reusable hook syncing video playback time with canvas bounding boxes
// Strictly mandated by .cursorrules
// ═══════════════════════════════════════════════════

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { Detection } from '@/types';

/** Helper to parse timestamp format "MM:SS.mmm" or seconds number */
function parseTimestampToSeconds(ts: any, frameTsSec?: number): number {
  if (typeof frameTsSec === 'number' && !isNaN(frameTsSec)) return frameTsSec;
  if (typeof ts === 'number') return ts;
  if (!ts || typeof ts !== 'string') return 0;
  if (!ts.includes(':')) {
    const val = parseFloat(ts);
    return isNaN(val) ? 0 : val;
  }
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

      // Sync canvas display size to video actual rendered size
      const rect = video.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      const currentTime = video.currentTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!detections || detections.length === 0) {
        animFrameRef.current = requestAnimationFrame(renderOverlay);
        return;
      }

      // 1. Filter candidates within 0.20s window & exclude frame boundary artifacts
      const candidateDets = detections.filter((d) => {
        const vType = (d.vehicle_type || '').toLowerCase();
        const { x, y, width, height } = d.bbox;

        // Filter out pedestrians / non-vehicles
        if (vType === 'person' || vType === 'pedestrian' || vType === 'unknown') return false;

        // Require at least 80% detection confidence to eliminate false edge detections
        if (d.confidence_score < 0.80) return false;

        // Filter out full-frame / screen-spanning boundary boxes (e.g. 0,0 640x360 covering video)
        if (width >= 520 || height >= 290) return false;

        // Filter out edge boundary artifacts clipped at outer frame margins
        if ((x <= 3 && width >= 630) || (y <= 3 && height >= 350)) return false;

        // Filter out tiny background noise boxes (< 25px)
        if (width < 25 || height < 25) return false;

        const detTime = parseTimestampToSeconds(d.timestamp, (d as any).frame_timestamp_sec);
        return Math.abs(detTime - currentTime) <= 0.20;
      });

      // 2. Deduplicate: For each tracked vehicle, pick ONLY the single closest frame detection
      const bestByVehicle = new Map<string, { det: Detection; diff: number }>();

      candidateDets.forEach((d) => {
        const detTime = parseTimestampToSeconds(d.timestamp, (d as any).frame_timestamp_sec);
        const diff = Math.abs(detTime - currentTime);
        const vehicleKey = (d as any).tracked_vehicle_id || d.event_id;

        const existing = bestByVehicle.get(vehicleKey);
        if (!existing || diff < existing.diff) {
          bestByVehicle.set(vehicleKey, { det: d, diff });
        }
      });

      // 3. Sort by confidence and pick top 15 clearest vehicle detections for a clean overlay
      const currentDets = Array.from(bestByVehicle.values())
        .map((v) => v.det)
        .sort((a, b) => b.confidence_score - a.confidence_score)
        .slice(0, 15);

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

        // Bounding box styling - Electric Emerald Green
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(34, 197, 94, 0.7)';
        ctx.shadowBlur = 10;

        // Draw green bounding rectangle
        ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);
        ctx.shadowBlur = 0; // Reset shadow

        // Bounding box corner ticks for high-tech AI tracking aesthetic
        const cornerLen = 10;
        ctx.strokeStyle = '#4ade80'; // Bright neon green corner highlight
        ctx.lineWidth = 3.5;

        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(scaledX, scaledY + cornerLen);
        ctx.lineTo(scaledX, scaledY);
        ctx.lineTo(scaledX + cornerLen, scaledY);
        ctx.stroke();

        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(scaledX + scaledW - cornerLen, scaledY);
        ctx.lineTo(scaledX + scaledW, scaledY);
        ctx.lineTo(scaledX + scaledW, scaledY + cornerLen);
        ctx.stroke();

        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(scaledX, scaledY + scaledH - cornerLen);
        ctx.lineTo(scaledX, scaledY + scaledH);
        ctx.lineTo(scaledX + cornerLen, scaledY + scaledH);
        ctx.stroke();

        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(scaledX + scaledW - cornerLen, scaledY + scaledH);
        ctx.lineTo(scaledX + scaledW, scaledY + scaledH);
        ctx.lineTo(scaledX + scaledW, scaledY + scaledH - cornerLen);
        ctx.stroke();

        // Label header tag
        const trackedIdStr = (det as any).tracked_vehicle_id ? `[#${(det as any).tracked_vehicle_id}] ` : '';
        const labelText = `${trackedIdStr}${det.plate_text_raw} (${det.vehicle_type.toUpperCase()}) ${Math.round(det.confidence_score * 100)}%`;
        ctx.font = '600 11px Inter, sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const tagHeight = 20;
        const tagWidth = textMetrics.width + 12;

        ctx.fillStyle = '#064e3b'; // Dark emerald tag background
        ctx.fillRect(scaledX, Math.max(0, scaledY - tagHeight - 2), tagWidth, tagHeight);

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(scaledX, Math.max(0, scaledY - tagHeight - 2), tagWidth, tagHeight);

        // Label text in bright neon green
        ctx.fillStyle = '#4ade80';
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
