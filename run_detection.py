#!/usr/bin/env python3
"""
NERO Pipeline — Offline Tiny YOLOv7 Video Detection & Tracking
================================================================
Runs offline tiny YOLOv7 vehicle detection on traffic videos, applies
lightweight IoU tracking, assigns deterministic mock license plates per
tracked vehicle, and outputs structured JSON.

Usage:
    python run_detection.py --videos_dir ./videos --output_dir ./detections \
        --sample_interval 0.2 --conf_threshold 0.4

Requirements:
    pip install -r requirements.txt

Model weights (auto-downloaded on first run):
    ./weights/yolov7-tiny.pt
"""

import argparse
import csv
import hashlib
import json
import os
import random
import sys
import time
from pathlib import Path

import cv2
import numpy as np

# Optional imports — degrade gracefully
try:
    from tqdm import tqdm
except ImportError:
    tqdm = None

try:
    import requests
except ImportError:
    requests = None

# Ensure UTF-8 stdout encoding on Windows console
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ──────────────────────────────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────────────────────────────

# Reference canvas the frontend overlay uses for bbox scaling
OVERLAY_WIDTH = 640
OVERLAY_HEIGHT = 360

# COCO class IDs for vehicles we care about
COCO_VEHICLE_CLASSES = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

# Indian state codes for mock plate generation
INDIAN_STATES = ["DL", "HR", "UP", "RJ", "MH", "KA", "TN", "WB", "GJ", "PB"]


# ──────────────────────────────────────────────────────────────────────
# Deterministic Mock Plate Generator
# ──────────────────────────────────────────────────────────────────────

def get_deterministic_plate(camera_code: str, tracked_vehicle_id: str) -> str:
    """
    Generates a deterministic Indian license plate string
    (e.g. 'DL 01 AB 1234') seeded by (camera_code, tracked_vehicle_id).
    Re-runs always produce the same plate for the same vehicle.
    """
    seed_str = f"{camera_code}_{tracked_vehicle_id}"
    seed_val = int(hashlib.md5(seed_str.encode("utf-8")).hexdigest(), 16) % (10**8)
    rng = random.Random(seed_val)

    state = rng.choice(INDIAN_STATES)
    rto_code = f"{rng.randint(1, 99):02d}"
    series = "".join(rng.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=2))
    number = f"{rng.randint(1000, 9999):04d}"

    return f"{state} {rto_code} {series} {number}"


# ──────────────────────────────────────────────────────────────────────
# Lightweight IoU Tracker
# ──────────────────────────────────────────────────────────────────────

def compute_iou(box_a, box_b):
    """IoU between two [x, y, w, h] bounding boxes."""
    xa = max(box_a[0], box_b[0])
    ya = max(box_a[1], box_b[1])
    xb = min(box_a[0] + box_a[2], box_b[0] + box_b[2])
    yb = min(box_a[1] + box_a[3], box_b[1] + box_b[3])

    inter = max(0, xb - xa) * max(0, yb - ya)
    area_a = box_a[2] * box_a[3]
    area_b = box_b[2] * box_b[3]
    union = area_a + area_b - inter + 1e-6

    return inter / union


class LightweightTracker:
    """
    Centroid/IoU-based lightweight tracker that assigns a consistent
    tracked_vehicle_id to the same physical vehicle across consecutive
    sampled frames within a single video.
    """

    def __init__(self, iou_thresh: float = 0.25, max_missed: int = 5):
        self.iou_thresh = iou_thresh
        self.max_missed = max_missed
        self.next_track_id = 1
        # track_id -> {bbox, vehicle_type, missed_frames}
        self.tracks: dict = {}

    def update(self, detections: list[dict]) -> list[dict]:
        """
        Match new detections to existing tracks and return enriched
        detections with a stable `tracked_vehicle_id`.
        """
        updated = []
        unmatched_det_idxs = list(range(len(detections)))

        # Greedy IoU matching against existing tracks
        for track_id, track in list(self.tracks.items()):
            best_iou = 0.0
            best_idx = -1
            for idx in unmatched_det_idxs:
                det = detections[idx]
                # Only match same vehicle type
                if det["vehicle_type"] != track["vehicle_type"]:
                    continue
                iou = compute_iou(track["bbox"], det["bbox"])
                if iou > best_iou and iou >= self.iou_thresh:
                    best_iou = iou
                    best_idx = idx

            if best_idx != -1:
                # Matched — update track state
                track["bbox"] = detections[best_idx]["bbox"]
                track["missed_frames"] = 0
                unmatched_det_idxs.remove(best_idx)

                enriched = dict(detections[best_idx])
                enriched["tracked_vehicle_id"] = f"trk_{track_id:04d}"
                updated.append(enriched)
            else:
                track["missed_frames"] += 1

        # Age out tracks that went missing too long
        for tid in [
            tid
            for tid, t in self.tracks.items()
            if t["missed_frames"] > self.max_missed
        ]:
            del self.tracks[tid]

        # Register new tracks for unmatched detections
        for idx in unmatched_det_idxs:
            det = detections[idx]
            new_id = self.next_track_id
            self.next_track_id += 1

            self.tracks[new_id] = {
                "bbox": det["bbox"],
                "vehicle_type": det["vehicle_type"],
                "missed_frames": 0,
            }
            enriched = dict(det)
            enriched["tracked_vehicle_id"] = f"trk_{new_id:04d}"
            updated.append(enriched)

        return updated


# ──────────────────────────────────────────────────────────────────────
# YOLOv7 Model Loader (robust, multi-strategy)
# ──────────────────────────────────────────────────────────────────────

def _download_weights(weights_path: str) -> bool:
    """Download tiny YOLOv7 weights if missing. Returns True on success."""
    if os.path.exists(weights_path):
        return True

    if requests is None:
        print("[!] 'requests' package not installed — cannot download weights.")
        return False

    weights_dir = os.path.dirname(weights_path)
    if weights_dir:
        os.makedirs(weights_dir, exist_ok=True)

    url = "https://github.com/WongKinYiu/yolov7/releases/download/v0.1/yolov7-tiny.pt"
    print(f"[*] Downloading YOLOv7-tiny weights from GitHub...")
    try:
        resp = requests.get(url, stream=True, timeout=120)
        resp.raise_for_status()
        total = int(resp.headers.get("content-length", 0))
        downloaded = 0
        with open(weights_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=1024 * 1024):
                f.write(chunk)
                downloaded += len(chunk)
                if total:
                    pct = downloaded * 100 // total
                    print(f"\r    Progress: {pct}% ({downloaded // 1024 // 1024}MB)", end="", flush=True)
        print(f"\n[OK] Saved weights to {weights_path}")
        return True
    except Exception as e:
        print(f"[!] Download failed: {e}")
        if os.path.exists(weights_path):
            os.remove(weights_path)
        return False


def load_yolov7_model(weights_path: str, conf_threshold: float):
    """
    Load the YOLOv7-tiny model ONCE at startup.

    Strategy (ordered by reliability):
      1. torch.hub.load with locally cached YOLOv7 repo
      2. torch.hub.load from remote GitHub (downloads repo on first run)
      3. Fallback to OpenCV background-subtractor heuristic engine
    """
    print("[*] Initializing YOLOv7 model engine...")

    # Ensure weights file exists
    if not _download_weights(weights_path):
        print("[!] Weights unavailable — will use heuristic fallback engine.")
        return None

    try:
        import torch

        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[*] PyTorch device: {device}")

        # Strategy 1: Try local hub cache first (fast, no network)
        try:
            model = torch.hub.load(
                "WongKinYiu/yolov7",
                "custom",
                weights_path,
                trust_repo=True,
                force_reload=False,
            )
            model.conf = conf_threshold
            model.to(device)
            print("[OK] YOLOv7-tiny loaded via torch.hub (cached)")
            return model
        except Exception as e1:
            print(f"[*] Hub cache miss ({e1}), trying fresh download...")

        # Strategy 2: Force-reload hub repo from GitHub
        try:
            model = torch.hub.load(
                "WongKinYiu/yolov7",
                "custom",
                weights_path,
                trust_repo=True,
                force_reload=True,
            )
            model.conf = conf_threshold
            model.to(device)
            print("[OK] YOLOv7-tiny loaded via torch.hub (fresh)")
            return model
        except Exception as e2:
            print(f"[!] torch.hub.load failed: {e2}")

    except ImportError:
        print("[!] PyTorch not installed — using heuristic fallback engine.")

    print("[!] All model loading strategies failed — using heuristic detection.")
    return None


# ──────────────────────────────────────────────────────────────────────
# Video Downloader Helper
# ──────────────────────────────────────────────────────────────────────

def ensure_videos_downloaded(config_path: str, videos_dir: str):
    """Download missing videos from their Supabase public URLs."""
    if requests is None:
        print("[!] 'requests' not installed — cannot download videos.")
        return

    if not os.path.exists(config_path):
        print(f"[!] Config file '{config_path}' not found — skipping download.")
        return

    os.makedirs(videos_dir, exist_ok=True)

    with open(config_path, "r", encoding="utf-8") as f:
        configs = json.load(f)

    for item in configs:
        filename = item.get("video_filename")
        url = item.get("video_url")
        if not filename or not url:
            continue

        target = os.path.join(videos_dir, filename)
        if os.path.exists(target):
            size_mb = os.path.getsize(target) / (1024 * 1024)
            print(f"[OK] {filename} already present ({size_mb:.1f} MB)")
            continue

        cam = item.get("camera_code", "?")
        print(f"[*] Downloading {filename} for camera {cam}...")
        try:
            resp = requests.get(url, stream=True, timeout=120)
            resp.raise_for_status()
            with open(target, "wb") as fout:
                for chunk in resp.iter_content(chunk_size=1024 * 1024):
                    fout.write(chunk)
            size_mb = os.path.getsize(target) / (1024 * 1024)
            print(f"[OK] Downloaded {filename} ({size_mb:.1f} MB)")
        except Exception as e:
            print(f"[!] Failed to download {filename}: {e}")


# ──────────────────────────────────────────────────────────────────────
# Frame Inference & Processing (single video)
# ──────────────────────────────────────────────────────────────────────

def process_single_video(
    video_path: str,
    camera_code: str,
    model,
    sample_interval: float = 0.2,
    conf_threshold: float = 0.4,
):
    """
    Process one video:
    1. Sample frames at `sample_interval` seconds of video time
    2. Run YOLOv7 inference (or heuristic fallback)
    3. Track vehicles across frames with LightweightTracker
    4. Assign deterministic mock license plates
    5. Normalize bboxes to 640×360 reference canvas

    Returns (detections_list, summary_dict) or (None, None) on failure.
    """
    if not os.path.exists(video_path):
        print(f"[!] Video not found: {video_path}")
        return None, None

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"[!] Cannot open video: {video_path}")
        return None, None

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_sec = round(total_frames / fps, 2)
    frame_step = max(1, int(round(fps * sample_interval)))
    expected_samples = total_frames // frame_step

    print(f"\n{'─'*60}")
    print(f"  Camera: {camera_code}  |  File: {os.path.basename(video_path)}")
    print(f"  FPS: {fps:.1f}  |  Frames: {total_frames}  |  Duration: {duration_sec}s")
    print(f"  Sampling every {frame_step} frames ({sample_interval}s interval)")
    print(f"  Expected samples: ~{expected_samples}")
    print(f"{'─'*60}")

    tracker = LightweightTracker(iou_thresh=0.2, max_missed=5)
    detections_out = []

    # Background subtractor for heuristic fallback
    bg_sub = cv2.createBackgroundSubtractorMOG2(
        history=500, varThreshold=50, detectShadows=False
    )

    frame_idx = 0
    sampled_count = 0

    # Progress bar (if tqdm available)
    pbar = None
    if tqdm is not None:
        pbar = tqdm(
            total=expected_samples,
            desc=f"  {camera_code}",
            unit="frame",
            ncols=80,
            leave=True,
        )

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1
        if (frame_idx - 1) % frame_step != 0:
            continue

        sampled_count += 1
        frame_ts = round((frame_idx - 1) / fps, 3)
        h_frame, w_frame = frame.shape[:2]

        raw_dets = []

        # ── YOLOv7 PyTorch inference ──
        if model is not None:
            try:
                results = model(frame)
                pred = results.pred[0] if hasattr(results, "pred") else []

                for *xyxy, conf, cls in pred:
                    confidence = float(conf)
                    if confidence < conf_threshold:
                        continue

                    cls_id = int(cls)
                    vehicle_type = COCO_VEHICLE_CLASSES.get(cls_id)
                    if not vehicle_type:
                        continue  # Non-vehicle class — skip

                    x1, y1, x2, y2 = [float(v) for v in xyxy]

                    # Normalize to 640×360 reference canvas
                    nx = round(x1 / w_frame * OVERLAY_WIDTH, 1)
                    ny = round(y1 / h_frame * OVERLAY_HEIGHT, 1)
                    nw = round((x2 - x1) / w_frame * OVERLAY_WIDTH, 1)
                    nh = round((y2 - y1) / h_frame * OVERLAY_HEIGHT, 1)

                    raw_dets.append(
                        {
                            "bbox": [nx, ny, nw, nh],
                            "vehicle_type": vehicle_type,
                            "confidence": round(confidence, 2),
                        }
                    )
            except Exception as e:
                if sampled_count <= 2:
                    print(f"\n[!] Inference error on frame {frame_idx}: {e}")
                    print("    Switching to heuristic fallback for this video.")
                    model = None

        # ── Heuristic fallback (background subtraction + contour analysis) ──
        if model is None:
            fg_mask = bg_sub.apply(frame)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
            fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
            contours, _ = cv2.findContours(
                fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area < 1200:
                    continue  # Too small

                x, y, w, h = cv2.boundingRect(cnt)

                # Heuristic vehicle type from area/aspect ratio
                if area > 8000:
                    vtype = "bus" if w > h else "truck"
                elif area > 3500:
                    vtype = "car"
                else:
                    vtype = "motorcycle"

                conf = round(min(0.98, 0.70 + area / 20000.0), 2)
                if conf < conf_threshold:
                    continue

                # Normalize to 640×360
                nx = round(x / w_frame * OVERLAY_WIDTH, 1)
                ny = round(y / h_frame * OVERLAY_HEIGHT, 1)
                nw = round(w / w_frame * OVERLAY_WIDTH, 1)
                nh = round(h / h_frame * OVERLAY_HEIGHT, 1)

                raw_dets.append(
                    {
                        "bbox": [nx, ny, nw, nh],
                        "vehicle_type": vtype,
                        "confidence": conf,
                    }
                )

        # Update tracker and build output records
        tracked = tracker.update(raw_dets)
        for det in tracked:
            trk_id = det["tracked_vehicle_id"]
            plate = get_deterministic_plate(camera_code, trk_id)

            detections_out.append(
                {
                    "camera_code": camera_code,
                    "tracked_vehicle_id": trk_id,
                    "plate_text": plate,
                    "vehicle_type": det["vehicle_type"],
                    "confidence": det["confidence"],
                    "frame_timestamp_sec": frame_ts,
                    "bbox": {
                        "x": det["bbox"][0],
                        "y": det["bbox"][1],
                        "width": det["bbox"][2],
                        "height": det["bbox"][3],
                    },
                }
            )

        if pbar is not None:
            pbar.update(1)

    if pbar is not None:
        pbar.close()
    cap.release()

    # Summary stats
    unique_vehicles = len(set(d["tracked_vehicle_id"] for d in detections_out))
    avg_conf = (
        round(
            sum(d["confidence"] for d in detections_out) / max(1, len(detections_out)),
            3,
        )
        if detections_out
        else 0.0
    )

    summary = {
        "camera_code": camera_code,
        "video_filename": os.path.basename(video_path),
        "total_frames_sampled": sampled_count,
        "total_detections": len(detections_out),
        "unique_tracked_vehicles": unique_vehicles,
        "video_duration_sec": duration_sec,
        "average_confidence": avg_conf,
    }

    print(
        f"  Result: {len(detections_out)} detections | "
        f"{unique_vehicles} unique vehicles | "
        f"Avg conf: {avg_conf}"
    )
    return detections_out, summary


# ──────────────────────────────────────────────────────────────────────
# Main CLI Entrypoint
# ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="NERO — Offline YOLOv7 Batch Detection Pipeline"
    )
    parser.add_argument(
        "--videos_dir",
        type=str,
        default="./videos",
        help="Directory containing traffic video files (default: ./videos)",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./detections",
        help="Directory for output detection JSON files (default: ./detections)",
    )
    parser.add_argument(
        "--config",
        type=str,
        default="camera_config.json",
        help="Camera config mapping file (default: camera_config.json)",
    )
    parser.add_argument(
        "--weights",
        type=str,
        default="./weights/yolov7-tiny.pt",
        help="Path to YOLOv7-tiny .pt weights file (default: ./weights/yolov7-tiny.pt)",
    )
    parser.add_argument(
        "--sample_interval",
        type=float,
        default=0.2,
        help="Frame sampling interval in video seconds (default: 0.2s = 5 fps)",
    )
    parser.add_argument(
        "--conf_threshold",
        type=float,
        default=0.4,
        help="Minimum detection confidence threshold (default: 0.4)",
    )
    parser.add_argument(
        "--download",
        action="store_true",
        help="Download missing videos from Supabase Storage before processing",
    )

    args = parser.parse_args()

    print()
    print("=" * 60)
    print("  NERO — Offline YOLOv7 Batch Detection Pipeline")
    print("=" * 60)
    print(f"  Videos dir     : {args.videos_dir}")
    print(f"  Output dir     : {args.output_dir}")
    print(f"  Config         : {args.config}")
    print(f"  Weights        : {args.weights}")
    print(f"  Sample interval: {args.sample_interval}s")
    print(f"  Conf threshold : {args.conf_threshold}")
    print(f"  Auto-download  : {args.download}")
    print("=" * 60)

    os.makedirs(args.output_dir, exist_ok=True)

    # Step 1: Download videos if requested or if directory is empty/missing
    if args.download or not os.path.exists(args.videos_dir) or not os.listdir(args.videos_dir):
        ensure_videos_downloaded(args.config, args.videos_dir)

    # Step 2: Load model ONCE at startup — reused for every video
    model = load_yolov7_model(args.weights, args.conf_threshold)

    # Step 3: Load camera config mapping
    camera_configs = []
    if os.path.exists(args.config):
        with open(args.config, "r", encoding="utf-8") as f:
            camera_configs = json.load(f)
    else:
        print(f"[!] Config '{args.config}' not found — scanning {args.videos_dir}...")
        if os.path.exists(args.videos_dir):
            vids = sorted(
                f
                for f in os.listdir(args.videos_dir)
                if f.lower().endswith((".mp4", ".avi", ".mov", ".mkv"))
            )
            for idx, vf in enumerate(vids):
                camera_configs.append(
                    {
                        "camera_code": f"CAM-{chr(65 + idx)}",
                        "video_filename": vf,
                    }
                )

    if not camera_configs:
        print("[!] No camera configs found. Nothing to process.")
        sys.exit(1)

    print(f"\n[*] Processing {len(camera_configs)} camera videos...\n")

    all_summaries = []
    t_start = time.time()

    # Step 4: Process each video sequentially
    for item in camera_configs:
        cam_code = item["camera_code"]
        video_filename = item["video_filename"]

        # Resolve video path — check videos_dir, then public/videos/
        video_path = os.path.join(args.videos_dir, video_filename)
        if not os.path.exists(video_path):
            fallback = os.path.join("./public/videos", video_filename)
            if os.path.exists(fallback):
                video_path = fallback

        if not os.path.exists(video_path):
            # Try streaming from URL if available
            url = item.get("video_url", "")
            if url.startswith("http"):
                video_path = url
                print(f"[*] Streaming {cam_code} from URL (no local file)...")
            else:
                print(f"[!] Skipping {cam_code}: '{video_filename}' not found locally.")
                continue

        try:
            detections, summary = process_single_video(
                video_path=video_path,
                camera_code=cam_code,
                model=model,
                sample_interval=args.sample_interval,
                conf_threshold=args.conf_threshold,
            )

            if detections is not None:
                out_path = os.path.join(
                    args.output_dir, f"detections_{cam_code}.json"
                )
                with open(out_path, "w", encoding="utf-8") as fout:
                    json.dump(detections, fout, indent=2)
                all_summaries.append(summary)

        except Exception as e:
            print(f"[!] Error processing {cam_code}: {e}")
            print("    Continuing with remaining videos...")

    elapsed = round(time.time() - t_start, 1)

    # Step 5: Write summary files
    if all_summaries:
        summary_json = os.path.join(args.output_dir, "summary.json")
        with open(summary_json, "w", encoding="utf-8") as f:
            json.dump(all_summaries, f, indent=2)

        summary_csv = os.path.join(args.output_dir, "summary.csv")
        with open(summary_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=all_summaries[0].keys())
            writer.writeheader()
            writer.writerows(all_summaries)

        total_dets = sum(s["total_detections"] for s in all_summaries)
        total_vehs = sum(s["unique_tracked_vehicles"] for s in all_summaries)

        print()
        print("=" * 60)
        print("  BATCH COMPLETE")
        print("=" * 60)
        print(f"  Videos processed : {len(all_summaries)} / {len(camera_configs)}")
        print(f"  Total detections : {total_dets}")
        print(f"  Unique vehicles  : {total_vehs}")
        print(f"  Elapsed time     : {elapsed}s")
        print(f"  Output directory : {args.output_dir}/")
        print(f"  Summary files    : summary.json, summary.csv")
        print("=" * 60)
        print()
    else:
        print("\n[!] No videos were processed successfully.\n")


if __name__ == "__main__":
    main()
