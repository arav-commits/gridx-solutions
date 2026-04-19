
import os
import time
import datetime
import pytz
from dotenv import load_dotenv

load_dotenv("../.env.local")
load_dotenv("../.env")
load_dotenv(".env")

from price_data import compute_price_by_index, DATA
from supabase import create_client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] FATAL: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.")
    print("   Set them in ../.env.local or as Docker env vars.")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
IST = pytz.timezone("Asia/Kolkata")


def now_ist() -> datetime.datetime:
   
    return datetime.datetime.now(IST)


def slot_index_from_time(dt: datetime.datetime) -> int:
    
    return dt.hour * 2 + (1 if dt.minute >= 30 else 0)


def slot_boundary(dt: datetime.datetime) -> datetime.datetime:
    
    minute = 30 if dt.minute >= 30 else 0
    return dt.replace(minute=minute, second=0, microsecond=0)


def next_slot_boundary(dt: datetime.datetime) -> datetime.datetime:
    
    if dt.minute < 30:
        nxt = dt.replace(minute=30, second=0, microsecond=0)
    else:
        nxt = (dt.replace(minute=0, second=0, microsecond=0)
               + datetime.timedelta(hours=1))
    return nxt


def ist_date_today() -> datetime.date:
   
    return now_ist().date()


def slot_to_utc_timestamp(date: datetime.date, index: int) -> str:
    
    hour = index // 2
    minute = (index % 2) * 30
    ist_dt = IST.localize(datetime.datetime(date.year, date.month, date.day, hour, minute, 0))
    utc_dt = ist_dt.astimezone(datetime.timezone.utc)
    return utc_dt.isoformat()


def upsert_slot(date: datetime.date, index: int) -> bool:
   
    row = DATA[index]
    price = compute_price_by_index(index)
    slot_time_utc = slot_to_utc_timestamp(date, index)

    data = {
        "slot_date": date.isoformat(),
        "slot_index": index,
        "slot_time": slot_time_utc,
        "price": float(price),
        "demand": float(row["demand"]),
        "supply": float(row["supply"]),
    }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = (
                supabase.table("price_logs")
                .upsert(data, on_conflict="slot_date,slot_index")
                .execute()
            )
            return True
        except Exception as e:
            err = str(e)[:120]
            print(f"  [WARN] Attempt {attempt + 1}/{max_retries} failed: {err}")
            time.sleep(2 * (attempt + 1))

    return False


def backfill_today():
    
    today = ist_date_today()
    current = now_ist()
    current_index = slot_index_from_time(current)

    print(f"[INFO] Backfilling today ({today}) - slots 0 to {current_index}...")


    try:
        existing = (
            supabase.table("price_logs")
            .select("slot_index")
            .eq("slot_date", today.isoformat())
            .execute()
        )
        existing_indices = set(r["slot_index"] for r in existing.data) if existing.data else set()
    except Exception as e:
        print(f"  [WARN] Could not check existing slots: {str(e)[:100]}")
        existing_indices = set()

    filled = 0
    for idx in range(current_index + 1):  # Include current slot
        if idx not in existing_indices:
            ok = upsert_slot(today, idx)
            if ok:
                filled += 1
                label = DATA[idx]["time"]
                price = compute_price_by_index(idx)
                print(f"  [OK] Backfilled slot {idx} ({label}) -> Rs {price}")
            else:
                print(f"  [FAIL] Failed to backfill slot {idx}")

    if filled == 0:
        print("  ℹ️  All past slots already exist. No backfill needed.")
    else:
        print(f"  [INFO] Backfilled {filled} missing slot(s).")




def test_connection():
    try:
        res = supabase.table("price_logs").select("id").limit(1).execute()
        print("[OK] Supabase connection OK - price_logs table accessible")
    except Exception as e:
        print(f"[ERROR] Supabase connection failed: {e}")
        print("   Make sure the price_logs table exists. Run the SQL migration first.")
        exit(1)



def wait_for_next_slot():
    """
    Block until the next HH:00 or HH:30 boundary.
    Uses a tight loop with 1-second sleeps for accuracy (no drift).
    """
    target = next_slot_boundary(now_ist())
    label = target.strftime("%I:%M %p")
    print(f"[WAIT] Waiting for next slot boundary: {label} IST...")

    while True:
        remaining = (target - now_ist()).total_seconds()
        if remaining <= 0:
            break

        time.sleep(min(remaining, 1.0))


def run_loop():
    """Main execution loop — push current slot, then wait for next boundary."""
    while True:
        try:
            current = now_ist()
            today = current.date()
            index = slot_index_from_time(current)
            label = DATA[index]["time"]
            price = compute_price_by_index(index)

            ok = upsert_slot(today, index)

            if ok:
                print(f"[OK] [{current.strftime('%I:%M:%S %p')}] Pushed slot {index} ({label}) -> Rs {price}")
            else:
                print(f"[FAIL] [{current.strftime('%I:%M:%S %p')}] Failed to push slot {index}")

            wait_for_next_slot()

        except Exception as e:
            print(f"[ERROR] Loop error: {e}")

            time.sleep(30)


if __name__ == "__main__":
    print("Starting GridX Price Worker...")
    print(f"   Time: {now_ist().strftime('%Y-%m-%d %I:%M:%S %p')} IST")
    print(f"   Supabase: {SUPABASE_URL}")
    print()

    test_connection()
    backfill_today()

    print()
    print("Entering main loop - will push prices at every HH:00 and HH:30...")
    print()

    run_loop()
