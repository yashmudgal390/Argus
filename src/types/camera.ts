// ═══════════════════════════════════════════════════
// Camera Type — matches `cameras` table in Supabase exactly
// ═══════════════════════════════════════════════════

/** Row shape of the `cameras` table in Supabase */
export interface Camera {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  zone: string;
  direction: string;
  status: 'online' | 'offline';
  video_url: string;
  created_at: string;
}
