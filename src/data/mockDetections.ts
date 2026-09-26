// ═══════════════════════════════════════════════════
// Mock Precomputed YOLOv7 Detections Dataset
// Frame-by-frame bounding boxes + mocked plate text
// Keyed by camera_id and timestamp relative to video timeline
// ═══════════════════════════════════════════════════

import type { Detection } from '@/types';

// Precomputed detections simulating offline tiny YOLOv7 output per video timeline
export const mockDetections: Record<string, Detection[]> = {
  'cam-001': [
    {
      event_id: 'det-101',
      camera_id: 'cam-001',
      plate_text_raw: 'DL-01-AB-1234',
      plate_text_normalized: 'DL01AB1234',
      confidence_score: 0.94,
      vehicle_type: 'car',
      timestamp: '00:02.500',
      lat: 28.6129,
      lng: 77.2295,
      bbox: { x: 120, y: 180, width: 140, height: 90 },
    },
    {
      event_id: 'det-102',
      camera_id: 'cam-001',
      plate_text_raw: 'DL-01-AB-1234',
      plate_text_normalized: 'DL01AB1234',
      confidence_score: 0.96,
      vehicle_type: 'car',
      timestamp: '00:05.000',
      lat: 28.6129,
      lng: 77.2295,
      bbox: { x: 260, y: 220, width: 160, height: 105 },
    },
    {
      event_id: 'det-103',
      camera_id: 'cam-001',
      plate_text_raw: 'HR-26-CD-5678',
      plate_text_normalized: 'HR26CD5678',
      confidence_score: 0.88,
      vehicle_type: 'truck',
      timestamp: '00:07.200',
      lat: 28.6129,
      lng: 77.2295,
      bbox: { x: 450, y: 150, width: 220, height: 160 },
    },
    {
      event_id: 'det-104',
      camera_id: 'cam-001',
      plate_text_raw: 'DL-02-EF-9012',
      plate_text_normalized: 'DL02EF9012',
      confidence_score: 0.92,
      vehicle_type: 'car',
      timestamp: '00:12.000',
      lat: 28.6129,
      lng: 77.2295,
      bbox: { x: 300, y: 280, width: 150, height: 95 },
    },
  ],
  'cam-002': [
    {
      event_id: 'det-201',
      camera_id: 'cam-002',
      plate_text_raw: 'DL-01-AB-1234',
      plate_text_normalized: 'DL01AB1234',
      confidence_score: 0.93,
      vehicle_type: 'car',
      timestamp: '00:03.100',
      lat: 28.6315,
      lng: 77.2167,
      bbox: { x: 180, y: 200, width: 150, height: 100 },
    },
    {
      event_id: 'det-202',
      camera_id: 'cam-002',
      plate_text_raw: 'UP-16-GH-3456',
      plate_text_normalized: 'UP16GH3456',
      confidence_score: 0.89,
      vehicle_type: 'bus',
      timestamp: '00:08.500',
      lat: 28.6315,
      lng: 77.2167,
      bbox: { x: 380, y: 140, width: 250, height: 180 },
    },
  ],
  'cam-003': [
    {
      event_id: 'det-301',
      camera_id: 'cam-003',
      plate_text_raw: 'DL-01-AB-1234',
      plate_text_normalized: 'DL01AB1234',
      confidence_score: 0.91,
      vehicle_type: 'car',
      timestamp: '00:04.800',
      lat: 28.6519,
      lng: 77.1905,
      bbox: { x: 210, y: 240, width: 155, height: 100 },
    },
    {
      event_id: 'det-302',
      camera_id: 'cam-003',
      plate_text_raw: 'DL-03-IJ-7890',
      plate_text_normalized: 'DL03IJ7890',
      confidence_score: 0.84,
      vehicle_type: 'motorcycle',
      timestamp: '00:09.200',
      lat: 28.6519,
      lng: 77.1905,
      bbox: { x: 420, y: 310, width: 90, height: 80 },
    },
  ],
};
