// ═══════════════════════════════════════════════════
// useCameraDetections Hook
// Loads real OpenCV / YOLOv7 pipeline detection data for a camera
// Priority: 1. Supabase Postgres database  2. Local JSON files
// ═══════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import type { Detection } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const CODE_ALIAS_MAP: Record<string, string> = {
  'CAM-A': 'IG-01',
  'CAM-B': 'CP-01',
  'CAM-C': 'KB-01',
  'CAM-D': 'DW-01',
  'CAM-E': 'LN-01',
  'CAM-F': 'DK-01',
  'CAM-G': 'AI-01',
  'CAM-H': 'NP-01',
  'CAM-I': 'CC-01',
};

export function useCameraDetections(cameraCode?: string, cameraId?: string) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cameraCode && !cameraId) {
      setDetections([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadData() {
      // 1. Try loading from Supabase DB first if configured
      if (isSupabaseConfigured() && cameraId) {
        try {
          const { data, error: dbErr } = await supabase
            .from('detections')
            .select('*')
            .eq('camera_id', cameraId);

          if (!dbErr && data && data.length > 0) {
            if (!isMounted) return;
            const mapped: Detection[] = data.map((item: any) => ({
              event_id: item.event_id || `det-${item.id}`,
              camera_id: item.camera_id,
              tracked_vehicle_id: item.tracked_vehicle_id,
              plate_text_raw: item.plate_text_raw || 'UNKNOWN',
              plate_text_normalized: item.plate_text_normalized || '',
              confidence_score: item.confidence_score ?? 0.85,
              vehicle_type: item.vehicle_type || 'car',
              timestamp: item.frame_timestamp_sec ?? 0,
              frame_timestamp_sec: item.frame_timestamp_sec ?? 0,
              bbox: typeof item.bbox === 'string' ? JSON.parse(item.bbox) : (item.bbox || { x: 0, y: 0, width: 0, height: 0 }),
            }));
            setDetections(mapped);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Supabase detection fetch failed, falling back to local JSON:', err);
        }
      }

      // 2. Fallback to local public JSON files
      const effectiveCode = CODE_ALIAS_MAP[cameraCode || ''] || cameraCode || 'IG-01';
      fetch(`/detections/detections_${effectiveCode}.json`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.json();
        })
        .then((data: any[]) => {
          if (!isMounted) return;
          const mapped: Detection[] = data.map((item, idx) => ({
            event_id: `det-${effectiveCode}-${idx}`,
            camera_id: cameraCode || effectiveCode,
            tracked_vehicle_id: item.tracked_vehicle_id,
            plate_text_raw: item.plate_text,
            plate_text_normalized: item.plate_text ? item.plate_text.replace(/\s+/g, '') : '',
            confidence_score: item.confidence ?? 0.85,
            vehicle_type: item.vehicle_type || 'car',
            timestamp: item.frame_timestamp_sec ?? 0,
            frame_timestamp_sec: item.frame_timestamp_sec ?? 0,
            bbox: {
              x: item.bbox?.x ?? 0,
              y: item.bbox?.y ?? 0,
              width: item.bbox?.width ?? 0,
              height: item.bbox?.height ?? 0,
            },
          }));
          setDetections(mapped);
        })
        .catch((err) => {
          console.warn(`Could not load detections for camera ${effectiveCode}:`, err);
          if (isMounted) {
            setError(err.message);
            setDetections([]);
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [cameraCode, cameraId]);

  return { detections, loading, error };
}
