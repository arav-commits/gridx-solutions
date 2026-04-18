"use client";

import React, { useState } from "react";
import { BsLightningFill, BsMoonFill, BsSunFill, BsPersonFill, BsBoxArrowRight, BsChevronDown, BsHouseDoor } from "react-icons/bs";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const pathname = usePathname();

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[color:var(--glass-bg)] backdrop-blur-md border-b border-[color:var(--glass-border)] transition-all">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 hover:scale-[1.02] transition-transform">
        <div className="bg-[color:var(--color-azure)] rounded-xl p-2 flex items-center justify-center shadow-lg">
          <BsLightningFill className="text-white text-lg" />
        </div>
        <span className="font-display font-bold text-xl text-[color:var(--color-azure)]">
          GridX
        </span>
      </Link>

      {/* Center Navigation */}
      <div className="hidden md:flex items-center bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm px-1 py-1 rounded-full border border-white/40 dark:border-slate-700/40">
        <Link 
          href="/" 
          className={`px-5 py-1.5 rounded-full font-semibold text-sm transition-all ${
            pathname === "/" 
              ? "bg-white dark:bg-slate-700 text-[color:var(--color-azure)] shadow-sm" 
              : "text-slate-500 hover:text-[color:var(--color-azure)]"
          }`}
        >
          Home
        </Link>
        <Link 
          href="/devices" 
          className={`px-5 py-1.5 rounded-full font-semibold text-sm transition-all ${
            pathname === "/devices" 
              ? "bg-white dark:bg-slate-700 text-[color:var(--color-azure)] shadow-sm" 
              : "text-slate-500 hover:text-[color:var(--color-azure)]"
          }`}
        >
          My Devices
        </Link>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-slate-700/60 hover:bg-white/60 dark:hover:bg-slate-700/60 transition-all text-slate-500 dark:text-slate-400 shadow-sm"
        >
          {theme === "light" ? <BsMoonFill size={16} /> : <BsSunFill size={18} className="text-yellow-400" />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 px-1 py-1 pr-3 rounded-full bg-[color:var(--color-azure)] text-white hover:bg-opacity-90 transition-all shadow-md group"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20">
              <BsPersonFill size={16} />
            </div>
            <span className="text-sm font-bold hidden sm:block">{user.name.split(" ")[0]}</span>
            <BsChevronDown size={10} className={`transition-transform duration-300 ${showProfile ? "rotate-180" : ""}`} />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3 border-b border-slate-50 dark:border-slate-800 mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Authenticated Account</p>
                <h4 className="font-bold text-slate-700 dark:text-slate-200">{user.name}</h4>
                <p className="text-xs text-slate-500">{user.phone}</p>
              </div>
              
              <div className="p-2 space-y-1">
                <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[color:var(--color-azure)]">
                    <BsHouseDoor size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Residence Area</p>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{user.city}, {user.state}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                    <BsLightningFill size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Cluster Code</p>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{user.cluster?.id}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 p-3 mt-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-bold text-sm"
              >
                <BsBoxArrowRight size={18} />
                Logout Session
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
