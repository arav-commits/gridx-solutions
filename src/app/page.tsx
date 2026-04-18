"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ClusterStatusBar } from "@/components/layout/ClusterStatusBar";
import { GridStatusPanel } from "@/components/dashboard/GridStatusPanel";
import { NextPricePanel } from "@/components/dashboard/NextPricePanel";
import { ActionEngine } from "@/components/dashboard/ActionEngine";
import { Footer } from "@/components/layout/Footer";
import { BsChevronUp } from "react-icons/bs";
import { getCurrentPricingData, PriceData, PRICING_DATA } from "@/lib/pricing";
import { getSecondsUntilNextInterval } from "@/utils/time";

// ── Price Insights helpers (module-level, no UI logic) ──────────────────────
function parseSlotMinutes(timeStr: string): number {
  const parts = timeStr.split(" ");
  if (parts.length !== 2) return -1;
  const [hStr, mStr] = parts[0].split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (parts[1] === "PM" && h !== 12) h += 12;
  if (parts[1] === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function computeSlotPrice(row: { demand: number; supply: number; pbase: number }): number {
  const dynamic = row.supply !== 0 ? row.demand / row.supply : 0;
  return Math.round((row.pbase + dynamic + 0.5) * 10) / 10;
}

function classifySlot(price: number): { label: string; dot: string } {
  if (price <= 6) return { label: "Low",      dot: "🟢" };
  if (price < 8)  return { label: "Moderate", dot: "🟡" };
  return             { label: "High",     dot: "🔴" };
}

function buildPriceTimeline() {
  const now             = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const currentMins     = now.getHours() * 60 + now.getMinutes();
  const currentSlotStart = currentMins - (currentMins % 30);

  // Slot start (minutes) → computed price
  const priceMap = new Map<number, number>();
  PRICING_DATA.forEach((row) => {
    const mins = parseSlotMinutes(row.time);
    if (mins >= 0) priceMap.set(mins, computeSlotPrice(row));
  });

  // Day-wide min/max for tagging — based on all available PRICING_DATA
  const allPrices   = [...priceMap.values()];
  const minPriceDay = allPrices.length ? Math.min(...allPrices) : Infinity;
  const maxPriceDay = allPrices.length ? Math.max(...allPrices) : -Infinity;

  // Tag only the FIRST slot matching min/max to avoid duplicate tags
  let lowestTagged = false;
  let peakTagged   = false;

  const slots = [];
  for (let start = 0; start <= currentSlotStart; start += 30) {
    const end   = start + 30;
    const h1    = Math.floor(start / 60);
    const m1    = start % 60;
    const h2    = Math.floor(end / 60) % 24;
    const m2    = end % 60;
    const pad   = (n: number) => String(n).padStart(2, "0");
    const label = `${pad(h1)}:${pad(m1)}–${pad(h2)}:${pad(m2)}`;
    const price = priceMap.get(start);
    const isCurrent = start === currentSlotStart;
    let   isLowest  = false;
    let   isPeakDay = false;

    if (price !== undefined) {
      if (!lowestTagged && price === minPriceDay) { isLowest  = true; lowestTagged = true; }
      if (!peakTagged   && price === maxPriceDay) { isPeakDay = true; peakTagged   = true; }
    }
    slots.push({ label, price, isCurrent, isLowest, isPeakDay });
  }
  return slots;
}
// ─────────────────────────────────────────────────────────────────────────────

// Supplementary UI data from Supabase (grid lights, trend)
export type GridUiData = {
  gridStatusName: string;
  zoneColor: string;
  demandLevel: string;
  subtitle: string;
  trend: "rising" | "falling";
};

export default function Home() {
  // Price from Python pricing engine (via pricing.ts) — the source of truth
  const [livePrice, setLivePrice] = useState<PriceData | null>(null);
  // Supplementary UI grid health from Supabase (lights, trend)
  const [gridUi, setGridUi] = useState<GridUiData | null>(null);
  const [loading, setLoading] = useState(true);
  // Controls the "View Deep Insights" expandable panel
  const [insightOpen, setInsightOpen] = useState(false);

  // Track which 30-min block we last pushed to Supabase
  const lastPushedBlockRef = useRef<number>(-1);

  /**
   * Compute the current 30-minute block index from IST clock.
   * Returns a unique integer per block (e.g. 28 for "2:00 PM").
   */
  const getCurrentBlockIndex = useCallback(() => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    // Returns the block number (0-47 for a 24h day in 30-min intervals)
    return Math.floor(totalMinutes / 30);
  }, []);

  /**
   * Push current price to Supabase via the cron endpoint.
   * This is called only when a new 30-minute block starts.
   */
  const pushPriceToSupabase = useCallback(async () => {
    try {
      await fetch('/api/cron/update-price');
      console.log("[GridX] Price pushed to Supabase at new 30-min block.");
    } catch (err) {
      console.error("[GridX] Failed to push price to Supabase:", err);
    }
  }, []);

  /**
   * Fetch supplementary grid health data from Supabase.
   * Only used for trend arrows, zone lights — NOT for the live price.
   */
  const fetchGridHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/prices/current');
      if (res.ok) {
        const json = await res.json();
        setGridUi({
          gridStatusName: json.ui?.gridStatusName || "Grid Stable",
          zoneColor: json.ui?.zoneColor || "green",
          demandLevel: json.ui?.demandLevel || "Low Demand",
          subtitle: json.ui?.subtitle || "",
          trend: json.trend || "falling",
        });
      }
    } catch (err) {
      console.error("[GridX] Failed to fetch grid health:", err);
    }
  }, []);

  /**
   * Core tick — runs every second.
   * 1. Reads price from pricing.ts (Python engine mirror) ← SOURCE OF TRUTH
   * 2. Detects new 30-min block and pushes to Supabase
   */
  const tick = useCallback(() => {
    // Step 1: Compute live price from the pricing engine (same logic as Python)
    const priceData = getCurrentPricingData();
    setLivePrice(priceData);
    if (loading) setLoading(false);

    // Step 2: Detect 30-min block boundary and push to Supabase
    const currentBlock = getCurrentBlockIndex();
    if (lastPushedBlockRef.current !== currentBlock) {
      lastPushedBlockRef.current = currentBlock;
      pushPriceToSupabase();
      // Also refresh grid health after a short delay (Supabase needs the insert to settle)
      setTimeout(fetchGridHealth, 3000);
    }
  }, [getCurrentBlockIndex, pushPriceToSupabase, fetchGridHealth, loading]);

  useEffect(() => {
    // Initial load
    tick();
    fetchGridHealth();

    // Tick every second to keep timer and live price in sync
    const interval = setInterval(tick, 1000);
    // Refresh grid health from Supabase every 60 seconds (trend / lights)
    const healthInterval = setInterval(fetchGridHealth, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(healthInterval);
    };
  }, [tick, fetchGridHealth]);

  // 30-min price timeline — recomputes each time the pricing block changes
  const timeline = useMemo(() => buildPriceTimeline(), [livePrice?.time]);

  if (loading || !livePrice) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        ⚡ Loading Grid Data...
      </div>
    );
  }

  // Build the UI props — live price always from pricing engine, lights from Supabase
  const uiData = {
    gridStatusName: gridUi?.gridStatusName || livePrice.status === "surplus" ? "Grid Stable" : livePrice.status === "shortage" ? "High Load" : "Moderate Load",
    zoneColor: gridUi?.zoneColor || (livePrice.status === "surplus" ? "green" : livePrice.status === "shortage" ? "red" : "yellow"),
    demandLevel: gridUi?.demandLevel || "Normal Demand",
    subtitle: gridUi?.subtitle || livePrice.message,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--background)] transition-colors duration-500 relative overflow-x-hidden">
      
      {/* Background ambient accents */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/30 dark:bg-emerald-900/10 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-5%] w-[40%] h-[50%] rounded-full bg-blue-100/20 dark:bg-blue-900/10 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[30%] w-[30%] h-[40%] rounded-full bg-purple-100/20 dark:bg-purple-900/5 blur-[120px] -z-10 pointer-events-none"></div>

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 w-full">
        
        {/* Cluster status */}
        <ClusterStatusBar />

        {/* Top Panels */}
        <div className="flex flex-col lg:flex-row gap-6 mt-2">
          
          <GridStatusPanel
            ui={uiData}
          />

          <NextPricePanel
            price={livePrice.price}
            trend={gridUi?.trend || (livePrice.status === "shortage" ? "rising" : "falling")}
          />
        </div>

        {/* Action Engine — receives live price; all card savings computed from it */}
        <ActionEngine currentPrice={livePrice.price} />

        {/* Call to action bar */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setInsightOpen((prev) => !prev)}
            className="group flex items-center gap-3 bg-[color:var(--glass-bg)] hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all backdrop-blur-md border border-[color:var(--glass-border)] shadow-md rounded-full px-8 py-3.5 hover:scale-105 active:scale-95"
          >
            <BsChevronUp
              className={`text-slate-400 transition-transform duration-300 ${
                insightOpen ? "rotate-180" : "group-hover:-translate-y-1"
              }`}
            />
            <span className="font-bold text-[color:var(--color-azure)] font-display tracking-tight">
              View Deep Insights
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-black ml-2 animate-pulse">
              Live Grid Data
            </span>
          </button>
        </div>

        {/* ── Today's Price Timeline panel ── */}
        {insightOpen && (
          <div className="bg-[color:var(--glass-bg)] backdrop-blur-lg border border-[color:var(--glass-border)] rounded-2xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold font-display text-[color:var(--color-azure)] text-lg">
                  Today&apos;s Price Timeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Updated till {livePrice.last_updated} IST
                </p>
              </div>
              <div className="flex gap-4 text-xs font-bold text-slate-500">
                <span>🟢 Low ≤₹6</span>
                <span>🟡 Moderate ₹6–8</span>
                <span>🔴 High ≥₹8</span>
              </div>
            </div>

            {/* Timeline rows */}
            <div className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-1">
              {timeline.map((slot) => {
                const hasPriceData = slot.price !== undefined;
                const cat = hasPriceData && slot.price !== undefined
                  ? classifySlot(slot.price)
                  : null;
                return (
                  <div
                    key={slot.label}
                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm border transition-colors ${
                      slot.isCurrent
                        ? "bg-[color:var(--color-azure)]/10 border-[color:var(--color-azure)]/20"
                        : "border-transparent hover:border-[color:var(--glass-border)]"
                    }`}
                  >
                    {/* Time slot */}
                    <span className="text-xs font-bold tabular-nums text-slate-400 w-24 shrink-0">
                      {slot.label}
                    </span>

                    {/* Price or Coming Soon */}
                    {hasPriceData && slot.price !== undefined ? (
                      <>
                        <span className="font-bold text-[color:var(--foreground)] w-28 shrink-0">
                          ₹{slot.price.toFixed(1)}/unit
                        </span>
                        {cat && (
                          <span className="text-xs font-bold shrink-0">
                            {cat.dot} {cat.label}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Coming Soon</span>
                    )}

                    {/* Optional tags */}
                    <div className="flex gap-1.5 ml-auto">
                      {slot.isCurrent && (
                        <span className="text-[10px] font-black tracking-wider px-2 py-0.5 bg-[color:var(--color-azure)]/20 text-[color:var(--color-azure)] rounded-full">
                          CURRENT
                        </span>
                      )}
                      {slot.isLowest && (
                        <span className="text-[10px] font-black tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                          LOWEST TODAY
                        </span>
                      )}
                      {slot.isPeakDay && (
                        <span className="text-[10px] font-black tracking-wider px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                          PEAK TODAY
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}