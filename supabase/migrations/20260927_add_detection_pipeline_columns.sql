-- ===================================================
-- NERO Pipeline Schema Extension
-- Adds columns required by the offline YOLOv7
-- detection pipeline (run_detection.py output)
-- ===================================================

-- 1. tracked_vehicle_id: Consistent ID for the same
--    physical vehicle across sampled frames within one
--    video, used for trajectory reconstruction and
--    ensuring one mock plate per vehicle.
ALTER TABLE public.detections
  ADD COLUMN IF NOT EXISTS tracked_vehicle_id VARCHAR(32);

-- 2. frame_timestamp_sec: Offset in seconds from
--    video start. Used by the frontend canvas overlay
--    to synchronize bbox drawing with video playback.
ALTER TABLE public.detections
  ADD COLUMN IF NOT EXISTS frame_timestamp_sec FLOAT;

-- Index on tracked_vehicle_id for trajectory queries
CREATE INDEX IF NOT EXISTS idx_detections_tracked_vehicle
  ON public.detections(tracked_vehicle_id);

-- Index on frame_timestamp_sec for overlay sync lookups
CREATE INDEX IF NOT EXISTS idx_detections_frame_ts
  ON public.detections(camera_id, frame_timestamp_sec);