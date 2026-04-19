import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 0; // Disable caching

const PRICING_DATA = [
  { time: "12:00 AM", demand: 9.6, supply: 8.6, pbase: 5.12 },
  { time: "12:30 AM", demand: 9.4, supply: 9.0, pbase: 4.76 },
  { time: "1:00 AM", demand: 9.8, supply: 8.9, pbase: 5.00 },
  { time: "1:30 AM", demand: 10.1, supply: 8.9, pbase: 5.21 },
  { time: "2:00 AM", demand: 10.3, supply: 8.8, pbase: 5.37 },
  { time: "2:30 AM", demand: 10.4, supply: 8.6, pbase: 5.47 },
  { time: "3:00 AM", demand: 10.5, supply: 8.5, pbase: 5.50 },
  { time: "3:30 AM", demand: 10.4, supply: 8.4, pbase: 5.47 },
  { time: "4:00 AM", demand: 10.3, supply: 8.2, pbase: 5.37 },
  { time: "4:30 AM", demand: 10.1, supply: 8.1, pbase: 5.21 },
  { time: "5:00 AM", demand: 9.8, supply: 8.1, pbase: 5.00 },
  { time: "5:30 AM", demand: 9.4, supply: 8.0, pbase: 4.76 },
  { time: "6:00 AM", demand: 10.5, supply: 8.0, pbase: 5.50 },
  { time: "6:30 AM", demand: 11.0, supply: 10.5, pbase: 6.46 },
  { time: "7:00 AM", demand: 13.2, supply: 8.0, pbase: 8.04 },
  { time: "7:30 AM", demand: 12.0, supply: 15.5, pbase: 7.81 },
  { time: "8:00 AM", demand: 12.5, supply: 18.0, pbase: 8.00 },
  { time: "8:30 AM", demand: 13.0, supply: 20.5, pbase: 7.81 },
  { time: "9:00 AM", demand: 13.5, supply: 23.0, pbase: 7.27 },
  { time: "9:30 AM", demand: 14.0, supply: 25.5, pbase: 6.46 },
  { time: "10:00 AM", demand: 11.5, supply: 28.0, pbase: 2.50 },
  { time: "10:30 AM", demand: 12.1, supply: 29.3, pbase: 2.48 },
  { time: "11:00 AM", demand: 12.8, supply: 30.5, pbase: 2.43 },
  { time: "11:30 AM", demand: 13.3, supply: 31.5, pbase: 2.35 },
  { time: "12:00 PM", demand: 12.2, supply: 30.2, pbase: 2.38 },
  { time: "12:30 PM", demand: 13.9, supply: 32.8, pbase: 2.13 },
  { time: "1:00 PM", demand: 14.0, supply: 33.0, pbase: 2.00 },
  { time: "1:30 PM", demand: 13.9, supply: 32.8, pbase: 1.87 },
  { time: "2:00 PM", demand: 13.7, supply: 32.3, pbase: 1.75 },
  { time: "2:30 PM", demand: 13.3, supply: 31.5, pbase: 1.65 },
  { time: "3:00 PM", demand: 12.8, supply: 30.5, pbase: 1.57 },
  { time: "3:30 PM", demand: 12.1, supply: 29.3, pbase: 1.52 },
  { time: "4:00 PM", demand: 13.0, supply: 25.0, pbase: 2.50 },
  { time: "4:30 PM", demand: 13.6, supply: 22.5, pbase: 3.44 },
  { time: "5:00 PM", demand: 14.2, supply: 20.0, pbase: 4.38 },
  { time: "5:30 PM", demand: 14.9, supply: 17.5, pbase: 5.31 },
  { time: "6:00 PM", demand: 15.5, supply: 15.0, pbase: 6.25 },
  { time: "6:30 PM", demand: 16.1, supply: 12.5, pbase: 7.19 },
  { time: "7:00 PM", demand: 18.0, supply: 5.0, pbase: 10.00 },
  { time: "7:30 PM", demand: 17.4, supply: 7.5, pbase: 9.06 },
  { time: "8:00 PM", demand: 18.0, supply: 5.0, pbase: 10.00 },
  { time: "8:30 PM", demand: 16.9, supply: 5.5, pbase: 9.39 },
  { time: "9:00 PM", demand: 15.9, supply: 5.9, pbase: 8.78 },
  { time: "9:30 PM", demand: 14.8, supply: 6.3, pbase: 8.17 },
  { time: "10:00 PM", demand: 13.8, supply: 6.8, pbase: 7.56 },
  { time: "10:30 PM", demand: 12.8, supply: 7.2, pbase: 6.95 },
  { time: "11:00 PM", demand: 11.7, supply: 7.7, pbase: 6.34 },
  { time: "11:30 PM", demand: 10.6, supply: 8.2, pbase: 5.73 },
];

function computeLocalPrice(index: number): { price: number; demand: number; supply: number } {
  if (index < 0 || index > 47) return { price: 0, demand: 0, supply: 0 };
  const row = PRICING_DATA[index];
  const d = row.demand;
  const s = row.supply;
  const pb = row.pbase;

  let price = pb;
  if (s !== 0) {
    price = pb + d / s + 0.5;
  }
  price = Math.min(Math.max(price, 0), 15);
  price = Math.round(price * 100) / 100;

  return { price, demand: d, supply: s };
}

export async function GET() {
  try {
    const now = new Date();
    const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const year = istNow.getFullYear();
    const month = String(istNow.getMonth() + 1).padStart(2, '0');
    const day = String(istNow.getDate()).padStart(2, '0');
    const todayIST = `${year}-${month}-${day}`;

    const currentSlotIndex = istNow.getHours() * 2 + (istNow.getMinutes() >= 30 ? 1 : 0);

    const { data: prices, error } = await supabase
      .from('price_logs')
      .select('slot_index, price, slot_time')
      .eq('slot_date', todayIST)
      .lte('slot_index', currentSlotIndex)
      .order('slot_index', { ascending: false })
      .limit(2);

    let currentPrice = 0;
    let oldPrice = 0;
    let timeString = "";
    let isStale = false;
    
    // Format the time directly to slot string for flawless UI integration
    const startH = Math.floor(currentSlotIndex / 2);
    const startM = (currentSlotIndex % 2) * 30;
    timeString = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')} IST`;

    // Try dynamic data fetch match
    if (!error && prices && prices.length > 0 && prices[0].slot_index === currentSlotIndex) {
      currentPrice = Number(prices[0].price);
      if (prices.length > 1) {
        oldPrice = Number(prices[1].price);
      } else {
        oldPrice = computeLocalPrice(currentSlotIndex - 1).price;
      }
    } else {
      // Local Fallback triggered because Supabase is missing data for the current active slot
      isStale = true; // Still flags missing sync, but provides correct simulated price
      currentPrice = computeLocalPrice(currentSlotIndex).price;
      oldPrice = computeLocalPrice(currentSlotIndex - 1).price;
    }

    let isTrendRising = false;
    let trendLabel = "stable";

    if (currentPrice > oldPrice) {
      isTrendRising = true;
      trendLabel = "rising";
    } else if (currentPrice < oldPrice) {
      trendLabel = "falling";
    }

    let gridStatusName = "Grid Stable";
    let zoneColor = "green";
    let demandLevel = "Low Demand";
    let subtitle = `Load ${isTrendRising ? '↑' : '↓'} in last 30 min · Voltage stable`;

    if (currentPrice <= 5) {
      gridStatusName = "Grid Stable"; zoneColor = "green"; demandLevel = "Low Demand";
    } else if (currentPrice <= 8) {
      gridStatusName = "Moderate Load"; zoneColor = "yellow"; demandLevel = "Moderate Demand";
    } else if (currentPrice <= 10) {
      gridStatusName = "High Load"; zoneColor = "red"; demandLevel = "High Demand";
      subtitle = "High load — increasing demand.";
    } else {
      gridStatusName = "Very High Load"; zoneColor = "red"; demandLevel = "Very High Demand";
      subtitle = "Critical load — reduce usage immediately.";
    }

    let generalMessage = "System is stable.";
    let statusLabel = "balanced";
    if (zoneColor === "green") {
      statusLabel = "surplus"; generalMessage = "Electricity is cheaper now. Off-peak hours.";
    } else if (zoneColor === "red") {
      statusLabel = "shortage"; generalMessage = "High demand detected. Peak hours — reduce usage to save cost.";
    } else {
      statusLabel = "balanced"; generalMessage = "Moderate demand. Try to shift heavy loads.";
    }

    if (isStale) {
      generalMessage = "Data is delayed. " + generalMessage;
      subtitle = "⚠ Worker offline. Simulating Grid prices.";
    }

    return NextResponse.json({
      price: currentPrice,
      time: timeString,
      status: statusLabel,
      message: generalMessage,
      trend: trendLabel,
      ui: { gridStatusName, zoneColor, demandLevel, subtitle }
    });

  } catch (err: unknown) {
    console.error("API error:", err);
    return NextResponse.json({
      price: 0,
      time: "No data available",
      status: "balanced",
      message: "Internal Server Error",
      trend: "stable",
      ui: { gridStatusName: "Error", zoneColor: "gray", demandLevel: "Error", subtitle: "System failure" }
    }, { status: 200 });
  }
}
