
"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email address or secure password combination.");
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
      transition: { staggerChildren: 0.06, delayChildren: 0.05 }
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
      <div className="w-full max-w-5xl bg-white rounded-[28px] shadow-xl shadow-slate-200/80 border border-slate-100 flex overflow-hidden min-h-[640px] md:min-h-[700px]">
        
        {/* LEFT COLUMN: Clean Interactive Authentication Panel */}
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
              className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </motion.div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Logoipsum
            </span>
          </div>

          {/* Center Section: Core Structural Form Inputs Engine */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md mx-auto my-auto py-8 space-y-6"
          >
            <motion.div variants={itemVariants} className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Welcome back!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Hand ipsum red wing olives. Pesto tossed.
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

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username/Email Input */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">
                  Username or Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  />
                  <div className="absolute left-3.5 top-3.5 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* Password Input */}
              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  />
                  <div className="absolute left-3.5 top-3.5 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
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

              {/* Action Button Trigger */}
              <motion.div variants={itemVariants} className="pt-2">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-semibold rounded-xl py-3 text-sm tracking-wide transition-colors shadow-lg shadow-blue-600/15"
                >
                  {loading ? "Processing..." : "Log In"}
                </motion.button>
              </motion.div>
            </form>

            {/* Registration Navigation Link */}
            <motion.div variants={itemVariants} className="text-center pt-1">
              <p className="text-xs text-slate-500 font-medium">
                Don't have an account? <span className="text-slate-700 hover:text-blue-600 font-semibold cursor-pointer underline transition-colors">Sign up</span>
              </p>
            </motion.div>
          </motion.div>

          {/* Hidden reference spacing */}
          <div className="opacity-0 pointer-events-none h-0" />
        </motion.div>

        {/* RIGHT COLUMN: Premium Geometric Abstract Background Element */}
        <div className="hidden lg:block lg:w-[50%] relative bg-white p-3">
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="relative w-full h-full rounded-[22px] overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-12 shadow-inner"
          >
            {/* Tech Decorative Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            
            {/* Ambient Lighting Orbs */}
            <div className="absolute w-72 h-72 rounded-full bg-blue-500/10 blur-[80px] -top-12 -right-12" />
            <div className="absolute w-72 h-72 rounded-full bg-indigo-500/10 blur-[80px] -bottom-12 -left-12" />

            {/* Dynamic Premium Micro-SaaS Mockup Display */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative z-10 w-full max-w-sm bg-slate-950/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="text-[10px] font-mono text-slate-500 ml-2">logishield_secure_mesh.sh</span>
              </div>
              <div className="space-y-2 font-mono text-[11px] text-indigo-300/90 leading-relaxed">
                <p className="text-slate-500"># Initializing multi-tenant system boundary...</p>
                <p><span className="text-emerald-400">✔</span> Operational integrity verification complete.</p>
                <p><span className="text-emerald-400">✔</span> Quantum cryptography handshakes established.</p>
                <p className="text-blue-400">STATUS // SECURE OPERATIONAL PERIMETER ACTIVE</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}