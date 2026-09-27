// ═══════════════════════════════════════════════════
// Supabase Data Access Layer — Alerts & Watchlist
// (Per .cursorrules guidelines)
// ═══════════════════════════════════════════════════

import type { AlertRecord, BlacklistEntry, AlertPriority, WatchlistCategory } from '@/types';
import { supabase, isSupabaseConfigured } from './client';
import { mockAlerts, mockBlacklistEntries } from '@/data/mockAlerts';

/** Fetch all alerts from Supabase or fallback */
export async function fetchAlerts(): Promise<AlertRecord[]> {
  if (!isSupabaseConfigured()) {
    return mockAlerts;
  }

  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*, detections(*, cameras(*)), blacklist_entries(*)')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      const { data: rawAlerts, error: rawErr } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (rawErr || !rawAlerts) return mockAlerts;

      return rawAlerts.map((a: any) => ({
        id: a.id,
        detection_event_id: a.detection_id || a.id,
        blacklist_entry_id: a.blacklist_entry_id || '',
        plate_text: a.plate_text || 'DL-88-RC-5992',
        camera_id: a.camera_id || 'cam-001',
        camera_name: a.camera_name || 'India Gate Junction',
        priority: (a.priority as AlertPriority) || 'high',
        category: (a.category as WatchlistCategory) || 'stolen',
        reason: a.reason || 'Watchlist threat alert matched by YOLOv7',
        timestamp: a.created_at || new Date().toISOString(),
        lat: a.lat || 28.6129,
        lng: a.lng || 77.2295,
        acknowledged: a.status === 'acknowledged',
      }));
    }

    return data.map((a: any) => {
      const det = a.detections || {};
      const cam = det.cameras || {};
      const bl = a.blacklist_entries || {};
      return {
        id: a.id,
        detection_event_id: a.detection_id || det.event_id || a.id,
        blacklist_entry_id: a.blacklist_entry_id || bl.id || '',
        plate_text: det.plate_text_raw || bl.plate_text_normalized || a.plate_text || 'DL 88 RC 5992',
        camera_id: det.camera_id || 'cam-001',
        camera_name: cam.name || a.camera_name || 'India Gate Junction',
        priority: (bl.priority || a.priority || 'high') as AlertPriority,
        category: (bl.category || a.category || 'stolen') as WatchlistCategory,
        reason: bl.notes || a.reason || 'Stolen vehicle matched by camera ANPR',
        timestamp: a.created_at || det.detected_at || new Date().toISOString(),
        lat: det.latitude || det.lat || 28.6129,
        lng: det.longitude || det.lng || 77.2295,
        acknowledged: a.status === 'acknowledged',
        acknowledged_by: a.acknowledged_by,
        acknowledged_at: a.acknowledged_at,
      };
    });
  } catch (err) {
    console.warn('Alert fetch error, fallback to mock alerts:', err);
    return mockAlerts;
  }
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
      status: 'acknowledged',
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
  return (data || []).map((row: any) => ({
    id: row.id,
    plate_text: row.plate_text || row.plate_text_normalized,
    category: row.category || 'stolen',
    priority: row.priority || 'high',
    reason: row.notes || row.reason || 'Watchlist target',
    valid_from: row.valid_from || row.created_at,
    valid_to: row.valid_to || null,
    is_active: row.is_active ?? true,
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
  })) as BlacklistEntry[];
}
