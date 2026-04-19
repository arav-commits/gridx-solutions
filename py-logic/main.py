from fastapi import FastAPI
from price_data import compute_price_by_index, DATA

# 1. Initialize the FastAPI server (This creates the "app" Uvicorn is looking for!)
app = FastAPI()

# 2. Create a basic health check route
@app.get("/")
def read_root():
    return {"status": "GridX Backend is running!"}

# 3. Create an API endpoint to send the price data to your frontend
@app.get("/api/prices")
def get_prices():
    prices_list = []
    
    # This is your exact same loop, but instead of printing, we save it to send to Next.js
    for i in range(len(DATA)):
        price = compute_price_by_index(i)
        prices_list.append({
            "time": DATA[i]["time"], 
            "price": price
        })
        
    return {"data": prices_list}