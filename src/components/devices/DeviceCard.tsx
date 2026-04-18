"use client";

import React, { useState } from "react";
import { BsSnow, BsTv, BsLightningCharge, BsCpu, BsCheckCircleFill, BsToggleOn, BsToggleOff, BsArrowUpRight, BsX } from "react-icons/bs";
import { PiWashingMachine, PiEmpty } from "react-icons/pi";
import { GlassCard } from "../ui/GlassCard";

interface DeviceCardProps {
  id: string;
  name: string;
  type: string;
  status: "ON" | "OFF";
  optimizationTips: string[];
  onToggle: (id: string) => void;
}

export function DeviceCard({ id, name, type, status, optimizationTips, onToggle }: DeviceCardProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);

  const getIcon = () => {
    switch (name) {
      case "Air Conditioner": return <BsSnow size={24} />;
      case "Television": return <BsTv size={24} />;
      case "Washing Machine": return <PiWashingMachine size={26} />;
      case "Refrigerator": return <BsLightningCharge size={24} />;
      case "Dishwasher": return <BsCpu size={24} />;
      default: return <PiEmpty size={24} />;
    }
  };

  const isOn = status === "ON";

  return (
    <>
      {/* Base Card */}
      <div className="perspective-1000 h-full">
        <GlassCard className="h-full flex flex-col items-center p-6 text-center group transition-all duration-500 hover:rotate-x-1 hover:-rotate-y-2 hover:shadow-xl hover:-translate-y-1 bg-[color:var(--card-bg)] border-[color:var(--glass-border)]">
          {/* Status Indicator Light */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isOn ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300">{isOn ? "Online" : "Offline"}</span>
          </div>

          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${isOn ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300"}`}>
            {getIcon()}
          </div>

          <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-1 font-display tracking-tight">{name}</h3>
          <p className="text-xs text-slate-400 dark:text-slate-300 font-bold uppercase tracking-widest mb-6">{type}</p>

          <div className="mt-auto w-full space-y-3">
            <div className="flex items-center justify-between bg-white/20 dark:bg-black/10 rounded-xl p-2 px-3 border border-white/20">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Power Status</span>
              <button 
                onClick={(e) => { e.stopPropagation(); onToggle(id); }}
                className={`transition-colors duration-300 ${isOn ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"}`}
              >
                {isOn ? <BsToggleOn size={28} /> : <BsToggleOff size={28} />}
              </button>
            </div>

            <button 
              onClick={() => setIsEnlarged(true)}
              disabled={!isOn}
              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                isOn 
                  ? "bg-[color:var(--color-azure)] text-white shadow-lg hover:bg-opacity-90" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-300 cursor-not-allowed border border-slate-200 dark:border-slate-700"
              }`}
            >
              View Details <BsArrowUpRight strokeWidth={1.5} />
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Enlarged Glassmorphic Modal */}
      {isEnlarged && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <GlassCard className="w-full max-w-lg p-10 relative bg-[color:var(--card-bg)] backdrop-blur-3xl border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 slide-in-from-bottom-5 duration-500 h-auto">
            <button 
              onClick={() => setIsEnlarged(false)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[color:var(--color-azure)] transition-colors"
            >
              <BsX size={24} />
            </button>

            <div className="flex items-center gap-6 mb-10">
              <div className="w-20 h-20 rounded-3xl bg-[color:var(--color-azure)] text-white flex items-center justify-center shadow-2xl">
                {getIcon()}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-black font-display text-[color:var(--color-azure)] tracking-tight">{name}</h2>
                  <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${isOn ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOn ? "bg-emerald-500" : "bg-red-500"}`} /> {isOn ? "Online" : "Offline"}
                  </div>
                </div>
                <p className="text-slate-400 dark:text-slate-300 font-bold uppercase text-xs tracking-[0.2em]">{type} Node &middot; {id}</p>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/30 rounded-3xl p-6 border border-white/50 dark:border-slate-700/50 shadow-inner mb-8">
              <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400">
                <BsLightningCharge size={14} className="text-yellow-500" />
                <h4 className="text-xs font-black uppercase tracking-widest">Smart Optimizations</h4>
              </div>
              <ul className="space-y-4">
                {optimizationTips.map((tip, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">
                      <BsCheckCircleFill className="text-emerald-500" size={16} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between p-6 bg-[color:var(--color-azure)] rounded-3xl shadow-xl">
              <div className="text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Device Power Control</p>
                <h4 className="text-lg font-bold">Power Management</h4>
              </div>
              <button 
                onClick={() => onToggle(id)}
                className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  isOn 
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-lg" 
                    : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
                }`}
              >
                {isOn ? "Power Off" : "Power On"}
              </button>
            </div>
            
            <p className="text-center mt-8 text-[10px] font-bold text-slate-400 dark:text-slate-300 uppercase tracking-widest">
              GridX IoT Engine &middot; End-to-End Encryption Enabled
            </p>
          </GlassCard>
        </div>
      )}
    </>
  );
}
