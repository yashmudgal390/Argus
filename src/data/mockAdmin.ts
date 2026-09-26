// ═══════════════════════════════════════════════════
// Mock Audit Logs & Users Data (Phase 6)
// ═══════════════════════════════════════════════════

import type { AuditLogEntry } from '@/types';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator';
  status: 'active' | 'suspended';
  last_active: string;
}

export const mockUsers: UserAccount[] = [
  { id: 'usr-01', name: 'Command Officer', email: 'admin@nero.city.gov', role: 'admin', status: 'active', last_active: '2 mins ago' },
  { id: 'usr-02', name: 'Operator Alpha', email: 'op1@nero.city.gov', role: 'operator', status: 'active', last_active: '15 mins ago' },
  { id: 'usr-03', name: 'Operator Beta', email: 'op2@nero.city.gov', role: 'operator', status: 'active', last_active: '1 hour ago' },
];

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'aud-001',
    action: 'VEHICLE_SEARCH',
    entity_type: 'vehicle',
    entity_id: 'DL-01-AB-1234',
    user_id: 'usr-01',
    user_email: 'admin@nero.city.gov',
    details: 'Searched multi-camera journey trajectory for plate DL-01-AB-1234',
    timestamp: '2026-09-25T10:15:00Z',
  },
  {
    id: 'aud-002',
    action: 'ALERT_ACKNOWLEDGE',
    entity_type: 'alert',
    entity_id: 'alt-003',
    user_id: 'usr-02',
    user_email: 'op1@nero.city.gov',
    details: 'Acknowledged watchlist alert for plate UP-16-GH-3456 at Connaught Place',
    timestamp: '2026-09-25T08:35:00Z',
  },
  {
    id: 'aud-003',
    action: 'WATCHLIST_ADD',
    entity_type: 'blacklist_entry',
    entity_id: 'bl-002',
    user_id: 'usr-01',
    user_email: 'admin@nero.city.gov',
    details: 'Added critical priority watchlist entry for plate DL-03-IJ-7890 (Armed robbery)',
    timestamp: '2026-09-15T14:30:00Z',
  },
];
