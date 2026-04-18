from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

from pricing import compute_price_by_index, get_dataset_length, DATA

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
state = {
    "current_price": 3.80,
    "last_updated": None,
    "index": 0,
    "status": "neutral",
    "message": "System stable"
}


def update_price():
    index = state["index"]
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

    # --- UPDATE STATE ---
    state["current_price"] = price
    state["last_updated"] = datetime.now().strftime("%H:%M")
    state["status"] = status
    state["message"] = message

    print(f"[UPDATE] {row['time']} | Price: ₹{price} | {status.upper()}")

    state["index"] = (index + 1) % get_dataset_length()


scheduler = BackgroundScheduler()


@app.on_event("startup")
def start_scheduler():
    scheduler.add_job(update_price, 'interval', seconds=5)  # simulate 30 mins
    scheduler.start()


@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()


# Routes
@app.get("/")
def root():
    return {"status": "API running"}


@app.get("/price")
def get_price():
    return {
        "time": DATA[state["index"]]["time"],
        "price": state["current_price"],
        "status": state["status"],
        "message": state["message"],
        "last_updated": state["last_updated"]
    }