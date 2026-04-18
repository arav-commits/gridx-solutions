import logging
import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone, timedelta

from pricing import compute_price_by_index, get_dataset_length, DATA

# --- IST TIMEZONE (Finding #14) ---
IST = timezone(timedelta(hours=5, minutes=30))

# --- LOGGING ---
logger = logging.getLogger("gridx")
logging.basicConfig(level=logging.INFO)

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

    except Exception as e:
        logger.error(f"Scheduler job failed: {e}", exc_info=True)


scheduler = BackgroundScheduler()


@app.on_event("startup")
def start_scheduler():
    # misfire_grace_time + max_instances prevent stall on overrun (Finding #12)
    scheduler.add_job(
        update_price, 'interval', seconds=5,
        misfire_grace_time=1, max_instances=1
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
    job = scheduler.get_jobs()[0] if scheduler.get_jobs() else None
    with state_lock:
        return {
            "scheduler_running": scheduler.running,
            "next_run": str(job.next_run_time) if job else None,
            "last_updated": state["last_updated"],
            "current_index": _get_current_index(),
        }