// ═══════════════════════════════════════════════════
// Supabase Data Access Layer — Vehicles & Trajectories
// (Per .cursorrules guidelines)
// ═══════════════════════════════════════════════════

import type { Vehicle, Trajectory } from '@/types';
import { supabase, isSupabaseConfigured } from './client';
import { mockVehicles, mockTrajectories } from '@/data/mockTrajectories';

/** Search vehicles by plate substring or list recent vehicles */
export async function searchVehicles(query: string = ''): Promise<Vehicle[]> {
  const normalized = query.trim().toUpperCase();

  if (!isSupabaseConfigured()) {
    if (!normalized) return mockVehicles;
    return mockVehicles.filter(
      (v) =>
        v.plate_text.toUpperCase().includes(normalized) ||
        v.plate_text.replace(/-/g, '').toUpperCase().includes(normalized)
    );
  }

  try {
    let dbQuery = supabase.from('vehicles').select('*');
    if (normalized) {
      dbQuery = dbQuery.ilike('plate_text', `%${normalized}%`);
    } else {
      dbQuery = dbQuery.order('last_seen', { ascending: false }).limit(100);
    }

    const { data, error } = await dbQuery;

    if (error || !data) {
      console.warn('DB vehicles query error, fallback to mockVehicles:', error);
      return mockVehicles;
    }

    return data.map((row: any) => ({
      plate_text: row.plate_text || row.plate || 'UNKNOWN',
      vehicle_type: row.vehicle_type || 'car',
      first_seen: row.first_seen || new Date().toISOString(),
      last_seen: row.last_seen || new Date().toISOString(),
      detection_count: row.detection_count ?? 1,
      camera_count: row.camera_count ?? 1,
    })) as Vehicle[];
  } catch (err) {
    console.warn('Failed to query vehicles view:', err);
    return mockVehicles;
  }
}

/** Fetch vehicle trajectory by plate */
export async function fetchTrajectoryByPlate(plate: string): Promise<Trajectory | null> {
  const normalized = plate.trim().toUpperCase();
  if (!isSupabaseConfigured()) {
    const key = Object.keys(mockTrajectories).find(
      (k) => k.toUpperCase() === normalized || k.replace(/-/g, '').toUpperCase() === normalized.replace(/-/g, '')
    );
    return key ? mockTrajectories[key] : null;
  }

  try {
    const { data, error } = await supabase
      .from('trajectories')
      .select('*')
      .eq('plate_text', normalized)
      .maybeSingle();

    if (error || !data) {
      // Build dynamic trajectory from detections table if trajectories view is empty
      const { data: dets } = await supabase
        .from('detections')
        .select('*, cameras(name, code, latitude, longitude)')
        .eq('plate_text_normalized', normalized.replace(/[\s-]/g, ''))
        .order('detected_at', { ascending: true });

      if (!dets || dets.length === 0) {
        const key = Object.keys(mockTrajectories).find(
          (k) => k.toUpperCase() === normalized || k.replace(/-/g, '').toUpperCase() === normalized.replace(/-/g, '')
        );
        return key ? mockTrajectories[key] : null;
      }

      const waypoints = dets.map((d: any, idx: number) => {
        const cam = d.cameras || {};
        const prevTs = idx > 0 ? new Date(dets[idx - 1].detected_at).getTime() : null;
        const curTs = new Date(d.detected_at).getTime();
        const diffSec = prevTs ? Math.round((curTs - prevTs) / 1000) : null;

        return {
          camera_id: d.camera_id,
          camera_name: cam.name || 'CCTV Node',
          lat: d.latitude || d.lat || 28.6129,
          lng: d.longitude || d.lng || 77.2295,
          timestamp: d.detected_at,
          time_since_previous_seconds: diffSec,
        };
      });

      const firstTime = new Date(dets[0].detected_at).getTime();
      const lastTime = new Date(dets[dets.length - 1].detected_at).getTime();
      const totalSec = Math.max(0, Math.round((lastTime - firstTime) / 1000));
      const uniqueCams = new Set(dets.map((d: any) => d.camera_id)).size;

      return {
        id: `traj-${normalized}`,
        plate_text: dets[0].plate_text_raw || normalized,
        vehicle_type: dets[0].vehicle_type || 'car',
        waypoints,
        total_travel_time_seconds: totalSec,
        camera_count: uniqueCams,
        first_seen: dets[0].detected_at,
        last_seen: dets[dets.length - 1].detected_at,
      };
    }

    return data as Trajectory;
  } catch (err) {
    console.warn('Error fetching trajectory:', err);
    return null;
  }
}
