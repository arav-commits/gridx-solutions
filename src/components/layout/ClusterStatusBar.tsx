"use client";

import React from "react";
import { BsActivity, BsWifi } from "react-icons/bs";
import { useAuth } from "@/context/AuthContext";

export function ClusterStatusBar() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-[color:var(--glass-bg)] backdrop-blur-md border border-[color:var(--glass-border)] rounded-xl px-5 py-3 shadow-sm transition-all duration-300">
      <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <BsActivity className="text-slate-400 dark:text-slate-500" />
          <span>Cluster: <span className="text-[color:var(--color-azure)] font-bold">{user.cluster?.id || "N/A"}</span></span>
        </div>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <BsLightningIndicator />
          <span>Feeder Load: <span className="text-[color:var(--color-azure)] font-bold">62.4 kW</span></span>
        </div>
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/50">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-bold text-xs uppercase tracking-wide">Live</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mt-3 sm:mt-0">
        <BsWifi />
        <span>Syncing to {user.cluster?.name || "Global Grid"} &middot; 30s ago</span>
      </div>
    </div>
  );
}

function BsLightningIndicator() {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polyline points="22 12 18 12 15 21 11 3 8 12 2 12"></polyline></svg>
  );
}
