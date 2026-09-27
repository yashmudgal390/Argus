// ═══════════════════════════════════════════════════
// useCameras Hook — single source of truth for camera data
// Both Camera Grid and Leaflet Map consume this hook.
// ═══════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import type { Camera } from '@/types/camera';
import { getCameras } from '@/lib/supabase/cameras';

interface UseCamerasReturn {
  cameras: Camera[];
  loading: boolean;
  error: string | null;
  /** Manually re-fetch cameras (e.g. after a retry) */
  refetch: () => void;
}

/**
 * Fetches cameras from Supabase on mount and exposes loading / error states.
 * This must be the **only** place cameras are fetched — components should
 * never call `getCameras()` directly.
 */
export function useCameras(): UseCamerasReturn {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCameras();
      setCameras(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cameras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { cameras, loading, error, refetch: fetchData };
}
