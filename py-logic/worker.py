# worker.py

import os
import time
import datetime
import pytz
from dotenv import load_dotenv

# Try loading from root .env.local if present, else standard .env
load_dotenv("../.env.local")
load_dotenv("../.env")
load_dotenv(".env")

from price_data import compute_price_by_index, get_dataset_length, DATA
from supabase import create_client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
# The worker REQUIRES the Service Role Key to bypass insert RLS on dynamic_prices.
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY missing from .env. Using hardcoded service key fallback for writes.")
    # For local test transition, if .env is missing, we fallback to hardcoded (NOT RECOMMENDED for production)
    SUPABASE_URL = "https://jijcogmlrmiznurassuc.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppamNvZ21scm1pem51cmFzc3VjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ3NDQyMCwiZXhwIjoyMDkyMDUwNDIwfQ.eXVPuBzGsmqTVtRSfWejEtDAHRWv-HQGdAV34wrbj0c"

# Create client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
total_slots = get_dataset_length()
ist_tz = pytz.timezone("Asia/Kolkata")

def get_current_ist_time():
    return datetime.datetime.now(ist_tz)

def calculate_time_slot_index(now_ist):
    """
    Calculates the current 30-min slot index based on IST time.
    00:00 -> index 0
    00:30 -> index 1
    ...
    23:30 -> index 47
    """
    hour = now_ist.hour
    minute = now_ist.minute
    return (hour * 2) + (1 if minute >= 30 else 0)

def calculate_seconds_until_next_slot(now_ist):
    """
    Calculates exact seconds to sleep until the next 00 or 30 minute mark.
    Adds a small 5-second buffer to ensure the execution happens firmly inside the next slot.
    """
    if now_ist.minute < 30:
        next_minute = 30
        next_hour = now_ist.hour
    else:
        next_minute = 0
        next_hour = (now_ist.hour + 1) % 24
        
    # Calculate next slot time today
    now_naive = now_ist.replace(tzinfo=None)
    next_slot = now_naive.replace(hour=next_hour, minute=next_minute, second=0, microsecond=0)
    
    if next_hour == 0 and now_ist.hour == 23:
        next_slot += datetime.timedelta(days=1)
        
    delta = (next_slot - now_naive).total_seconds()
    return max(0, delta) + 5  # 5s buffer to avoid running early

def push_price():
    now_ist = get_current_ist_time()
    index = calculate_time_slot_index(now_ist)

    row = DATA[index]
    price = compute_price_by_index(index)
    
    # We round created_at to the current slot mark (00 or 30) for consistency
    slot_minute = 30 if now_ist.minute >= 30 else 0
    created_at = now_ist.replace(minute=slot_minute, second=0, microsecond=0)

    data = {
        "price": float(price),
        "demand": float(row["demand"]),
        "supply": float(row["supply"]),
        "created_at": created_at.astimezone(datetime.UTC).isoformat()
    }

    # Robust insertion with retry logic
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Ensure no duplication in the same exact slot timestamp
            response = supabase.table("dynamic_prices").insert(data).execute()
            print(f"✅ [{now_ist.strftime('%I:%M %p')}] Inserted: {data}")
            return
        except Exception as e:
            err_str = str(e)
            print(f"⚠️ Attempt {attempt + 1} failed: {err_str[:100]}...")
            if "duplicate key value" in err_str.lower() or "23505" in err_str:
                print("ℹ️ Data for this slot already exists. Skipping.")
                return
            time.sleep(10) # Wait 10s before retry

    print("❌ Critical: Failed to push price after max retries")

def test_connection():
    try:
        res = supabase.table("dynamic_prices").select("id").limit(1).execute()
        print("✅ Supabase connection OK")
    except Exception as e:
        print("❌ Supabase connection failed:", e)
        exit(1)

if __name__ == "__main__":
    print("🚀 Worker started (Stateless Mode)")
    test_connection()

    while True:
        try:
            push_price()
            
            # Wait for next exact slot
            now_ist = get_current_ist_time()
            sleep_duration = calculate_seconds_until_next_slot(now_ist)
            
            print(f"⏳ Sleeping for {int(sleep_duration)} seconds until next slot...\n")
            time.sleep(sleep_duration)

        except Exception as e:
            print("❌ Loop Error:", e)
            time.sleep(60) # Fallback sleep to avoid rapid crash loops
