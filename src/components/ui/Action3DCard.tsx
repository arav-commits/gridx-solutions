"use client";

import React from "react";
import { isTimeExpired } from "@/utils/time";

interface Action3DCardProps {
  timeWindow: string;
  status: "PENDING" | "APPLIED";
  title: string;
  description: string;
  savingText: string;
  savingValue: string;
  savingUnit?: string;
  savingColor: string; 
  savingBgLine: string; 
  progress: number; 
  icon: React.ReactNode;
  iconBgColor: string;
}

export function Action3DCard({
  timeWindow,
  status,
  title,
  description,
  savingText,
  savingValue,
  savingUnit,
  savingColor,
  savingBgLine,
  progress,
  icon,
  iconBgColor,
}: Action3DCardProps) {
  const isApplied = status === "APPLIED";
  const expired = isTimeExpired(timeWindow) && !isApplied;
  
  return (
    <div className={`perspective-1000 w-80 shrink-0 transition-opacity duration-700 ${expired ? "opacity-60 saturate-50 pointer-events-none scale-95" : "opacity-100"}`}>
      <div className="relative group transform-style-3d transition-all duration-500 hover:rotate-x-2 hover:-rotate-y-3 bg-[color:var(--card-bg)] backdrop-blur-lg border border-[color:var(--glass-border)] rounded-2xl p-5 shadow-sm hover:shadow-2xl hover:-translate-y-1 flex flex-col gap-4">
        
        {/* Header: Icon, Time, Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${iconBgColor} dark:bg-opacity-20`}>
              {icon}
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{timeWindow}</span>
          </div>
          <span
            className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase ${
              isApplied
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                : "bg-orange-100/50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
            }`}
          >
            {expired ? "Expired" : status}
          </span>
        </div>

        {/* Body: Title & Details */}
        <div>
          <h3 className="text-[color:var(--color-azure)] font-bold text-lg mb-1 leading-tight font-display tracking-tight transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug font-medium">{description}</p>
        </div>

        {/* Savings Box */}
        <div className={`mt-2 rounded-xl py-3 px-4 flex items-baseline gap-1.5 ${savingBgLine} bg-opacity-20 dark:bg-opacity-10 border border-white/10`}>
          <span className={`font-bold font-display text-xs uppercase tracking-widest ${savingColor}`}>{savingText}</span>
          <span className={`font-black font-display text-xl ${savingColor}`}>{savingValue}</span>
          {savingUnit && <span className={`text-xs font-bold ${savingColor} uppercase tracking-tighter`}>{savingUnit}</span>}
        </div>

        {/* Progress Bar & Footer */}
        <div className="mt-2">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
            <span>Window Utilization</span>
            <span className="font-black">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden p-[1px]">
            <div
              className={`h-full ${isApplied ? "bg-emerald-400" : "bg-orange-400"} rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(52,211,153,0.3)]`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          className={`mt-2 w-full py-3 rounded-xl font-bold transition-all duration-300 transform active:scale-95 ${
            isApplied
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
              : "bg-white/50 dark:bg-slate-800/50 border border-orange-300 dark:border-orange-800/50 text-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500 shadow-sm"
          }`}
        >
          {isApplied ? (
            <span className="flex items-center justify-center gap-2">
               Applied Checkmark
            </span>
          ) : (
            "Review Suggestion"
          )}
        </button>
      </div>
    </div>
  );
}
