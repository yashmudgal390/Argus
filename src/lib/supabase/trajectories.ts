// ═══════════════════════════════════════════════════
// Supabase Data Access Layer — Vehicles & Trajectories
// (Per .cursorrules guidelines)
// ═══════════════════════════════════════════════════

import type { Vehicle, Trajectory } from '@/types';
import { supabase, isSupabaseConfigured } from './client';
import { mockVehicles, mockTrajectories } from '@/data/mockTrajectories';

/** Search vehicles by plate substring */
export async function searchVehicles(query: string): Promise<Vehicle[]> {
  const normalized = query.trim().toUpperCase();
  if (!normalized) return mockVehicles;

  if (!isSupabaseConfigured()) {
    return mockVehicles.filter(
      (v) =>
        v.plate_text.toUpperCase().includes(normalized) ||
        v.plate_text.replace(/-/g, '').toUpperCase().includes(normalized)
    );
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .ilike('plate_text', `%${normalized}%`);

  if (error) throw new Error(`Failed to search vehicles: ${error.message}`);
  return data as Vehicle[];
}

/** Fetch vehicle trajectory by plate */
export async function fetchTrajectoryByPlate(plate: string): Promise<Trajectory | null> {
  const normalized = plate.trim().toUpperCase();
  if (!isSupabaseConfigured()) {
    // Find matching mock trajectory
    const key = Object.keys(mockTrajectories).find(
      (k) => k.toUpperCase() === normalized || k.replace(/-/g, '').toUpperCase() === normalized.replace(/-/g, '')
    );
    return key ? mockTrajectories[key] : null;
  }

  const { data, error } = await supabase
    .from('trajectories')
    .select('*')
    .eq('plate_text', normalized)
    .single();

  if (error) return null;
  return data as Trajectory;
}
