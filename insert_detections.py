#!/usr/bin/env python3
"""
NERO Pipeline — Supabase Detections Bulk Ingestion Script
==========================================================
Reads precomputed detection JSON files from run_detection.py, resolves
camera UUIDs from the Supabase `cameras` table, converts relative frame
timestamps to absolute timestamps, and bulk-inserts rows into the
`detections` table.

This is a separate, independently re-runnable step from inference.
Uses the Supabase service role key (NOT the anon key) for trusted
backend access.

Usage:
    python insert_detections.py --detections_dir ./detections --config camera_config.json

Prerequisites:
    - Run the migration to add tracked_vehicle_id + frame_timestamp_sec columns
    - Set SUPABASE_SERVICE_ROLE_KEY in your .env file
"""

import argparse
import glob
import json
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root
load_dotenv()

# Ensure UTF-8 stdout on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


# ──────────────────────────────────────────────────────────────────────
# Supabase Client Initialization
# ──────────────────────────────────────────────────────────────────────

def get_supabase_client():
    """
    Initialize the Supabase Python client using the service role key
    for trusted backend access. Falls back to anon key with a warning.
    """
    try:
        from supabase import create_client
    except ImportError:
        print("[!] Error: 'supabase' package not installed.")
        print("    Install it: pip install supabase")
        sys.exit(1)

    # Resolve URL — accept both SUPABASE_URL and VITE_SUPABASE_URL
    url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    if not url or "your-project" in url:
        print("[!] Error: SUPABASE_URL is not configured in .env")
        print("    Set SUPABASE_URL=https://<project-id>.supabase.co")
        sys.exit(1)

    # Prefer service role key for backend scripts (bypasses RLS)
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not key or "your-" in key:
        print("[!] Warning: SUPABASE_SERVICE_ROLE_KEY not set.")
        print("    Falling back to VITE_SUPABASE_ANON_KEY (RLS restrictions apply).")
        key = os.getenv("VITE_SUPABASE_ANON_KEY")
        if not key or "your-" in key:
            print("[!] Error: No valid Supabase key found in .env")
            sys.exit(1)

    print(f"[*] Connecting to Supabase: {url[:50]}...")
    return create_client(url, key)


# ──────────────────────────────────────────────────────────────────────
# Camera Code → UUID Mapping
# ──────────────────────────────────────────────────────────────────────

def fetch_camera_mapping(supabase) -> dict:
    """
    Fetch all cameras from the `cameras` table.
    Returns: { camera_code: { id, lat, lng, name } }
    Supports both IG-01 and CAM-A style camera codes, as well as latitude/longitude column names.
    """
    print("[*] Fetching camera lookup from Supabase `cameras` table...")
    try:
        res = supabase.table("cameras").select("*").execute()
        rows = res.data or []
        mapping = {}

        # Mappings between pipeline codes (IG-01) and DB codes (CAM-A)
        code_alias = {
            "IG-01": ["IG-01", "CAM-A"],
            "CP-01": ["CP-01", "CAM-B"],
            "KB-01": ["KB-01", "CAM-C"],
            "DW-01": ["DW-01", "CAM-D"],
            "LN-01": ["LN-01", "CAM-E"],
            "DK-01": ["DK-01", "CAM-F"],
            "AI-01": ["AI-01", "CAM-G"],
            "NP-01": ["NP-01", "CAM-H"],
            "CC-01": ["CC-01", "CAM-I"],
        }

        for row in rows:
            code = row.get("code")
            # Normalize lat/lng column names
            row["lat"] = row.get("lat") if row.get("lat") is not None else row.get("latitude", 28.6129)
            row["lng"] = row.get("lng") if row.get("lng") is not None else row.get("longitude", 77.2295)

            if code:
                mapping[code] = row
            
            # Map aliases
            for pipeline_code, aliases in code_alias.items():
                if code in aliases:
                    mapping[pipeline_code] = row

        print(f"[OK] {len(mapping)} camera mappings established: {', '.join(sorted(mapping.keys()))}")
        return mapping
    except Exception as e:
        print(f"[!] Could not fetch cameras from DB: {e}")
        return {}


def load_config_fallback(config_path: str) -> dict:
    """Load camera_config.json as fallback mapping."""
    if not os.path.exists(config_path):
        return {}
    with open(config_path, "r", encoding="utf-8") as f:
        items = json.load(f)
    return {item["camera_code"]: item for item in items}


# ──────────────────────────────────────────────────────────────────────
# Main Ingestion Logic
# ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="NERO — Supabase Detection Data Bulk Ingestor"
    )
    parser.add_argument(
        "--detections_dir",
        type=str,
        default="./detections",
        help="Directory with detections_<camera_code>.json files (default: ./detections)",
    )
    parser.add_argument(
        "--config",
        type=str,
        default="camera_config.json",
        help="Camera config file for fallback lookups (default: camera_config.json)",
    )
    parser.add_argument(
        "--start_time",
        type=str,
        default=None,
        help="Base ISO start timestamp (e.g. 2026-09-27T12:00:00Z). "
        "Defaults to now() minus longest video duration.",
    )
    parser.add_argument(
        "--batch_size",
        type=int,
        default=500,
        help="Rows per insert batch (default: 500)",
    )

    args = parser.parse_args()

    print()
    print("=" * 60)
    print("  NERO — Supabase Detection Data Ingestor")
    print("=" * 60)

    # Validate detections directory
    if not os.path.exists(args.detections_dir):
        print(f"[!] Detections directory not found: {args.detections_dir}")
        print("    Run 'python run_detection.py' first to generate detection data.")
        sys.exit(1)

    json_files = sorted(glob.glob(os.path.join(args.detections_dir, "detections_*.json")))
    if not json_files:
        print(f"[!] No detections_*.json files found in '{args.detections_dir}'.")
        print("    Run 'python run_detection.py' first.")
        sys.exit(1)

    print(f"[*] Found {len(json_files)} detection files to ingest.")

    # Initialize Supabase
    supabase = get_supabase_client()
    db_cameras = fetch_camera_mapping(supabase)
    config_cameras = load_config_fallback(args.config)

    # Determine base timestamp for absolute detection times
    if args.start_time:
        try:
            base_time = datetime.fromisoformat(args.start_time.replace("Z", "+00:00"))
        except ValueError:
            print(f"[!] Invalid --start_time format: '{args.start_time}'")
            print("    Expected ISO format like: 2026-09-27T12:00:00Z")
            base_time = datetime.now(timezone.utc)
    else:
        # Default: now minus 30 minutes (reasonable for batch replays)
        base_time = datetime.now(timezone.utc) - timedelta(minutes=30)

    print(f"[*] Base timestamp for detections: {base_time.isoformat()}")

    total_inserted = 0
    total_skipped = 0

    for json_file in json_files:
        filename = os.path.basename(json_file)
        # Extract camera code from filename: detections_IG-01.json → IG-01
        cam_code = filename.replace("detections_", "").replace(".json", "")

        print(f"\n{'─'*50}")
        print(f"  Ingesting: {cam_code} ({filename})")
        print(f"{'─'*50}")

        with open(json_file, "r", encoding="utf-8") as f:
            det_list = json.load(f)

        if not det_list:
            print(f"  Empty file — skipping.")
            continue

        # Resolve camera UUID from DB, then config fallback
        cam_info = db_cameras.get(cam_code)
        if cam_info:
            cam_id = cam_info["id"]
            cam_lat = cam_info.get("lat", 28.6129)
            cam_lng = cam_info.get("lng", 77.2295)
            print(f"  Camera ID: {cam_id} (from database)")
        else:
            # Build a deterministic fallback ID matching the migration seed format
            print(f"  [!] Camera code '{cam_code}' not in database.")
            conf = config_cameras.get(cam_code, {})
            cam_id = conf.get("camera_id", f"cam-{cam_code.lower()}")
            cam_lat = conf.get("lat", 28.6129)
            cam_lng = conf.get("lng", 77.2295)
            print(f"  Using fallback ID: {cam_id}")

        # Build insertion rows
        rows = []
        for det in det_list:
            frame_ts = float(det.get("frame_timestamp_sec", 0.0))
            detected_at = (base_time + timedelta(seconds=frame_ts)).isoformat()

            raw_plate = det.get("plate_text", "UNKNOWN")
            norm_plate = raw_plate.replace(" ", "").replace("-", "").upper()

            rows.append(
                {
                    "event_id": str(uuid.uuid4()),
                    "camera_id": cam_id,
                    "plate_text_raw": raw_plate,
                    "plate_text_normalized": norm_plate,
                    "confidence_score": float(det.get("confidence", 0.0)),
                    "vehicle_type": det.get("vehicle_type", "car"),
                    "detected_at": detected_at,
                    "lat": float(cam_lat),
                    "lng": float(cam_lng),
                    "latitude": float(cam_lat),
                    "longitude": float(cam_lng),
                    "bbox": det.get("bbox", {"x": 0, "y": 0, "width": 0, "height": 0}),
                    "tracked_vehicle_id": det.get("tracked_vehicle_id", "trk_0000"),
                    "frame_timestamp_sec": frame_ts,
                }
            )

        print(f"  Prepared {len(rows)} rows for insertion...")

        # Chunked bulk insert with fallback
        for i in range(0, len(rows), args.batch_size):
            chunk = rows[i : i + args.batch_size]
            chunk_num = i // args.batch_size + 1

            try:
                supabase.table("detections").insert(chunk).execute()
                total_inserted += len(chunk)
                print(f"  [OK] Chunk {chunk_num}: {len(chunk)} rows inserted")
            except Exception as e:
                err_msg = str(e)
                # If pipeline columns don't exist yet, retry without them
                if "tracked_vehicle_id" in err_msg or "frame_timestamp_sec" in err_msg:
                    print(f"  [!] Schema mismatch on chunk {chunk_num} — retrying without pipeline columns...")
                    fallback_chunk = []
                    for row in chunk:
                        r = dict(row)
                        r.pop("tracked_vehicle_id", None)
                        r.pop("frame_timestamp_sec", None)
                        fallback_chunk.append(r)
                    try:
                        supabase.table("detections").insert(fallback_chunk).execute()
                        total_inserted += len(fallback_chunk)
                        print(f"  [OK] Fallback insert succeeded: {len(fallback_chunk)} rows")
                    except Exception as e2:
                        total_skipped += len(chunk)
                        print(f"  [!] Fallback also failed: {e2}")
                else:
                    total_skipped += len(chunk)
                    print(f"  [!] Insert failed on chunk {chunk_num}: {e}")

    # Final report
    print()
    print("=" * 60)
    print("  INGESTION COMPLETE")
    print("=" * 60)
    print(f"  Files processed  : {len(json_files)}")
    print(f"  Rows inserted    : {total_inserted}")
    if total_skipped:
        print(f"  Rows skipped     : {total_skipped}")
    print(f"  Base timestamp   : {base_time.isoformat()}")
    print("=" * 60)
    print()


if __name__ == "__main__":
    main()
