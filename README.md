# NERO — Traffic Video Intelligence & ANPR Analytics System

NERO is an automated traffic monitoring and license plate tracking system. This repository contains both the React + TypeScript frontend dashboard and the Python offline YOLOv7 detection & tracking pipeline.

---

## 🚗 Offline YOLOv7 Detection Pipeline

The detection pipeline processes traffic video feeds offline, detects vehicle bounding boxes, tracks individual vehicles across sampled frames, generates deterministic mock license plates, and bulk ingests detection data into Supabase.

### 📦 Setup & Dependencies

1. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Download YOLOv7 Tiny Model Weights (Optional)**
   The pipeline will automatically attempt to download `yolov7-tiny.pt` on first run if not present:
   ```bash
   mkdir -p weights
   # Or download manually:
   # wget https://github.com/WongKinYiu/yolov7/releases/download/v0.1/yolov7-tiny.pt -O weights/yolov7-tiny.pt
   ```

3. **Configure Environment Variables**
   Ensure `.env` contains your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

---

## 🎬 1. Running Offline Inference (`run_detection.py`)

Run the batch detection script across all 9 camera videos.

```bash
python run_detection.py --videos_dir ./videos --output_dir ./detections --sample_interval 0.2 --conf_threshold 0.4 --download
```

### CLI Parameters for `run_detection.py`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `--videos_dir` | `str` | `./videos` | Local directory containing traffic video MP4 files |
| `--output_dir` | `str` | `./detections` | Output directory for structured detection JSON files |
| `--config` | `str` | `camera_config.json` | Mapping file linking `camera_code` to video filename/URL |
| `--weights` | `str` | `./weights/yolov7-tiny.pt` | Path to PyTorch tiny YOLOv7 model weights file |
| `--sample_interval` | `float` | `0.2` | Frame sampling interval in video seconds (e.g. 0.2s = 5 FPS) |
| `--conf_threshold` | `float` | `0.4` | Minimum confidence score to retain a detection (0.0 to 1.0) |
| `--download` | `flag` | `False` | Automatically download missing videos from Supabase Storage |

### Output JSON Format (`./detections/detections_<camera_code>.json`)
```json
[
  {
    "camera_code": "IG-01",
    "tracked_vehicle_id": "trk_0001",
    "plate_text": "DL 01 AB 1234",
    "vehicle_type": "car",
    "confidence": 0.87,
    "frame_timestamp_sec": 12.4,
    "bbox": {
      "x": 120,
      "y": 340,
      "width": 80,
      "height": 60
    }
  }
]
```

---

## 🗄️ 2. Bulk Ingesting into Supabase (`insert_detections.py`)

Once detections are generated, insert them into the Supabase database.

```bash
python insert_detections.py --detections_dir ./detections --config camera_config.json
```

### CLI Parameters for `insert_detections.py`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `--detections_dir` | `str` | `./detections` | Directory containing `detections_<camera_code>.json` files |
| `--config` | `str` | `camera_config.json` | Path to camera config file for fallback lookups |
| `--start_time` | `str` | `None` | Base ISO start timestamp (defaults to current UTC time) |
| `--batch_size` | `int` | `500` | Chunk size for bulk database insert requests |

---

## 💻 Frontend Dashboard (Vite + React + TS)

Run the dashboard locally:
```bash
npm install
npm run dev
```

The dashboard automatically loads live camera state and stream metadata from your Supabase `cameras` table.
