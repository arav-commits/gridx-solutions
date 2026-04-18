# pricing.py

DATA = [
    {"time": "7:00 AM","demand": 13.2,"supply": 8.0,"pbase": 8.04},
    {"time": "7:30 AM","demand": 10.7,"supply": 13.4,"pbase": 3.41},
    {"time": "8:00 AM","demand": 10.6,"supply": 19.8,"pbase": 2.38},
    {"time": "8:30 AM","demand": 12.0,"supply": 21.3,"pbase": 3.07},
    {"time": "9:00 AM","demand": 13.6,"supply": 24.5,"pbase": 3.17},
    {"time": "9:30 AM","demand": 11.8,"supply": 25.2,"pbase": 2.88},
    {"time": "10:00 AM","demand": 11.2,"supply": 28.4,"pbase": 2.46},
    {"time": "10:30 AM","demand": 10.6,"supply": 29.6,"pbase": 2.16},
    {"time": "11:00 AM","demand": 11.8,"supply": 30.0,"pbase": 2.37},
    {"time": "11:30 AM","demand": 12.1,"supply": 30.6,"pbase": 2.38},
    {"time": "12:00 PM","demand": 12.2,"supply": 30.2,"pbase": 2.38},
    {"time": "12:30 PM","demand": 11.3,"supply": 31.6,"pbase": 1.97},
    {"time": "1:00 PM","demand": 11.4,"supply": 33.2,"pbase": 1.96},
    {"time": "1:30 PM","demand": 12.9,"supply": 32.8,"pbase": 2.36},
    {"time": "2:00 PM","demand": 12.2,"supply": 28.0,"pbase": 2.46},
    {"time": "2:30 PM","demand": 12.2,"supply": 23.5,"pbase": 3.07},
    {"time": "3:00 PM","demand": 12.9,"supply": 21.9,"pbase": 3.28},
    {"time": "3:30 PM","demand": 11.0,"supply": 19.5,"pbase": 3.18},
    {"time": "4:00 PM","demand": 12.5,"supply": 15.0,"pbase": 5.50},
    {"time": "4:30 PM","demand": 13.8,"supply": 12.0,"pbase": 7.20},
    {"time": "5:00 PM","demand": 14.3,"supply": 11.2,"pbase": 8.14},
    {"time": "5:30 PM","demand": 15.5,"supply": 9.0,"pbase": 9.10},
    {"time": "6:00 PM","demand": 17.4,"supply": 6.0,"pbase": 10.00},
    {"time": "6:30 PM","demand": 18.0,"supply": 5.5,"pbase": 10.00},
    {"time": "7:00 PM","demand": 18.0,"supply": 5.0,"pbase": 10.00},
    {"time": "7:30 PM","demand": 17.5,"supply": 4.9,"pbase": 10.00},
    {"time": "8:00 PM","demand": 17.0,"supply": 4.8,"pbase": 10.00},
    {"time": "8:30 PM","demand": 16.8,"supply": 4.8,"pbase": 10.00},
    {"time": "9:00 PM","demand": 16.5,"supply": 4.8,"pbase": 10.00},
    {"time": "9:30 PM","demand": 14.0,"supply": 6.5,"pbase": 9.00},
    {"time": "10:00 PM","demand": 12.5,"supply": 8.0,"pbase": 7.50},
    {"time": "10:30 PM","demand": 11.0,"supply": 9.0,"pbase": 6.80},
    {"time": "11:00 PM","demand": 10.2,"supply": 9.5,"pbase": 6.53},
    {"time": "11:30 PM","demand": 9.8,"supply": 9.0,"pbase": 5.80},
    {"time": "12:00 AM","demand": 9.6,"supply": 8.6,"pbase": 5.12},
]


def get_dataset_length():
    return len(DATA)


def compute_price_by_index(index: int):
    row = DATA[index]

    d = row["demand"]
    s = row["supply"]
    pb = row["pbase"]

    if s == 0:
        return pb

    dynamic_impact = d / s
    price = pb + dynamic_impact + 0.50

    return round(price, 2)


def get_time_by_index(index: int):
    return DATA[index]["time"]