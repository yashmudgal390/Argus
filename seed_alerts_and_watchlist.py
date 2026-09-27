import os
import uuid
import datetime
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def main():
    url = os.getenv("VITE_SUPABASE_URL", "https://ngwrbxiaeressvmhfopb.supabase.co")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
    if not key:
        print("[!] Error: No Supabase API key found in environment or .env file.")
        return

    supabase = create_client(url, key)

    print("[*] Seeding Watchlist (blacklist_entries)...")
    blacklist = [
        {
            "id": str(uuid.uuid4()),
            "plate_text_normalized": "DL88RC5992",
            "category": "stolen",
            "priority": "high",
            "notes": "Stolen luxury SUV reported near Central Delhi",
            "valid_from": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
        {
            "id": str(uuid.uuid4()),
            "plate_text_normalized": "GJ87XR1197",
            "category": "wanted",
            "priority": "high",
            "notes": "Armed robbery suspect vehicle",
            "valid_from": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
        {
            "id": str(uuid.uuid4()),
            "plate_text_normalized": "RJ60PE5260",
            "category": "flagged",
            "priority": "medium",
            "notes": "Multiple unpaid toll & signal violations",
            "valid_from": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        },
        {
            "id": str(uuid.uuid4()),
            "plate_text_normalized": "DL01AB1234",
            "category": "missing",
            "priority": "high",
            "notes": "Silver sedan linked to missing person report",
            "valid_from": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
    ]

    for entry in blacklist:
        try:
            supabase.table("blacklist_entries").insert(entry).execute()
            print(f"  [OK] Watchlist entry added: {entry['plate_text_normalized']}")
        except Exception as e:
            print(f"  [!] Note on {entry['plate_text_normalized']}: {e}")

    # Fetch inserted blacklist entries to get IDs
    bl_res = supabase.table("blacklist_entries").select("*").execute()
    bl_map = {b["plate_text_normalized"]: b["id"] for b in (bl_res.data or [])}

    print("\n[*] Generating match alerts from detections...")
    plates = list(bl_map.keys())

    res = supabase.table("detections").select("*").in_("plate_text_normalized", plates).limit(50).execute()
    dets = res.data or []
    print(f"[*] Found {len(dets)} matching detection events for watchlist plates.")

    alerts_inserted = 0
    for det in dets:
        plate_norm = det.get("plate_text_normalized")
        bl_id = bl_map.get(plate_norm)

        alert_row = {
            "id": str(uuid.uuid4()),
            "detection_id": det.get("event_id"),
            "blacklist_entry_id": bl_id,
            "priority": "high",
            "status": "open",
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        try:
            supabase.table("alerts").insert(alert_row).execute()
            alerts_inserted += 1
        except Exception as e:
            print(f"  [!] Failed to insert alert: {e}")

    print(f"\n[OK] Successfully created {alerts_inserted} threat alerts in Supabase!")

if __name__ == "__main__":
    main()
