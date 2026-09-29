// ═══════════════════════════════════════════════════
// Supabase Client — single instance for the entire app
// Reads from VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// ═══════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = Boolean(supabaseUrl && supabaseUrl.startsWith('http'));
const safeUrl = isValidUrl ? supabaseUrl! : 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-key';

if (!isValidUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing or invalid env vars. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are needed for Supabase features.'
  );
}

export const supabase = createClient(safeUrl, safeKey);

/** Check if Supabase is configured (not using placeholder values) */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    isValidUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key'
  );
}
