// ═══════════════════════════════════════════════════
// Supabase Data Access Layer — Cameras
// All camera queries go through here, never direct
// from components
// ═══════════════════════════════════════════════════

import type { Camera } from '@/types/camera';
import type { CameraFeed } from '@/types';
import { supabase, isSupabaseConfigured } from './client';
import { mockCameras } from '@/data/mockCameras';

export const SUPABASE_STORAGE_BASE = 'https://ngwrbxiaeressvmhfopb.supabase.co/storage/v1/object/public/videos/';

export const CAMERA_VIDEOS: { code: string; aliases: string[]; filename: string }[] = [
  { code: 'IG-01', aliases: ['cam-001', 'cam_001', 'ig-01', 'cam-a'], filename: '13052823_3840_2160_30fps.mp4' },
  { code: 'CP-01', aliases: ['cam-002', 'cam_002', 'cp-01', 'cam-b'], filename: '13067896_3840_2160_30fps.mp4' },
  { code: 'KB-01', aliases: ['cam-003', 'cam_003', 'kb-01', 'cam-c'], filename: '13105470_3840_2160_30fps.mp4' },
  { code: 'LN-01', aliases: ['cam-004', 'cam_004', 'ln-01', 'cam-d'], filename: '13172888_3840_2160_30fps.mp4' },
  { code: 'AI-01', aliases: ['cam-005', 'cam_005', 'ai-01', 'cam-e'], filename: '13269027_3840_2160_30fps.mp4' },
  { code: 'NP-01', aliases: ['cam-006', 'cam_006', 'np-01', 'cam-f'], filename: '13269676_3840_2160_30fps.mp4' },
  { code: 'CC-01', aliases: ['cam-007', 'cam_007', 'cc-01', 'cam-g'], filename: '13270133_3840_2160_30fps.mp4' },
  { code: 'DW-01', aliases: ['cam-008', 'cam_008', 'dw-01', 'cam-h'], filename: '13105476_3840_2160_30fps.mp4' },
  { code: 'DK-01', aliases: ['cam-009', 'cam_009', 'dk-01', 'cam-i'], filename: '13268898_3840_2160_30fps.mp4' },
];

export function resolveSupabaseVideoUrl(url?: string, code?: string, id?: string): string {
  // 1. If it's already a full HTTP/HTTPS URL pointing to Supabase Storage or external storage, use it directly!
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    return url;
  }

  // 2. If url contains one of our 9 filenames, construct the full Supabase Storage URL
  for (const item of CAMERA_VIDEOS) {
    if (url && url.includes(item.filename)) {
      return `${SUPABASE_STORAGE_BASE}${item.filename}`;
    }
  }

  // 3. Match by code or id
  const targetCode = (code || '').toLowerCase();
  const targetId = (id || '').toLowerCase();

  for (const item of CAMERA_VIDEOS) {
    if (
      item.code.toLowerCase() === targetCode ||
      item.aliases.includes(targetCode) ||
      item.aliases.includes(targetId)
    ) {
      return `${SUPABASE_STORAGE_BASE}${item.filename}`;
    }
  }

  // 4. Deterministic hash/index fallback if unknown code so different cameras never get the same video
  const seedStr = (code || id || url || 'default');
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
  }
  const idx = Math.abs(hash) % CAMERA_VIDEOS.length;
  return `${SUPABASE_STORAGE_BASE}${CAMERA_VIDEOS[idx].filename}`;
}

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
    video_url: resolveSupabaseVideoUrl(feed.video_url, feed.code, feed.id),
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
    video_url: resolveSupabaseVideoUrl(row.video_url, row.code, row.id),
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
