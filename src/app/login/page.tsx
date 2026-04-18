"use client";

import React, { useState } from "react";
import { BsLightningFill, BsArrowRight, BsShieldLock, BsHouseDoor, BsCheckCircleFill } from "react-icons/bs";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/context/AuthContext";
import { CLUSTERS, Cluster } from "@/data/mockData";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    state: "",
    city: "",
    phone: "",
    otp: "",
    clusterId: "",
  });
  const [foundCluster, setFoundCluster] = useState<Cluster | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.state || !formData.city || !formData.phone) {
        setError("Please fill all fields including Email.");
        return;
      }
      
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError("Phone number must be exactly 10 digits (numbers only).");
        return;
      }

      setLoading(true);
      setError("");
      const { error } = await supabase.auth.signInWithOtp({ email: formData.email });
      setLoading(false);
      
      if (error) {
        setError("Failed to send code: " + error.message);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.otp || formData.otp.length < 6) {
        setError("Please enter the 6-digit OTP sent to your email.");
        return;
      }
      setLoading(true);
      setError("");
      
      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: formData.otp,
        type: "email"
      });
      
      setLoading(false);

      if (error) {
        setError("Invalid OTP: " + error.message);
        return;
      }

      setStep(3);
    }
  };

  const handleClusterSearch = () => {
    const cluster = CLUSTERS.find(c => c.id === formData.clusterId.toUpperCase());
    if (cluster) {
      setFoundCluster(cluster);
      setError("");
    } else {
      setFoundCluster(null);
      setError("Cluster ID not found.");
    }
  };

  const handleFinish = async () => {
    if (foundCluster) {
      setLoading(true);
      
      // Save profile implicitly
      const { data: userSession } = await supabase.auth.getSession();
      if (userSession.session?.user) {
        await supabase.from('users').upsert({
          id: userSession.session.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          state: formData.state,
          city: formData.city,
          cluster_id: foundCluster.id
        });
      }

      login({
        name: formData.name,
        email: formData.email,
        state: formData.state,
        city: formData.city,
        phone: formData.phone,
        cluster: foundCluster
      });
      
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-[color:var(--background)] transition-colors overflow-hidden p-4">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.05] dark:opacity-[0.1]"
        style={{
          backgroundImage: "radial-gradient(var(--color-azure) 2px, transparent 2px)",
          backgroundSize: "60px 60px"
        }}
      />
      
      <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-100/30 blur-3xl -z-10 dark:bg-emerald-900/10"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[40%] rounded-full bg-blue-100/30 blur-3xl -z-10 dark:bg-blue-900/10"></div>

      <div className="absolute top-8 left-8 z-10 flex items-center gap-2">
        <div className="bg-[color:var(--color-azure)] rounded-lg p-2 flex items-center justify-center shadow-lg">
          <BsLightningFill className="text-white text-xl" />
        </div>
        <span className="font-display font-bold text-2xl text-[color:var(--color-azure)]">
          GridX
        </span>
      </div>

      <main className="z-10 w-full max-w-md">
        <GlassCard className="p-8 shadow-2xl border-t-2 border-t-[color:var(--color-azure)] bg-[color:var(--card-bg)]">
          {/* Step Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 w-12 rounded-full transition-all duration-300 ${
                  s === step ? "bg-[color:var(--color-azure)] w-16" : s < step ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
                }`} 
              />
            ))}
          </div>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-2xl font-bold font-display text-[color:var(--color-azure)] mb-1">Welcome to GridX</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Start your energy intelligence journey.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full mt-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-[color:var(--color-azure)]/20 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">State</label>
                    <input 
                      type="text" 
                      placeholder="Maharashtra"
                      className="w-full mt-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-[color:var(--color-azure)]/20 outline-none"
                      value={formData.state}
                      onChange={e => setFormData({...formData, state: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">City</label>
                    <input 
                      type="text" 
                      placeholder="Mumbai"
                      className="w-full mt-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-[color:var(--color-azure)]/20 outline-none"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="john@example.com"
                    className="w-full mt-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-[color:var(--color-azure)]/20 outline-none"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Phone Number</label>
                  <div className="flex mt-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 ring-[color:var(--color-azure)]/20 transition-all">
                    <span className="px-3 flex items-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-r border-slate-200 dark:border-slate-700">+91</span>
                    <input 
                      type="tel" 
                      placeholder="9876543210"
                      className="flex-1 bg-transparent px-4 py-3 text-sm outline-none"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              {error && <p className="text-xs text-red-500 mt-3 ml-1">{error}</p>}
              
              <button 
                onClick={handleNext}
                disabled={loading}
                className={`w-full mt-8 bg-[color:var(--color-azure)] hover:bg-opacity-90 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${loading ? 'opacity-70' : ''}`}
              >
                {loading ? "Sending..." : "Continue"} <BsArrowRight />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 text-[color:var(--color-azure)] shadow-inner">
                <BsShieldLock size={32} />
              </div>
              <h1 className="text-2xl font-bold font-display text-[color:var(--color-azure)] mb-1">Verify Email</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">We sent a 6-digit OTP to <span className="font-bold text-slate-700 dark:text-slate-300">{formData.email}</span></p>
              
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">OTP Code</label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="000000"
                  className="w-full mt-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-center text-2xl font-black tracking-[0.5em] focus:ring-2 ring-[color:var(--color-azure)]/20 outline-none"
                  value={formData.otp}
                  onChange={e => setFormData({...formData, otp: e.target.value})}
                />
              </div>

              {error && <p className="text-xs text-red-500 mt-3 ml-1 text-center">{error}</p>}

              <div className="mt-8 space-y-3">
                <button 
                  onClick={handleNext}
                  disabled={loading}
                  className={`w-full bg-[color:var(--color-azure)] hover:bg-opacity-90 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${loading ? 'opacity-70' : ''}`}
                >
                  {loading ? "Verifying..." : "Verify"} <BsCheckCircleFill />
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="w-full text-slate-400 font-bold py-2 text-sm hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Edit details
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 shadow-inner">
                <BsHouseDoor size={32} />
              </div>
              <h1 className="text-2xl font-bold font-display text-[color:var(--color-azure)] mb-1">Connect Cluster</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Enter your unique Cluster ID to join your home network.</p>
              
              <div className="flex gap-2 mb-6">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Cluster ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. GRID-001"
                    className="w-full mt-1 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold placeholder:font-normal focus:ring-2 ring-[color:var(--color-azure)]/20 outline-none"
                    value={formData.clusterId}
                    onChange={e => setFormData({...formData, clusterId: e.target.value})}
                  />
                </div>
                <button 
                  onClick={handleClusterSearch}
                  className="mt-6 px-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Fetch
                </button>
              </div>

              {error && <p className="text-xs text-red-500 mb-4 ml-1">{error}</p>}

              {foundCluster && (
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4 mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                      <BsCheckCircleFill size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{foundCluster.name}</h3>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium uppercase tracking-wider">{foundCluster.area}, {foundCluster.state}</p>
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={handleFinish}
                disabled={!foundCluster || loading}
                className={`w-full bg-[color:var(--color-azure)] text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                  !foundCluster || loading ? "opacity-50 grayscale cursor-not-allowed" : "hover:bg-opacity-90 hover:scale-[1.02]"
                }`}
              >
                {loading ? "Joining..." : "Join Cluster"} <BsArrowRight />
              </button>
            </div>
          )}
        </GlassCard>
      </main>
      
      <div className="absolute bottom-6 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
        GridX &middot; Energy Intelligence &middot; v2.5
      </div>
    </div>
  );
}
