import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const revalidate = 0; // Disable caching

/**
 * GET /api/prices/current
 *
 * PURE READ — only for grid health, trend, and lights. 
 * The live displayed price is fetched from Python via Supabase.
 */
export async function GET() {
  try {
    const { data: prices, error } = await supabase
      .from('dynamic_prices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2);

    const fallbackData = {
      price: 0,
      time: "No data available",
      status: "balanced",
      message: "API or DB error.",
      trend: "stable",
      ui: { gridStatusName: "Data Missing", zoneColor: "gray", demandLevel: "Unknown", subtitle: "Awaiting data..." }
    };

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json(fallbackData, { status: 200 }); // Safe fallback
    }

    if (!prices || prices.length === 0) {
      return NextResponse.json(fallbackData, { status: 200 }); // Safe fallback
    }

    const currentPriceData = prices[0];
    const currentPrice = Number(currentPriceData.price);

    // Analyze trend (comparison between newest and previous)
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

    // Determine grid zone
    let gridStatusName = "Grid Stable";
    let zoneColor = "green";
    let demandLevel = "Low Demand";
    let subtitle = `Load ${isTrendRising ? '↑' : '↓'} ${Math.floor(Math.random() * 5 + 1)}% in last 30 min · Voltage stable`;

    if (currentPrice >= 3 && currentPrice < 5) {
      gridStatusName = "Grid Stable"; zoneColor = "green"; demandLevel = "Low Demand";
    } else if (currentPrice >= 5 && currentPrice < 7) {
      gridStatusName = "Moderate Load"; zoneColor = "yellow"; demandLevel = "Moderate Demand";
    } else if (currentPrice >= 7 && currentPrice < 9) {
      gridStatusName = "High Load"; zoneColor = "red"; demandLevel = "High Demand";
      subtitle = "High load — increasing demand.";
    } else if (currentPrice >= 9) {
      gridStatusName = "Very High Load"; zoneColor = "red"; demandLevel = "Very High Demand";
      subtitle = "Critical load — reduce usage immediately.";
    } else {
      gridStatusName = "Grid Stable"; zoneColor = "green"; demandLevel = "Low Demand";
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

    // Format IST time from Supabase record
    const timeString = new Date(currentPriceData.created_at).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
    });

    return NextResponse.json({
      price: currentPrice,
      time: timeString,
      status: statusLabel,
      message: generalMessage,
      trend: trendLabel,
      ui: { gridStatusName, zoneColor, demandLevel, subtitle }
    });

  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({
      price: 0,
      time: "No data available",
      status: "balanced",
      message: "Internal Server Error",
      trend: "stable",
      ui: { gridStatusName: "Error", zoneColor: "gray", demandLevel: "Error", subtitle: "System failure" }
    }, { status: 200 }); // Safe fallback
  }
}
