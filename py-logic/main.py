import logging
import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone, timedelta
import os
import sys
from supabase import create_client

from pricing import compute_price_by_index, get_dataset_length, DATA

# --- IST TIMEZONE (Finding #14) ---
IST = timezone(timedelta(hours=5, minutes=30))

# --- LOGGING ---   
logger = logging.getLogger("gridx")
logging.basicConfig(level=logging.INFO)

# --- SUPABASE INIT ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("CRITICAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = FastAPI()

# CORS — removed allow_credentials=True (Finding #17: invalid combo with wildcard origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- THREAD LOCK for atomic state updates (Finding #16) ---
state_lock = threading.Lock()

# Global state — status initialised to "balanced" (Finding #10: was "neutral")
state = {
    "current_price": 3.80,
    "last_updated": None,
    "status": "balanced",
    "message": "System stable"
}


def _get_current_index():
    """Compute the current 30-min block index from IST wall clock (Finding #03).
    Replaces the old sequential counter that reset to 0 on every restart."""
    now = datetime.now(tz=IST)
    return (now.hour * 60 + now.minute) // 30 % get_dataset_length()


def update_price():
    """Scheduler job — wrapped in try/except so a crash never kills the scheduler (Finding #07)."""
    try:
        now = datetime.now(tz=IST)
        # IST-clock-based index (Finding #03) — no more sequential counter
        index = (now.hour * 60 + now.minute) // 30 % get_dataset_length()
        row = DATA[index]

        demand = row["demand"]
        supply = row["supply"]

        price = compute_price_by_index(index)

        # --- SYSTEM LOGIC ---
        if supply > demand:
            status = "surplus"
            message = "Electricity is cheaper now. You can increase usage."
        elif demand > supply:
            status = "shortage"
            message = "High demand detected. Reduce usage to save cost."
        else:
            status = "balanced"
            message = "System is stable."

        # --- ATOMIC STATE UPDATE (Finding #16) ---
        with state_lock:
            state.update({
                "current_price": price,
                "last_updated": now.strftime("%H:%M"),
                "status": status,
                "message": message
            })

        logger.info(f"[UPDATE] {row['time']} | Price: ₹{price} | {status.upper()}")

        # --- DUPLICATE INSERT PREVENTION ---
        prevent_insert = False
        try:
            res = supabase.table("dynamic_prices").select("created_at").order("created_at", desc=True).limit(1).execute()
            if res.data and len(res.data) > 0:
                last_time_str = res.data[0]["created_at"]
                last_time = datetime.fromisoformat(last_time_str.replace('Z', '+00:00'))
                utc_now = datetime.now(timezone.utc)
                
                # Exact time-block comparison
                is_same_block = (
                    last_time.year == utc_now.year and
                    last_time.month == utc_now.month and
                    last_time.day == utc_now.day and
                    last_time.hour == utc_now.hour and
                    (last_time.minute // 30) == (utc_now.minute // 30)
                )
                
                if is_same_block:
                    prevent_insert = True
                    logger.info("Duplicate insert prevented: exact time block already satisfied.")
        except Exception as e:
            logger.warning(f"Failed to check duplicates, proceeding: {e}")

        # --- SUPABASE INSERT WITH RETRY ---
        if not prevent_insert:
            data_to_insert = {
                "price": price,
                "demand": demand,
                "supply": supply,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            try:
                supabase.table("dynamic_prices").insert(data_to_insert).execute()
                logger.info("Successfully inserted price to Supabase")
            except Exception as insert_e:
                logger.error(f"Supabase insert failed, retrying once... {insert_e}")
                try:
                    supabase.table("dynamic_prices").insert(data_to_insert).execute()
                    logger.info("Successfully inserted price to Supabase on retry")
                except Exception as retry_e:
                    logger.error(f"Supabase insert failed on retry: {retry_e}")

    except Exception as e:
        logger.error(f"Scheduler job failed: {e}", exc_info=True)


scheduler = BackgroundScheduler()


@app.on_event("startup")
def start_scheduler():
    # misfire_grace_time + max_instances prevent stall on overrun (Finding #12)
    scheduler.add_job(
        update_price, 'cron', minute='0,30',
        misfire_grace_time=60, max_instances=1, replace_existing=True
    )
    scheduler.start()
    # Run once immediately so state is valid from the first request
    update_price()


@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()


# Routes
@app.get("/")
def root():
    return {"status": "API running"}


@app.get("/price")
def get_price():
    index = _get_current_index()
    with state_lock:
        return {
            "time": DATA[index]["time"],
            "price": state["current_price"],
            "status": state["status"],
            "message": state["message"],
            "last_updated": state["last_updated"]
        }


# --- HEALTH ENDPOINT (Finding #13) ---
@app.get("/health")
def health():
    try:
        job = scheduler.get_jobs()[0] if scheduler.get_jobs() else None
        with state_lock:
            return {
                "scheduler_running": scheduler.running,
                "last_updated": state["last_updated"],
                "system_status": "ok",
                "next_run": str(job.next_run_time) if job else None,
                "current_index": _get_current_index(),
            }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "scheduler_running": False,
            "last_updated": None,
            "system_status": "error"
        }