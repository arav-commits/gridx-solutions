import React from "react";
import { GlassCard } from "../ui/GlassCard";
import { BsLightningFill, BsSunFill, BsBatteryFull } from "react-icons/bs";

export function GridStatusPanel() {
  return (
    <GlassCard className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-1">
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-emerald-100/60 border-4 border-emerald-50 flex items-center justify-center shrink-0 shadow-sm relative">
          {/* Subtle pulse ring */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-300 animate-ping opacity-20"></div>
          <BsLightningFill className="text-emerald-500 text-3xl" />
        </div>
        
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold font-display text-[color:var(--color-azure)]">Grid Stable</h2>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-200">
              Low Demand
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TrendingDownIcon className="text-emerald-500" />
            <span>Load &darr; 4% in last 10 min <span className="mx-1">&middot;</span> Voltage stable at 231V</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8 pl-4 md:pl-8 md:border-l border-slate-200">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <BsSunFill className="text-orange-400" />
            <span className="text-xl font-bold text-[color:var(--color-azure)]">78%</span>
          </div>
          <span className="text-xs font-medium text-slate-400">Solar</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <BsBatteryFull className="text-[color:var(--color-azure)]" />
            <span className="text-xl font-bold text-[color:var(--color-azure)]">84%</span>
          </div>
          <span className="text-xs font-medium text-slate-400">Battery</span>
        </div>
      </div>
    </GlassCard>
  );
}

function TrendingDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
  );
}
