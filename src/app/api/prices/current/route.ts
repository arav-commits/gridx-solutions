import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 0; // Disable caching


export async function GET() {
  try {

    const now = new Date();
    const istNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const year = istNow.getFullYear();
    const month = String(istNow.getMonth() + 1).padStart(2, '0');
    const day = String(istNow.getDate()).padStart(2, '0');
    const todayIST = `${year}-${month}-${day}`;

    const { data: prices, error } = await supabase
      .from('price_logs')
      .select('slot_index, price, slot_time')
      .eq('slot_date', todayIST)
      .order('slot_index', { ascending: false })
      .limit(2);

    const fallbackData = {
      price: 0,
      time: "No data available",
      status: "balanced",
      message: "Awaiting price data from worker.",
      trend: "stable",
      ui: { gridStatusName: "Data Missing", zoneColor: "gray", demandLevel: "Unknown", subtitle: "Awaiting data..." }
    };

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json(fallbackData, { status: 200 });
    }

    if (!prices || prices.length === 0) {
      return NextResponse.json(fallbackData, { status: 200 });
    }

    const currentPriceData = prices[0];
    const currentPrice = Number(currentPriceData.price);

    const slotTimeMs = new Date(currentPriceData.slot_time).getTime();
    const isStale = Date.now() - slotTimeMs > 45 * 60 * 1000;


    let isTrendRising = false;
    let trendLabel = "stable";

    if (prices.length > 1) {
      const oldPrice = Number(prices[1].price);
      if (currentPrice > oldPrice) {
        isTrendRising = true;
        trendLabel = "rising";
      } else if (currentPrice < oldPrice) {
        trendLabel = "falling";
      }
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
      subtitle = "⚠ Waiting for real-time update...";
    }


    let timeString = new Date(currentPriceData.slot_time).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
    });

    if (isStale) {
      timeString += " (Delayed)";
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
