-- ===================================================
-- NERO Database Schema Initialization Migration
-- Database: Supabase PostgreSQL + PostGIS (Optional)
-- Architecture reference: architecture.md §2.2
-- ===================================================

-- 1. Cameras table
CREATE TABLE IF NOT EXISTS public.cameras (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(32) NOT NULL UNIQUE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  zone VARCHAR(128) NOT NULL,
  direction VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'online',
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Detections table
CREATE TABLE IF NOT EXISTS public.detections (
  event_id VARCHAR(64) PRIMARY KEY,
  camera_id VARCHAR(64) NOT NULL REFERENCES public.cameras(id) ON DELETE CASCADE,
  plate_text_raw VARCHAR(32) NOT NULL,
  plate_text_normalized VARCHAR(32) NOT NULL,
  confidence_score FLOAT NOT NULL,
  vehicle_type VARCHAR(32) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  bbox JSONB NOT NULL,
  image_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detections_plate ON public.detections(plate_text_normalized);
CREATE INDEX IF NOT EXISTS idx_detections_camera ON public.detections(camera_id);
CREATE INDEX IF NOT EXISTS idx_detections_timestamp ON public.detections(timestamp);

-- 3. Blacklist entries table (Watchlist)
CREATE TABLE IF NOT EXISTS public.blacklist_entries (
  id VARCHAR(64) PRIMARY KEY,
  plate_text VARCHAR(32) NOT NULL UNIQUE,
  category VARCHAR(32) NOT NULL,
  priority VARCHAR(32) NOT NULL,
  reason TEXT NOT NULL,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_to TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id VARCHAR(64) PRIMARY KEY,
  detection_event_id VARCHAR(64) REFERENCES public.detections(event_id),
  blacklist_entry_id VARCHAR(64) REFERENCES public.blacklist_entries(id),
  plate_text VARCHAR(32) NOT NULL,
  camera_id VARCHAR(64) NOT NULL REFERENCES public.cameras(id),
  camera_name VARCHAR(255) NOT NULL,
  priority VARCHAR(32) NOT NULL,
  category VARCHAR(32) NOT NULL,
  reason TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by VARCHAR(128),
  acknowledged_at TIMESTAMPTZ
);

-- 5. Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  user_email VARCHAR(128) NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Vehicles view (Aggregated per distinct plate)
CREATE OR REPLACE VIEW public.vehicles AS
SELECT
  plate_text_raw AS plate_text,
  vehicle_type,
  MIN(timestamp) AS first_seen,
  MAX(timestamp) AS last_seen,
  COUNT(*) AS detection_count,
  COUNT(DISTINCT camera_id) AS camera_count
FROM public.detections
GROUP BY plate_text_raw, vehicle_type;

-- Seed Cameras
INSERT INTO public.cameras (id, name, code, lat, lng, zone, direction, status, video_url)
VALUES
  ('cam-001', 'India Gate Junction', 'IG-01', 28.6129, 77.2295, 'Central Delhi', 'North', 'online', '/videos/cam_001.mp4'),
  ('cam-002', 'Connaught Place Circle', 'CP-01', 28.6315, 77.2167, 'Central Delhi', 'East', 'online', '/videos/cam_002.mp4'),
  ('cam-003', 'Karol Bagh Crossing', 'KB-01', 28.6519, 77.1905, 'West Delhi', 'South', 'online', '/videos/cam_003.mp4'),
  ('cam-004', 'Lajpat Nagar Flyover', 'LN-01', 28.5700, 77.2373, 'South Delhi', 'West', 'offline', '/videos/cam_004.mp4'),
  ('cam-005', 'AIIMS T-Junction', 'AI-01', 28.5672, 77.2100, 'South Delhi', 'North', 'online', '/videos/cam_005.mp4')
ON CONFLICT (id) DO NOTHING;
