// ═══════════════════════════════════════════════════
// Supabase Data Access Layer — Barrel export
// ═══════════════════════════════════════════════════

export { supabase, isSupabaseConfigured } from './client';
export { fetchCameras, fetchCameraById, fetchCamerasByZone } from './cameras';
export { searchVehicles, fetchTrajectoryByPlate } from './trajectories';
export { fetchAlerts, acknowledgeAlert, fetchBlacklistEntries } from './alerts';
export { fetchCongestionMetrics, fetchODPairs, fetchCorridors } from './analytics';
