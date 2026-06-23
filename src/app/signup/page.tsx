
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, Variants } from "framer-motion";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Submit form details to the background engine (database registration + background email)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "An account registration error occurred.");
        setLoading(false);
        return;
      }

      // 2. Auto-Login Flow: Establish session instantly without blocking for verification
      const nextAuthLogin = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (nextAuthLogin?.error) {
        // Fallback if auto-session fails but DB persistence succeeded
        router.push("/login?registered=true");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected server connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Framer Motion Animation Sequencing
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.04 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 110, damping: 16 } 
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans antialiased text-slate-800 select-none">
      
      {/* Central Integrated Layout Canvas Block */}
      <div className="w-full max-w-5xl bg-white rounded-[28px] shadow-xl shadow-slate-200/80 border border-slate-100 flex overflow-hidden min-h-[640px] md:min-h-[720px]">
        
        {/* LEFT COLUMN: Clean Interactive Registration Panel */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 15 }}
          className="w-full lg:w-[50%] flex flex-col justify-between p-8 sm:p-12 md:p-16 bg-white"
        >
          {/* Top Header Row / Brand Vector Mark */}
          <div className="flex items-center gap-2.5">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/login")}
              className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </motion.div>
            <span className="text-lg font-bold tracking-tight text-slate-900 cursor-pointer" onClick={() => router.push("/login")}>
              Logoipsum
            </span>
          </div>

          {/* Center Section: Registration Form Inputs Engine */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md mx-auto my-auto py-6 space-y-5"
          >
            <motion.div variants={itemVariants} className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Create your account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Set up your workspace inside our logistics network.
              </p>
            </motion.div>

            {/* Error System Notification Banner */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 text-center font-semibold"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSignUp} className="space-y-3.5">
              {/* Full Name Input */}
              <motion.div variants={itemVariants} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  />
                  <div className="absolute left-3.5 top-3 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* Email Address Input */}
              <motion.div variants={itemVariants} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  />
                  <div className="absolute left-3.5 top-3 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* Password Input */}
              <motion.div variants={itemVariants} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  />
                  <div className="absolute left-3.5 top-3 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Confirm Password Input */}
              <motion.div variants={itemVariants} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  />
                  <div className="absolute left-3.5 top-3 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* Action Button Trigger */}
              <motion.div variants={itemVariants} className="pt-2">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-semibold rounded-xl py-3 text-sm tracking-wide transition-colors shadow-lg shadow-blue-600/15"
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </motion.button>
              </motion.div>
            </form>

            {/* Back to Login Action Link */}
            <motion.div variants={itemVariants} className="text-center pt-1">
              <p className="text-xs text-slate-500 font-medium">
                Already have an account? <span onClick={() => router.push("/login")} className="text-slate-700 hover:text-blue-600 font-semibold cursor-pointer underline transition-colors">Log in</span>
              </p>
            </motion.div>
          </motion.div>

          {/* Hidden reference spacing */}
          <div className="opacity-0 pointer-events-none h-0" />
        </motion.div>

        {/* RIGHT COLUMN: Pure White Container with Blurred Accent Rings */}
        <div className="hidden lg:block lg:w-[50%] relative bg-white p-3">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative w-full h-full rounded-[22px] overflow-hidden bg-white border border-slate-100 flex flex-col justify-center items-center p-8"
          >
            {/* Soft Defocused Background Lighting Ring Blur Effects */}
            <div className="absolute w-80 h-80 rounded-full bg-indigo-100/50 blur-[60px] top-10 left-10" />
            <div className="absolute w-72 h-72 rounded-full bg-blue-50/70 blur-[50px] bottom-10 right-10" />

            {/* Crisp High-Resolution Abstract Vector Geometry Layout */}
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 80 }}
              className="relative z-10 w-full max-w-[280px] h-[280px] flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-indigo-500/5 rounded-[40px] -rotate-6 backdrop-blur-sm border border-slate-100/50" />
              <div className="absolute w-48 h-48 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[32px] shadow-xl shadow-blue-500/20 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
                <svg className="w-20 h-20 text-white opacity-95" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </motion.div>

            {/* Minimal High-End Typography Footer Label */}
            <div className="absolute bottom-8 left-0 right-0 text-center z-10">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
                LogiShield Security Perimeter
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Join our integrated logistics orchestration platform.
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}