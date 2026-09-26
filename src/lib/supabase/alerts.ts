// ═══════════════════════════════════════════════════
// Supabase Data Access Layer — Alerts & Watchlist
// (Per .cursorrules guidelines)
// ═══════════════════════════════════════════════════

import type { AlertRecord, BlacklistEntry } from '@/types';
import { supabase, isSupabaseConfigured } from './client';
import { mockAlerts, mockBlacklistEntries } from '@/data/mockAlerts';

/** Fetch all alerts */
export async function fetchAlerts(): Promise<AlertRecord[]> {
  if (!isSupabaseConfigured()) {
    return mockAlerts;
  }

  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw new Error(`Failed to fetch alerts: ${error.message}`);
  return data as AlertRecord[];
}

/** Acknowledge an alert */
export async function acknowledgeAlert(alertId: string, operatorName: string = 'Admin'): Promise<void> {
  if (!isSupabaseConfigured()) {
    const alert = mockAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledged_by = operatorName;
      alert.acknowledged_at = new Date().toISOString();
    }
    return;
  }

  const { error } = await supabase
    .from('alerts')
    .update({
      acknowledged: true,
      acknowledged_by: operatorName,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (error) throw new Error(`Failed to acknowledge alert: ${error.message}`);
}

/** Fetch all blacklist/watchlist entries */
export async function fetchBlacklistEntries(): Promise<BlacklistEntry[]> {
  if (!isSupabaseConfigured()) {
    return mockBlacklistEntries;
  }

  const { data, error } = await supabase
    .from('blacklist_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch blacklist entries: ${error.message}`);
  return data as BlacklistEntry[];
}
