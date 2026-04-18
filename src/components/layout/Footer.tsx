import React from "react";
import { BsLightningFill, BsGithub, BsTwitter, BsLinkedin, BsEnvelope } from "react-icons/bs";

export function Footer() {
  return (
    <footer className="mt-auto bg-white/30 dark:bg-slate-900/30 backdrop-blur-md border-t border-white/40 dark:border-slate-800/40 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Column */}
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-[color:var(--color-azure)] rounded-lg p-1.5 flex items-center justify-center">
              <BsLightningFill className="text-white text-md" />
            </div>
            <span className="font-display font-bold text-lg text-[color:var(--color-azure)]">
              GridX
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            Pioneering the future of decentralised energy intelligence. Connecting homes, optimizing grids.
          </p>
          <div className="flex gap-4">
            <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-[color:var(--color-azure)] transition-colors">
              <BsTwitter size={14} />
            </button>
            <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-[color:var(--color-azure)] transition-colors">
              <BsGithub size={14} />
            </button>
            <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-[color:var(--color-azure)] transition-colors">
              <BsLinkedin size={14} />
            </button>
          </div>
        </div>

        {/* Links Columns */}
        <div>
          <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase text-xs tracking-widest">Platform</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="#" className="hover:text-[color:var(--color-azure)] transition-colors">How it works</a></li>
            <li><a href="#" className="hover:text-[color:var(--color-azure)] transition-colors">Grid Analytics</a></li>
            <li><a href="#" className="hover:text-[color:var(--color-azure)] transition-colors">IoT Integration</a></li>
            <li><a href="#" className="hover:text-[color:var(--color-azure)] transition-colors">Global Metrics</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase text-xs tracking-widest">Resources</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><a href="#" className="hover:text-[color:var(--color-azure)] transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-[color:var(--color-azure)] transition-colors">API Reference</a></li>
            <li><a href="#" className="hover:text-[color:var(--color-azure)] transition-colors">Community Forum</a></li>
            <li><a href="#" className="hover:text-[color:var(--color-azure)] transition-colors">Support Center</a></li>
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="col-span-1">
          <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase text-xs tracking-widest">Stay Updated</h4>
          <p className="text-xs text-slate-500 mb-4">Subscribe to our newsletter for the latest grid insights.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Email address" 
              className="flex-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 ring-[color:var(--color-azure)]/30"
            />
            <button className="bg-[color:var(--color-azure)] text-white p-2 rounded-lg hover:bg-opacity-90 transition-colors">
              <BsEnvelope size={14} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          © 2026 GridX Intelligence. Secure energy for everyone.
        </p>
        <div className="flex gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Cookie Settings</a>
        </div>
      </div>
    </footer>
  );
}
