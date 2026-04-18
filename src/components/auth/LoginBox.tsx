import React from "react";
import { BsLightningFill, BsArrowRight } from "react-icons/bs";
import { GlassCard } from "../ui/GlassCard";

export function LoginBox() {
  return (
    <GlassCard className="w-full max-w-[400px] p-8 flex flex-col items-center shadow-xl border-t-2 border-t-emerald-400 bg-white/70">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
        <BsLightningFill className="text-[color:var(--color-azure)] text-2xl" />
      </div>
      
      <h1 className="text-2xl font-bold font-display text-[color:var(--color-azure)] mb-3">
        Join a Cluster
      </h1>
      
      <p className="text-sm text-slate-500 text-center mb-8 px-4 leading-relaxed tracking-wide">
        Enter your phone number to securely connect to your energy cluster.
      </p>

      <div className="w-full mb-6">
        <label className="block text-xs font-bold text-[color:var(--color-azure)] mb-2 px-1">
          Phone Number
        </label>
        <div className="flex bg-white/50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-[color:var(--color-azure)] transition-colors focus-within:ring-2 ring-[color:var(--color-azure)]/20 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/50 border-r border-slate-200 text-slate-500 text-sm font-medium">
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            +91
          </div>
          <input 
            type="tel" 
            placeholder="Enter Phone Number"
            className="flex-1 bg-transparent px-4 py-3 text-sm font-medium placeholder:text-slate-400 outline-none"
          />
        </div>
      </div>

      <button className="w-full bg-slate-200 hover:bg-slate-300 text-slate-500 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mb-6">
        Send OTP <BsArrowRight />
      </button>

      <div className="text-xs text-center text-slate-400">
        Not registered? <a href="#" className="font-bold text-[color:var(--color-azure)] hover:underline">Contact your provider &rarr;</a>
      </div>
    </GlassCard>
  );
}
