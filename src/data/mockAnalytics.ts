// ═══════════════════════════════════════════════════
// Mock Analytics Data (Phase 5)
// Congestion metrics, OD pairs, and Corridor stats
// ═══════════════════════════════════════════════════

import type { CongestionMetric, ODPair, CorridorStats } from '@/types';

export const mockCongestionMetrics: CongestionMetric[] = [
  { zone: 'Central Delhi', time_bucket: '08:00 - 09:00', detection_count: 1420, avg_speed: 18, congestion_level: 'high' },
  { zone: 'South Delhi', time_bucket: '08:00 - 09:00', detection_count: 1180, avg_speed: 24, congestion_level: 'medium' },
  { zone: 'West Delhi', time_bucket: '08:00 - 09:00', detection_count: 890, avg_speed: 32, congestion_level: 'low' },
  { zone: 'Old Delhi', time_bucket: '08:00 - 09:00', detection_count: 1650, avg_speed: 12, congestion_level: 'high' },
];

export const mockODPairs: ODPair[] = [
  {
    origin_zone: 'Central Delhi',
    destination_zone: 'South Delhi',
    origin_lat: 28.6129,
    origin_lng: 77.2295,
    destination_lat: 28.5672,
    destination_lng: 77.2100,
    trip_count: 480,
    avg_travel_time_seconds: 1440, // 24 mins
  },
  {
    origin_zone: 'West Delhi',
    destination_zone: 'Central Delhi',
    origin_lat: 28.6519,
    origin_lng: 77.1905,
    destination_lat: 28.6315,
    destination_lng: 77.2167,
    trip_count: 360,
    avg_travel_time_seconds: 1080, // 18 mins
  },
  {
    origin_zone: 'South Delhi',
    destination_zone: 'Old Delhi',
    origin_lat: 28.5494,
    origin_lng: 77.2530,
    destination_lat: 28.6506,
    destination_lng: 77.2302,
    trip_count: 290,
    avg_travel_time_seconds: 2100, // 35 mins
  },
];

export const mockCorridors: CorridorStats[] = [
  {
    id: 'corr-01',
    name: 'India Gate ↔ Connaught Place Express',
    from_zone: 'Central Delhi',
    to_zone: 'Central Delhi',
    trajectory_count: 640,
    avg_travel_time_seconds: 900, // 15 mins
    peak_hour: '08:30 AM - 09:30 AM',
    peak_count: 210,
  },
  {
    id: 'corr-02',
    name: 'Ring Road South Corridor (AIIMS ↔ Lajpat Nagar)',
    from_zone: 'South Delhi',
    to_zone: 'South Delhi',
    trajectory_count: 510,
    avg_travel_time_seconds: 1140, // 19 mins
    peak_hour: '09:00 AM - 10:00 AM',
    peak_count: 180,
  },
  {
    id: 'corr-03',
    name: 'West-Central Arterial (Karol Bagh ↔ CP)',
    from_zone: 'West Delhi',
    to_zone: 'Central Delhi',
    trajectory_count: 430,
    avg_travel_time_seconds: 1320, // 22 mins
    peak_hour: '08:15 AM - 09:15 AM',
    peak_count: 155,
  },
];
