"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { INITIAL_DEVICES, Device } from "@/data/mockData";
import { BsCpu, BsWifi, BsArrowRepeat } from "react-icons/bs";

export default function MyDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("gridx-devices");
    if (saved) {
      setDevices(JSON.parse(saved));
    } else {
      setDevices(INITIAL_DEVICES);
    }
  }, []);

  const handleToggle = (id: string) => {
    const updated = devices.map(d => 
      d.id === id ? { ...d, status: d.status === "ON" ? "OFF" : "ON" as "ON" | "OFF" } : d
    );
    setDevices(updated);
    localStorage.setItem("gridx-devices", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--background)] transition-colors duration-500 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed top-[-5%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/20 dark:bg-blue-900/20 blur-[100px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/20 dark:bg-emerald-900/15 blur-[100px] -z-10 pointer-events-none"></div>

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full mb-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-[color:var(--color-azure)] rounded-full" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-300">Device Management</p>
            </div>
            <h1 className="text-4xl font-extrabold font-display text-[color:var(--color-azure)] tracking-tight">My Devices</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mt-2">Manage your connected appliances and optimize energy consumption in real-time.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-[color:var(--glass-bg)] backdrop-blur-md border border-[color:var(--glass-border)] rounded-2xl p-4 px-6 flex items-center gap-4 shadow-sm transition-all duration-300">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest leading-none mb-1">Status</span>
                <div className="flex items-center gap-1.5 text-emerald-600 font-black text-sm uppercase">
                   <BsWifi /> Online
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest leading-none mb-1">Nodes</span>
                <span className="text-[color:var(--color-azure)] font-black text-sm">{devices.length} Devices</span>
              </div>
            </div>
            
            <button className="w-14 h-14 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[color:var(--color-azure)] hover:shadow-lg transition-all active:scale-95 group">
              <BsArrowRepeat className="group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {devices.map((device) => (
            <DeviceCard 
              key={device.id} 
              {...device} 
              onToggle={handleToggle} 
            />
          ))}
        </div>

        {/* Global Stats bar */}
        <div className="mt-16 bg-[color:var(--color-azure)] p-1 rounded-3xl group transition-all duration-500 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 px-10 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors duration-500">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[color:var(--color-azure)]">
                <BsCpu size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 font-display tracking-tight">System Performance</h3>
                <p className="text-sm text-slate-400 dark:text-slate-300 font-medium">Smart optimization active across {devices.filter(d => d.status === "ON").length} devices.</p>
              </div>
            </div>
            
            <div className="flex gap-12">
              <div className="text-center">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest leading-none mb-2 block">IoT Load</span>
                <span className="text-2xl font-black text-[color:var(--color-azure)] font-display tracking-tighter">1.24 kW</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest leading-none mb-2 block">Eff. Index</span>
                <span className="text-2xl font-black text-emerald-500 font-display tracking-tighter">98A+</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
