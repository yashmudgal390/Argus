-- Migration: Add vehicle tracking and frame timestamp metadata to detections table
ALTER TABLE public.detections 
ADD COLUMN IF NOT EXISTS tracked_vehicle_id VARCHAR(64),
ADD COLUMN IF NOT EXISTS frame_timestamp_sec FLOAT;

CREATE INDEX IF NOT EXISTS idx_detections_tracked_vehicle ON public.detections(tracked_vehicle_id);
