"use client";

import { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ClusterStatusBar } from "@/components/layout/ClusterStatusBar";
import { GridStatusPanel } from "@/components/dashboard/GridStatusPanel";
import { NextPricePanel } from "@/components/dashboard/NextPricePanel";
import { ActionEngine } from "@/components/dashboard/ActionEngine";
import { Footer } from "@/components/layout/Footer";
import { BsChevronUp } from "react-icons/bs";
import { getCurrentPricingData } from "@/lib/pricing";


type GridUiData = {
  gridStatusName: string;
  zoneColor: string;
  demandLevel: string;
  subtitle: string;
  trend: "rising" | "falling";
};

type TimelineSlot = {
  label: string;
  slotIndex: number;
  price: number | null;
  pending: boolean;
  missing?: boolean;
  fallback?: boolean;
  isCurrent: boolean;
  isLowest: boolean;
  isPeakDay: boolean;
};



function classifySlot(price: number): { label: string; dot: string } {
  if (price <= 5) return { label: "Stable", dot: "🟢" };
  if (price <= 8) return { label: "Moderate", dot: "🟡" };
  if (price <= 10) return { label: "High", dot: "🔴" };
  return { label: "Very High", dot: "🔴" };
}



export default function Home() {

  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [livePriceTime, setLivePriceTime] = useState<string>("");

  const [gridUi, setGridUi] = useState<GridUiData | null>(null);
  const [loading, setLoading] = useState(true);

  const [insightOpen, setInsightOpen] = useState(false);
  const [timeline, setTimeline] = useState<TimelineSlot[]>([]);


  const fetchLiveData = useCallback(async () => {
    try {
      const res = await fetch('/api/prices/current', { cache: 'no-store' });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();

      if (json.price && json.price > 0) {
        setLivePrice(json.price);
        setLivePriceTime(json.time || "");
        setGridUi({
          gridStatusName: json.ui?.gridStatusName || "Grid Stable",
          zoneColor: json.ui?.zoneColor || "green",
          demandLevel: json.ui?.demandLevel || "Low Demand",
          subtitle: json.ui?.subtitle || "",
          trend: json.trend || "falling",
        });
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("[GridX] API unreachable, using local fallback:", err);
    }


    const local = getCurrentPricingData();
    const lp = local.price;
    setLivePrice(lp);
    setLivePriceTime(local.last_updated);

   
    let gs = "Grid Stable", zc = "green", dl = "Low Demand";
    if (lp <= 5) {
      gs = "Grid Stable"; zc = "green"; dl = "Low Demand";
    } else if (lp <= 8) {
      gs = "Moderate Load"; zc = "yellow"; dl = "Moderate Demand";
    } else if (lp <= 10) {
      gs = "High Load"; zc = "red"; dl = "High Demand";
    } else {
      gs = "Very High Load"; zc = "red"; dl = "Very High Demand";
    }

    setGridUi({
      gridStatusName: gs,
      zoneColor: zc,
      demandLevel: dl,
      subtitle: local.message,
      trend: local.status === "shortage" ? "rising" : "falling",
    });
    setLoading(false);
  }, []);


  const fetchTimeline = useCallback(async () => {
    try {
      const res = await fetch('/api/prices/history', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      const apiSlots: { label: string; slotIndex: number; price: number | null; pending: boolean; missing?: boolean; fallback?: boolean }[] = json.slots || [];
      const currentSlotIndex: number = json.currentSlotIndex ?? -1;

      if (apiSlots.length === 0) {
        setTimeline([]);
        return;
      }

      const realPrices = apiSlots.filter(s => !s.pending && s.price !== null).map(s => s.price as number);
      const minP = realPrices.length > 0 ? Math.min(...realPrices) : Infinity;
      const maxP = realPrices.length > 0 ? Math.max(...realPrices) : -Infinity;
      let lowestTagged = false;
      let peakTagged = false;

      const mapped: TimelineSlot[] = apiSlots.map(s => {
        const isCurrent = s.slotIndex === currentSlotIndex;
        let isLowest = false;
        let isPeakDay = false;
        if (!s.pending && s.price !== null) {
          if (!lowestTagged && s.price === minP) { isLowest = true; lowestTagged = true; }
          if (!peakTagged && s.price === maxP) { isPeakDay = true; peakTagged = true; }
        }
        return {
          label: s.label,
          slotIndex: s.slotIndex,
          price: s.price,
          pending: s.pending,
          missing: s.missing,
          fallback: s.fallback,
          isCurrent,
          isLowest,
          isPeakDay,
        };
      });

      setTimeline(mapped);
    } catch (err) {
      console.error("[GridX] Failed to fetch timeline:", err);
    }
  }, []);

  useEffect(() => {

    fetchLiveData();
    fetchTimeline();

    const priceInterval = setInterval(fetchLiveData, 30_000);
    const timelineInterval = setInterval(fetchTimeline, 120_000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(timelineInterval);
    };
  }, [fetchLiveData, fetchTimeline]);


  if (loading || livePrice === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        ⚡ Loading Grid Data...
      </div>
    );
  }

  const uiData = {
    gridStatusName: gridUi?.gridStatusName || "Grid Stable",
    zoneColor: gridUi?.zoneColor || "green",
    demandLevel: gridUi?.demandLevel || "Low Demand",
    subtitle: gridUi?.subtitle || "",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--background)] transition-colors duration-500 relative overflow-x-hidden">

      {/* Background ambient accents */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/30 dark:bg-emerald-900/10 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-5%] w-[40%] h-[50%] rounded-full bg-blue-100/20 dark:bg-blue-900/10 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[30%] w-[30%] h-[40%] rounded-full bg-purple-100/20 dark:bg-purple-900/5 blur-[120px] -z-10 pointer-events-none"></div>

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 w-full">


        <ClusterStatusBar />


        <div className="flex flex-col lg:flex-row gap-6 mt-2">

          <GridStatusPanel
            ui={uiData}
          />

          <NextPricePanel
            price={livePrice}
            trend={gridUi?.trend || "falling"}
          />
        </div>


        <ActionEngine currentPrice={livePrice} />

        <div className="flex justify-center mt-4">
          <button
            onClick={() => {
              setInsightOpen((prev) => !prev);
              if (!insightOpen) fetchTimeline();
            }}
            className="group flex items-center gap-3 bg-[color:var(--glass-bg)] hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all backdrop-blur-md border border-[color:var(--glass-border)] shadow-md rounded-full px-8 py-3.5 hover:scale-105 active:scale-95"
          >
            <BsChevronUp
              className={`text-slate-400 transition-transform duration-300 ${insightOpen ? "rotate-180" : "group-hover:-translate-y-1"
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


        {insightOpen && (
          <div className="bg-[color:var(--glass-bg)] backdrop-blur-lg border border-[color:var(--glass-border)] rounded-2xl p-6 shadow-sm">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold font-display text-[color:var(--color-azure)] text-lg">
                  Today&apos;s Price Timeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Updated till {livePriceTime} IST &middot; Source: Supabase
                </p>
              </div>
              <div className="flex gap-4 text-xs font-bold text-slate-500">
                <span>🟢 Stable ≤₹5</span>
                <span>🟡 Moderate ₹6–8</span>
                <span>🔴 High &gt;₹8</span>
              </div>
            </div>


            {timeline.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Loading timeline data...
              </div>
            ) : (
              <div className="flex flex-col gap-1 max-h-[28rem] overflow-y-auto pr-1">
                {timeline.map((slot) => {
                  const isPending = slot.pending;
                  const isMissing = slot.missing && !isPending;
                  const hasPrice = !isPending && !isMissing && slot.price !== null;
                  const cat = hasPrice ? classifySlot(slot.price as number) : null;

                  return (
                    <div
                      key={slot.slotIndex}
                      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm border transition-colors ${slot.isCurrent
                        ? "bg-[color:var(--color-azure)]/10 border-[color:var(--color-azure)]/20"
                        : isPending
                          ? "opacity-50 border-transparent"
                          : "border-transparent hover:border-[color:var(--glass-border)]"
                        }`}
                    >

                      <span className="text-xs font-bold tabular-nums text-slate-400 w-24 shrink-0">
                        {slot.label}
                      </span>


                      {hasPrice ? (
                        <>
                          <span className="font-bold text-[color:var(--foreground)] w-28 shrink-0">
                            ₹{(slot.price as number).toFixed(1)}/unit
                          </span>
                          <span className="text-xs font-bold shrink-0">
                            {cat!.dot} {cat!.label}
                          </span>
                        </>
                      ) : isMissing ? (
                        <span className="text-xs font-bold text-amber-500 w-28 shrink-0">
                          ⚠ No Data
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 italic w-28 shrink-0">
                          Coming Soon
                        </span>
                      )}


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
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}