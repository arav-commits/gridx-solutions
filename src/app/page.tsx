import { Navbar } from "@/components/layout/Navbar";
import { ClusterStatusBar } from "@/components/layout/ClusterStatusBar";
import { GridStatusPanel } from "@/components/dashboard/GridStatusPanel";
import { NextPricePanel } from "@/components/dashboard/NextPricePanel";
import { ActionEngine } from "@/components/dashboard/ActionEngine";
import { Footer } from "@/components/layout/Footer";
import { BsChevronUp } from "react-icons/bs";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--background)] transition-colors duration-500 relative overflow-x-hidden">
      {/* Background ambient accents */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/30 dark:bg-emerald-900/10 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-5%] w-[40%] h-[50%] rounded-full bg-blue-100/20 dark:bg-blue-900/10 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[30%] w-[30%] h-[40%] rounded-full bg-purple-100/20 dark:bg-purple-900/5 blur-[120px] -z-10 pointer-events-none"></div>

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 w-full">
        <ClusterStatusBar />

        {/* Top Panels */}
        <div className="flex flex-col lg:flex-row gap-6 mt-2">
          <GridStatusPanel />
          <NextPricePanel />
        </div>

        {/* Action Engine Section */}
        <ActionEngine />

        {/* Call to action bar */}
        <div className="flex justify-center mt-4">
          <button className="group flex items-center gap-3 bg-[color:var(--glass-bg)] hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all backdrop-blur-md border border-[color:var(--glass-border)] shadow-md rounded-full px-8 py-3.5 hover:scale-105 active:scale-95">
            <BsChevronUp className="text-slate-400 group-hover:-translate-y-1 transition-transform" />
            <span className="font-bold text-[color:var(--color-azure)] font-display tracking-tight">View Deep Insights</span>
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-black ml-2 animate-pulse">
              Saved ₹140 today
            </span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
