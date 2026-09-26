// ═══════════════════════════════════════════════════
// NERO Shared Type Definitions
// Single source of truth for all data shapes
// ═══════════════════════════════════════════════════

/** Camera/feed status */
export type CameraStatus = 'online' | 'offline' | 'maintenance';

/** Vehicle type as detected by YOLOv7 */
export type VehicleType = 'car' | 'truck' | 'bus' | 'motorcycle' | 'unknown';

/** Alert priority levels */
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

/** Watchlist/blacklist category */
export type WatchlistCategory = 'stolen' | 'wanted' | 'missing' | 'flagged' | 'custom';

/** User role */
export type UserRole = 'operator' | 'admin';

// ── Core entities ──────────────────────────────────

/** A virtual camera mapped 1:1 to a pre-downloaded traffic video */
export interface CameraFeed {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  zone: string;
  direction: string;
  status: CameraStatus;
  video_url: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

/** A single vehicle detection event from precomputed YOLOv7 output */
export interface Detection {
  event_id: string;
  camera_id: string;
  plate_text_raw: string;
  plate_text_normalized: string;
  confidence_score: number;
  vehicle_type: VehicleType;
  timestamp: string;
  lat: number;
  lng: number;
  bbox: BoundingBox;
  image_ref?: string;
}

/** Bounding box coordinates for detection overlay */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Aggregated vehicle view (derived from detections) */
export interface Vehicle {
  plate_text: string;
  vehicle_type: VehicleType;
  first_seen: string;
  last_seen: string;
  detection_count: number;
  camera_count: number;
}

/** Reconstructed journey of a vehicle across cameras */
export interface Trajectory {
  id: string;
  plate_text: string;
  vehicle_type: VehicleType;
  waypoints: TrajectoryWaypoint[];
  total_travel_time_seconds: number;
  camera_count: number;
  first_seen: string;
  last_seen: string;
}

/** A single stop in a vehicle's trajectory */
export interface TrajectoryWaypoint {
  camera_id: string;
  camera_name: string;
  lat: number;
  lng: number;
  timestamp: string;
  time_since_previous_seconds: number | null;
}

/** A watchlist/blacklist entry */
export interface BlacklistEntry {
  id: string;
  plate_text: string;
  category: WatchlistCategory;
  priority: AlertPriority;
  reason: string;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** An alert generated when a detection matches a blacklist entry */
export interface AlertRecord {
  id: string;
  detection_event_id: string;
  blacklist_entry_id: string;
  plate_text: string;
  camera_id: string;
  camera_name: string;
  priority: AlertPriority;
  category: WatchlistCategory;
  reason: string;
  timestamp: string;
  lat: number;
  lng: number;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

/** An audit log entry */
export interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_email: string;
  details: string;
  timestamp: string;
}

/** Congestion metric for a zone-time bucket */
export interface CongestionMetric {
  zone: string;
  time_bucket: string;
  detection_count: number;
  avg_speed?: number;
  congestion_level: 'low' | 'medium' | 'high';
}

/** Origin-Destination pair */
export interface ODPair {
  origin_zone: string;
  destination_zone: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  trip_count: number;
  avg_travel_time_seconds: number;
}

/** Corridor stats */
export interface CorridorStats {
  id: string;
  name: string;
  from_zone: string;
  to_zone: string;
  trajectory_count: number;
  avg_travel_time_seconds: number;
  peak_hour: string;
  peak_count: number;
}

// ── UI / Navigation ────────────────────────────────

/** Navigation route definition */
export interface NavRoute {
  path: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}
