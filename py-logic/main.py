import logging
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone, timedelta
import os
import sys
from supabase import create_client

from pricing import DATA, compute_price_by_index, get_dataset_length, get_time_by_index
from ml_pricing import predict_price_ml, get_next_4_slots_ml

IST = timezone(timedelta(hours=5, minutes=30))

logger = logging.getLogger("gridx")
logging.basicConfig(level=logging.INFO)

state = {
    "current_price": 3.80,
    "formula_price": 3.80,
    "last_updated": None,
    "status": "balanced",
    "message": "System stable"
}
state_lock = threading.Lock()

scheduler = BackgroundScheduler()

def _get_current_index():
    now = datetime.now(tz=IST)
    return (now.hour * 60 + now.minute) // 30 % get_dataset_length()

def print_full_comparison():
    """Print full ML vs Formula comparison once at startup"""
    print("\n" + "="*80)
    print("FULL COMPARISON: ML Price vs Formula Price (All 35 Slots)")
    print("="*80)
    for i in range(get_dataset_length()):
        row = DATA[i]
        formula = compute_price_by_index(i)
        ml = predict_price_ml(row['demand'], row['supply'], row['pbase'], row['time'], city="Delhi")
        diff = round(ml - formula, 2)
        print(f"{row['time']:12} | ML: ₹{ml:5.2f} | Formula: ₹{formula:5.2f} | Diff: {diff:+.2f}")
    print("="*80 + "\n")

def update_price():
    try:
        now = datetime.now(tz=IST)
        index = _get_current_index()
        row = DATA[index]
        
        formula_price = compute_price_by_index(index)
        ml_price = predict_price_ml(row['demand'], row['supply'], row['pbase'], row['time'])
        
        if row['supply'] > row['demand']:
            status = "surplus"
            message = "Surplus power! Cheap electricity available - use more!"
        else:
            status = "shortage"
            message = "High demand. Reduce heavy usage to save money."
        
        with state_lock:
            state.update({
                "current_price": ml_price,
                "formula_price": formula_price,
                "last_updated": now.strftime("%H:%M"),
                "status": status,
                "message": message
            })
        
        # Reduced logging - only show current update
        logger.info(f"[ML] {row['time']} | ML: ₹{ml_price:.2f} | Formula: ₹{formula_price:.2f}")

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
        logger.error(f"Scheduler failed: {e}", exc_info=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Print full comparison once at startup
    print_full_comparison()
    
    scheduler.add_job(update_price, 'interval', minutes=30, misfire_grace_time=10, max_instances=1)
    scheduler.start()
    update_price()
    logger.info("✅ Dynamic Pricing + ML Started")
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan, title="Delhi Dynamic Pricing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "API running with ML model 🚀"}

@app.get("/price")
def get_price():
    index = _get_current_index()
    with state_lock:
        return {
            "time": DATA[index]["time"],
            "ml_price": round(state["current_price"], 2),
            "formula_price": round(state["formula_price"], 2),
            "status": state["status"],
            "message": state["message"],
            "last_updated": state["last_updated"]
        }

@app.get("/all-prices")
def get_all_prices():
    results = []
    for i in range(get_dataset_length()):
        row = DATA[i]
        formula_price = compute_price_by_index(i)
        ml_price = predict_price_ml(row['demand'], row['supply'], row['pbase'], row['time'], city="Delhi")
        results.append({
            "time": row['time'],
            "ml_price": ml_price,
            "formula_price": formula_price,
            "difference": round(ml_price - formula_price, 2)
        })
    return {"prices": results}

@app.get("/action-cards")
def get_action_cards():
    slots = get_next_4_slots_ml()
    cards = []
    for slot in slots:
        if slot['ml_price'] <= 4.5:
            cards.append({"time": slot['time'], "action": "✅ INCREASE CONSUMPTION NOW", "reason": f"Very cheap power (₹{slot['ml_price']}) - run AC, EV charger, washing machine!"})
        elif slot['ml_price'] >= 9.0:
            cards.append({"time": slot['time'], "action": "⚠️ REDUCE USAGE", "reason": f"Peak price (₹{slot['ml_price']}) - delay high power appliances"})
    return {"cards": cards[:3]}

@app.get("/health")
def health():
    return {"scheduler_running": scheduler.running, "current_index": _get_current_index(), "last_updated": state["last_updated"]}
