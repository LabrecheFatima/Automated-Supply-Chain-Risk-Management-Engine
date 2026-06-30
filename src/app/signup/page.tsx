// 📂 Location: src/app/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Key, Mail, Lock, User, ArrowRight, Info } from "lucide-react";

export default function PremiumSignupLayout() {
  const router = useRouter();

  // Inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [accountPassword, setAccountPassword] = useState("");

  // States
  const [showPass, setShowPass] = useState(false);
  const [isFocusedOnAppPass, setIsFocusedOnAppPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email, appPassword, accountPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/login?status=registered");
      } else {
        setError(data.error || "An infrastructure error occurred.");
      }
    } catch (err) {
      setError("Network timeout. Could not connect to LogiShield auth systems.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F6FA] text-slate-800 flex items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-5xl bg-white sm:rounded-[24px] shadow-sm border border-slate-100 flex flex-col md:flex-row overflow-hidden min-h-[680px]">
        
        {/* LEFT PROFILE INGESTION PANELS */}
        <div className="flex-1 p-8 sm:p-12 flex flex-col justify-between">
          <div className="w-full max-w-sm mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">⚡</div>
              <span className="font-bold text-slate-900 text-sm tracking-tight">LogiShield AI</span>
            </div>

            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create your account</h1>
              <p className="text-xs text-slate-400">Set up your workspace inside our logistics network.</p>
            </div>

            {error && <div className="mb-4 p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[11px] font-medium">{error}</div>}

            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="relative flex items-center mt-1">
                  <User className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text" required placeholder="Enter your full name" value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#F4F6FA]/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="relative flex items-center mt-1">
                  <Mail className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="email" required placeholder="fatimalabreche438@gmail.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#F4F6FA]/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* NextAuth Login Key */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">App Login Password</label>
                <div className="relative flex items-center mt-1">
                  <Lock className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type={showPass ? "text" : "password"} required placeholder="Choose a secure platform password" value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#F4F6FA]/60 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Google App Password Target */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Google App Password</label>
                  <span className="text-[9px] bg-amber-50 text-amber-600 font-semibold px-1.5 py-0.5 rounded">Required</span>
                </div>
                <div className="relative flex items-center mt-1">
                  <Key className="absolute left-3 h-3.5 w-3.5 text-amber-500" />
                  <input
                    type={showPass ? "text" : "password"} required placeholder="xxxx xxxx xxxx xxxx" value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    onFocus={() => setIsFocusedOnAppPass(true)}
                    className="w-full pl-9 pr-9 py-2 bg-yellow-50/30 border border-yellow-200/60 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 font-semibold text-xs text-white py-2.5 rounded-xl transition-all shadow-sm shadow-blue-500/10 mt-4"
              >
                {loading ? "Constructing Isolated Pipeline..." : "Sign Up"}
              </button>
            </form>
          </div>

          <div className="text-center text-xs text-slate-400 mt-4">
            Already have an account? <a href="/login" className="text-blue-600 font-bold hover:underline">Log In</a>
          </div>
        </div>

        {/* RIGHT DYNAMIC INTELLIGENCE SIDEBAR */}
        <div className={`w-full md:w-[42%] p-8 flex flex-col justify-between transition-all duration-300 ${
          isFocusedOnAppPass ? "bg-slate-900 text-white" : "bg-[#F8FAFC] text-slate-700 border-l border-slate-100"
        }`}>
          {!isFocusedOnAppPass ? (
            <div className="my-auto flex flex-col items-center text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/20">🛡️</div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Automated Log Streaming</h3>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                  LogiShield AI maps an analytical extraction process directly to your inbox stream context.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between animate-fadeIn">
              <div className="space-y-4">
                <div className="flex items-center gap-1 text-[10px] text-blue-400 font-mono tracking-wider uppercase">
                  <Info className="h-3 w-3" /> Step-by-Step Configuration
                </div>
                <h3 className="text-sm font-bold text-white">How to generate an App Password</h3>
                
                <ol className="space-y-3 text-[11px] text-slate-400 list-decimal list-inside pl-1 leading-relaxed">
                  <li>Go to your <a href="https://myaccount.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline font-medium">Google Account Settings</a>.</li>
                  <li>Enable <span className="text-white font-medium">2-Step Verification</span> inside the security window grid.</li>
                  <li>Search for <span className="text-white font-medium">&quotl;App Passwords&quot;</span> in the global accounts bar.</li>
                  <li>Select app type &quot;Other&quot;, name it <span className="font-mono text-xs text-blue-400 bg-white/5 px-1 rounded">LogiShield AI</span>, and copy the given 16-character sequence.</li>
                </ol>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5">
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-[11px] font-bold text-blue-400 flex items-center gap-1 hover:underline">
                  Open Google App Passwords <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
          <div className="text-[9px] text-slate-400 text-center md:text-left mt-4 font-mono">SECURE INTEGRATION TERMINAL</div>
        </div>

      </div>
    </div>
  );
}