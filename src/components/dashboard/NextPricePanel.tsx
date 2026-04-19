"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";
import { BsClockHistory, BsArrowDown, BsArrowUp } from "react-icons/bs";
import { getSecondsUntilNextInterval } from "@/utils/time";

interface NextPricePanelProps {
  price?: number;
  trend?: "rising" | "falling";
}

export function NextPricePanel({ price, trend = "falling" }: NextPricePanelProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  // Timer logic
  useEffect(() => {
    const updateTime = () => {
      setTimeLeft(getSecondsUntilNextInterval());
    };

    updateTime(); // initial sync

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${mm.toString().padStart(2, "0")}:${ss
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <GlassCard className="flex flex-col items-center justify-center px-10 text-center shrink-0 min-w-[240px] bg-[color:var(--card-bg)] transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        <BsClockHistory />
        <span>Next Price Update</span>
      </div>

      {/* Timer */}
      <div className="text-5xl font-black font-display text-[color:var(--color-azure)] tracking-tight mb-3 tabular-nums">
        {formatTime(timeLeft)}
      </div>

      {/* Price */}
      <div className="text-xs text-slate-400 font-medium mb-1">
        Current Rate
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-3xl font-bold text-[color:var(--color-azure)]">
          ₹{typeof price === "number" ? price.toFixed(2) : "—"}
        </span>
        <span className="text-sm font-medium text-slate-400">/kWh</span>
      </div>

      {/* Status */}
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${price && price > 4 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/50' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50'}`}>
        {trend === "rising" ? <BsArrowUp strokeWidth={1} /> : <BsArrowDown strokeWidth={1} />}
        <span>{price && price > 4 ? "Peak" : "Off-Peak"}</span>
      </div>
    </GlassCard>
  );
}