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

const SUPABASE_STORAGE_BASE = 'https://ngwrbxiaeressvmhfopb.supabase.co/storage/v1/object/public/videos/';

const CODE_TO_FILENAME: Record<string, string> = {
  'IG-01': '13052823_3840_2160_30fps.mp4',
  'CP-01': '13067896_3840_2160_30fps.mp4',
  'KB-01': '13105470_3840_2160_30fps.mp4',
  'LN-01': '13172888_3840_2160_30fps.mp4',
  'AI-01': '13269027_3840_2160_30fps.mp4',
  'NP-01': '13269676_3840_2160_30fps.mp4',
  'CC-01': '13270133_3840_2160_30fps.mp4',
  'DW-01': '13105476_3840_2160_30fps.mp4',
  'DK-01': '13268898_3840_2160_30fps.mp4',
};

function resolveSupabaseVideoUrl(url: string, code?: string): string {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }
  if (code && CODE_TO_FILENAME[code]) {
    return `${SUPABASE_STORAGE_BASE}${CODE_TO_FILENAME[code]}`;
  }
  return `${SUPABASE_STORAGE_BASE}13052823_3840_2160_30fps.mp4`;
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
    video_url: resolveSupabaseVideoUrl(row.video_url, row.code),
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
