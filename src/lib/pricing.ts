import { getISTTime } from "@/utils/time";

export const PRICING_DATA = [
  { time: "7:00 AM", demand: 13.2, supply: 8.0, pbase: 8.04 },
  { time: "7:30 AM", demand: 10.7, supply: 13.4, pbase: 3.41 },
  { time: "8:00 AM", demand: 10.6, supply: 19.8, pbase: 2.38 },
  { time: "8:30 AM", demand: 12.0, supply: 21.3, pbase: 3.07 },
  { time: "9:00 AM", demand: 13.6, supply: 24.5, pbase: 3.17 },
  { time: "9:30 AM", demand: 11.8, supply: 25.2, pbase: 2.88 },
  { time: "10:00 AM", demand: 11.2, supply: 28.4, pbase: 2.46 },
  { time: "10:30 AM", demand: 10.6, supply: 29.6, pbase: 2.16 },
  { time: "11:00 AM", demand: 11.8, supply: 30.0, pbase: 2.37 },
  { time: "11:30 AM", demand: 12.1, supply: 30.6, pbase: 2.38 },
  { time: "12:00 PM", demand: 12.2, supply: 30.2, pbase: 2.38 },
  { time: "12:30 PM", demand: 11.3, supply: 31.6, pbase: 1.97 },
  { time: "1:00 PM", demand: 11.4, supply: 33.2, pbase: 1.96 },
  { time: "1:30 PM", demand: 12.9, supply: 32.8, pbase: 2.36 },
  { time: "2:00 PM", demand: 12.2, supply: 28.0, pbase: 2.46 },
  { time: "2:30 PM", demand: 12.2, supply: 23.5, pbase: 3.07 },
  { time: "3:00 PM", demand: 12.9, supply: 21.9, pbase: 3.28 },
  { time: "3:30 PM", demand: 11.0, supply: 19.5, pbase: 3.18 },
  { time: "4:00 PM", demand: 12.5, supply: 15.0, pbase: 5.50 },
  { time: "4:30 PM", demand: 13.8, supply: 12.0, pbase: 7.20 },
  { time: "5:00 PM", demand: 14.3, supply: 11.2, pbase: 8.14 },
  { time: "5:30 PM", demand: 15.5, supply: 9.0, pbase: 9.10 },
  { time: "6:00 PM", demand: 17.4, supply: 6.0, pbase: 10.00 },
  { time: "6:30 PM", demand: 18.0, supply: 5.5, pbase: 10.00 },
  { time: "7:00 PM", demand: 18.0, supply: 5.0, pbase: 10.00 },
  { time: "7:30 PM", demand: 17.5, supply: 4.9, pbase: 10.00 },
  { time: "8:00 PM", demand: 17.0, supply: 4.8, pbase: 10.00 },
  { time: "8:30 PM", demand: 16.8, supply: 4.8, pbase: 10.00 },
  { time: "9:00 PM", demand: 16.5, supply: 4.8, pbase: 10.00 },
  { time: "9:30 PM", demand: 14.0, supply: 6.5, pbase: 9.00 },
  { time: "10:00 PM", demand: 12.5, supply: 8.0, pbase: 7.50 },
  { time: "10:30 PM", demand: 11.0, supply: 9.0, pbase: 6.80 },
  { time: "11:00 PM", demand: 10.2, supply: 9.5, pbase: 6.53 },
  { time: "11:30 PM", demand: 9.8, supply: 9.0, pbase: 5.80 },
  { time: "12:00 AM", demand: 9.6, supply: 8.6, pbase: 5.12 },
];

export type PriceData = {
  time: string;
  price: number;
  status: "surplus" | "shortage" | "balanced";
  message: string;
  last_updated: string;
};

function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(" ");
  if (parts.length !== 2) return 0;
  const time = parts[0];
  const period = parts[1];
  const timeParts = time.split(":");
  let hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  if (period === "PM" && hours !== 12) {
    hours += 12;
  }
  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

export function getCurrentPricingData(): PriceData {
  const now = getISTTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find the nearest 30 minute interval backwards (e.g. 14:15 -> 14:00)
  const intervalMinutes = currentMinutes - (currentMinutes % 30);

  // Find the matching row in data
  let matchedRow = PRICING_DATA.find((row) => parseTimeToMinutes(row.time) === intervalMinutes);

  // Fallback to closest or default
  if (!matchedRow) {
    // If we're between 12:30 AM and 6:30 AM, just use 7:00 AM as a fallback or 12:00 AM.
    // Let's just fallback to the last item (12:00 AM) if before 7:00 AM
    if (intervalMinutes < parseTimeToMinutes("7:00 AM")) {
      matchedRow = PRICING_DATA[PRICING_DATA.length - 1]; // 12:00 AM
    } else {
      matchedRow = PRICING_DATA[PRICING_DATA.length - 1]; // fallback
    }
  }

  const demand = matchedRow.demand;
  const supply = matchedRow.supply;
  const pbase = matchedRow.pbase;

  // Compute price
  let price = pbase;
  if (supply !== 0) {
    const dynamicImpact = demand / supply;
    price = pbase + dynamicImpact + 0.50;
  }
  // Round to 2 decimal places
  price = Math.round(price * 100) / 100;

  // Compute Status
  let status: "surplus" | "shortage" | "balanced" = "balanced";
  let message = "System is stable.";

  if (supply > demand) {
    status = "surplus";
    message = "Electricity is cheaper now. You can increase usage.";
  } else if (demand > supply) {
    status = "shortage";
    message = "High demand detected. Reduce usage to save cost.";
  } else {
    status = "balanced";
    message = "System is stable.";
  }

  return {
    time: matchedRow.time,
    price,
    status,
    message,
    last_updated: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}
