// ═══════════════════════════════════════════════════
// Supabase Data Access Layer — Cameras
// All camera queries go through here, never direct
// from components
// ═══════════════════════════════════════════════════

import type { Camera } from '@/types/camera';
import type { CameraFeed } from '@/types';
import { supabase, isSupabaseConfigured } from './client';
import { mockCameras } from '@/data/mockCameras';

/**
 * Map a `CameraFeed` (mock data shape) into the canonical `Camera` type.
 * Handles the lat/lng → latitude/longitude rename.
 */
function cameraFeedToCamera(feed: CameraFeed): Camera {
  return {
    id: feed.id,
    name: feed.name,
    code: feed.code,
    latitude: feed.lat,
    longitude: feed.lng,
    zone: feed.zone,
    direction: feed.direction,
    status: feed.status === 'maintenance' ? 'offline' : feed.status,
    video_url: feed.video_url,
    created_at: feed.created_at,
  };
}

/**
 * Map a raw Supabase row into the canonical `Camera` type.
 * The DB columns are `lat` and `lng`; we normalise to `latitude` / `longitude`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCamera(row: any): Camera {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    latitude: row.lat ?? row.latitude,
    longitude: row.lng ?? row.longitude,
    zone: row.zone,
    direction: row.direction,
    status: row.status,
    video_url: row.video_url,
    created_at: row.created_at,
  };
}

/** Fetch all cameras, ordered by code */
export async function getCameras(): Promise<Camera[]> {
  if (!isSupabaseConfigured()) {
    // Fallback to mock data when Supabase isn't set up
    return mockCameras.map(cameraFeedToCamera);
  }

  const { data, error } = await supabase
    .from('cameras')
    .select('*')
    .order('code');

  if (error) {
    throw new Error(`Failed to fetch cameras: ${error.message}`);
  }

  return (data ?? []).map(rowToCamera);
}

/** Fetch a single camera by ID */
export async function getCameraById(id: string): Promise<Camera | null> {
  if (!isSupabaseConfigured()) {
    const found = mockCameras.find((c) => c.id === id);
    return found ? cameraFeedToCamera(found) : null;
  }

  const { data, error } = await supabase
    .from('cameras')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch camera: ${error.message}`);
  }

  return data ? rowToCamera(data) : null;
}

/** Fetch cameras by zone */
export async function getCamerasByZone(zone: string): Promise<Camera[]> {
  if (!isSupabaseConfigured()) {
    return mockCameras
      .filter((c) => c.zone === zone)
      .map(cameraFeedToCamera);
  }

  const { data, error } = await supabase
    .from('cameras')
    .select('*')
    .eq('zone', zone)
    .order('code');

  if (error) {
    throw new Error(`Failed to fetch cameras by zone: ${error.message}`);
  }

  return (data ?? []).map(rowToCamera);
}

// ── Legacy aliases (keep existing callers working) ──

/** @deprecated Use `getCameras` instead */
export const fetchCameras = getCameras;
/** @deprecated Use `getCameraById` instead */
export const fetchCameraById = getCameraById;
/** @deprecated Use `getCamerasByZone` instead */
export const fetchCamerasByZone = getCamerasByZone;
