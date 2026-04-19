
import os
from dotenv import load_dotenv
load_dotenv("../.env.local")
load_dotenv(".env")
from supabase import create_client

URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not URL or not KEY:
    print("[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env")
    exit(1)

sb = create_client(URL, KEY)

print("=== price_logs (latest 10) ===")
try:
    r1 = sb.table("price_logs").select("*").order("slot_date", desc=True).order("slot_index", desc=True).limit(10).execute()
    print(f"  Row count: {len(r1.data)}")
    for row in r1.data:
        print(f"  [{row['slot_date']} | slot {row['slot_index']:2d}] price=Rs {row['price']}, demand={row['demand']}, supply={row['supply']}")
except Exception as e:
    print(f"  ERROR reading price_logs: {str(e)[:150]}")

print("\n=== Today's slot coverage ===")
try:
    import datetime, pytz
    ist = pytz.timezone("Asia/Kolkata")
    today = datetime.datetime.now(ist).date().isoformat()
    r2 = sb.table("price_logs").select("slot_index").eq("slot_date", today).order("slot_index", desc=False).execute()
    indices = [r["slot_index"] for r in r2.data] if r2.data else []
    print(f"  Date: {today}")
    print(f"  Slots filled: {len(indices)} / 48")
    if indices:
        print(f"  Range: {min(indices)} to {max(indices)}")
        missing = set(range(max(indices) + 1)) - set(indices)
        if missing:
            print(f"  Missing past slots: {sorted(missing)}")
        else:
            print(f"  No gaps in past slots [OK]")
except Exception as e:
    print(f"  ERROR: {str(e)[:150]}")
