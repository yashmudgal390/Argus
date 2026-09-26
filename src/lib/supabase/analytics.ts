// ═══════════════════════════════════════════════════
// Supabase Data Access Layer — Traffic Analytics
// (Per .cursorrules guidelines)
// ═══════════════════════════════════════════════════

import type { CongestionMetric, ODPair, CorridorStats } from '@/types';
import { isSupabaseConfigured } from './client';
import { mockCongestionMetrics, mockODPairs, mockCorridors } from '@/data/mockAnalytics';

export async function fetchCongestionMetrics(): Promise<CongestionMetric[]> {
  if (!isSupabaseConfigured()) {
    return mockCongestionMetrics;
  }
  return mockCongestionMetrics;
}

export async function fetchODPairs(): Promise<ODPair[]> {
  if (!isSupabaseConfigured()) {
    return mockODPairs;
  }
  return mockODPairs;
}

export async function fetchCorridors(): Promise<CorridorStats[]> {
  if (!isSupabaseConfigured()) {
    return mockCorridors;
  }
  return mockCorridors;
}
