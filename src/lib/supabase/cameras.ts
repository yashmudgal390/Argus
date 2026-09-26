// ═══════════════════════════════════════════════════
// Supabase Data Access Layer — Cameras
// All camera queries go through here, never direct
// from components (per .cursorrules)
// ═══════════════════════════════════════════════════

import type { CameraFeed } from '@/types';
import { supabase, isSupabaseConfigured } from './client';
import { mockCameras } from '@/data/mockCameras';

/** Fetch all cameras */
export async function fetchCameras(): Promise<CameraFeed[]> {
  if (!isSupabaseConfigured()) {
    // Fallback to mock data when Supabase isn't set up
    return mockCameras;
  }

  const { data, error } = await supabase
    .from('cameras')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch cameras: ${error.message}`);
  return data as CameraFeed[];
}

/** Fetch a single camera by ID */
export async function fetchCameraById(id: string): Promise<CameraFeed | null> {
  if (!isSupabaseConfigured()) {
    return mockCameras.find((c) => c.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from('cameras')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch camera: ${error.message}`);
  return data as CameraFeed;
}

/** Fetch cameras by zone */
export async function fetchCamerasByZone(zone: string): Promise<CameraFeed[]> {
  if (!isSupabaseConfigured()) {
    return mockCameras.filter((c) => c.zone === zone);
  }

  const { data, error } = await supabase
    .from('cameras')
    .select('*')
    .eq('zone', zone)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to fetch cameras by zone: ${error.message}`);
  return data as CameraFeed[];
}
