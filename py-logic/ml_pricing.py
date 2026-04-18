# ml_pricing.py  (FINAL FIXED VERSION - Works with your exact CSV)
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from joblib import dump, load
import os
from datetime import datetime

from pricing import DATA, compute_price_by_index, get_dataset_length, get_time_by_index

MODEL_PATH = "price_model.joblib"

_ml_model = None
_city_columns = None

def _load_and_prepare_data():
    df = pd.read_csv("multi_city_data.csv", engine='python')
    
    # Clean column names
    df.columns = df.columns.str.strip()
    print("🔍 Exact columns in CSV:", list(df.columns))
    
    # Clean " GW" from Demand and Supply
    for col in ['Demand (D)', 'Supply (S)']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.replace(' GW', '').str.strip().astype(float)
    
    # Clean ₹ symbols
    for col in ['Pbase (Govt)', 'Pcustomer (Final)']:
        if col in df.columns:
            df[col] = df[col].astype(str).str.replace('₹', '').str.strip().astype(float)
    
    # Extract hour from Time
    def get_hour(t):
        h = int(t.split(':')[0])
        if 'PM' in t and h != 12:
            h += 12
        if '12:00 AM' in t:
            h = 0
        return h
    df['hour'] = df['Time'].apply(get_hour)
    
    # One-hot encode City
    print(f"✅ Found {df['City'].nunique()} cities")
    df = pd.get_dummies(df, columns=['City'], drop_first=True)
    
    city_cols = [col for col in df.columns if col.startswith('City_')]
    
    X = df[['hour', 'Demand (D)', 'Supply (S)', 'Pbase (Govt)'] + city_cols]
    y = df['Pcustomer (Final)']
    
    print(f"✅ Loaded {len(df)} rows from {df['City'].nunique() if 'City' in df.columns else 'multiple'} cities")
    return X, y, city_cols

def _get_model():
    global _ml_model, _city_columns
    if _ml_model is not None:
        return _ml_model, _city_columns

    if os.path.exists(MODEL_PATH):
        print("✅ Loaded existing ML model")
        _ml_model = load(MODEL_PATH)
        _, _, _city_columns = _load_and_prepare_data()
        return _ml_model, _city_columns

    print("🔄 Training ML model on your full dataset (this may take 4-6 seconds)...")
    X, y, city_cols = _load_and_prepare_data()
    
    model = RandomForestRegressor(n_estimators=150, random_state=42, n_jobs=1)
    model.fit(X, y)
    
    mae = abs(model.predict(X) - y).mean()
    print(f"✅ Model trained successfully! Average error: ₹{mae:.3f}")
    
    dump(model, MODEL_PATH)
    _ml_model = model
    _city_columns = city_cols
    return _ml_model, _city_columns

def predict_price_ml(demand: float, supply: float, pbase: float, time_str: str, city: str = "Delhi"):
    model, city_cols = _get_model()
    hour = int(time_str.split(':')[0])
    if 'PM' in time_str and hour != 12:
        hour += 12
    if '12:00 AM' in time_str:
        hour = 0
    
    features_dict = {
        'hour': hour,
        'Demand (D)': demand,
        'Supply (S)': supply,
        'Pbase (Govt)': pbase
    }
    for c in city_cols:
        features_dict[c] = 1 if city in c else 0
    
    features = pd.DataFrame([features_dict])
    price = model.predict(features)[0]
    return round(max(0.0, min(price, 15.0)), 2)

def get_next_4_slots_ml():
    now = datetime.now()
    current_index = (now.hour * 60 + now.minute) // 30 % get_dataset_length()
    predictions = []
    for i in range(4):
        idx = (current_index + i) % get_dataset_length()
        row = DATA[idx]
        ml_price = predict_price_ml(row['demand'], row['supply'], row['pbase'], row['time'], city="Delhi")
        formula_price = compute_price_by_index(idx)
        predictions.append({
            "time": row['time'],
            "ml_price": ml_price,
            "formula_price": formula_price
        })
    return predictions