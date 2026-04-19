
from price_data import compute_price_by_index, DATA

print("[INFO] Debug Mode\n")

for i in range(len(DATA)):
    price = compute_price_by_index(i)
    print(DATA[i]["time"], "-> Rs", price)