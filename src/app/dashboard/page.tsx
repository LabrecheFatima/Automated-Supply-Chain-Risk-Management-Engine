// 📂 Location: src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ShipmentPayload {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: 'ON_TIME' | 'DELAYED' | 'CRITICAL';
  currentLocation: string | null;
  updatedAt: string;
  emailUrl?: string; 
  aiAnalysis?: {
    nlpLabel: string;
    confidenceScore: number;
    severityLevel: number;
    summary: string;
    systemRulesBrief?: string; 
  };
  rawLogs?: Array<{
    id: string;
    rawText?: string;     
    bodySnippet?: string; 
    receivedAt: string;
  }>;
}

export default function PremiumDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [items, setItems] = useState<ShipmentPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ShipmentPayload | null>(null);
  const [prevTotalItems, setPrevTotalItems] = useState<number>(0);
  const [newRowId, setNewRowId] = useState<string | null>(null);

  // 1. Route Protection Security Gate
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 2. Telemetry Sync Heartbeat Loop
  useEffect(() => {
    if (status !== "authenticated") return;

    async function loadTelemetry() {
      try {
        const res = await fetch(`/api/shipments?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        const json = await res.json();
        if (json.success) {
          const incomingData: ShipmentPayload[] = json.data || [];
          
          if (incomingData.length > 0 && incomingData.length > prevTotalItems && !loading) {
            const newestItem = incomingData[0];
            setNewRowId(newestItem.id);
            setTimeout(() => setNewRowId(null), 3000);
          }
          
          setItems(incomingData);
          setPrevTotalItems(incomingData.length);
        }
      } catch (err) {
        console.error("[UI Sync Error] Failed to stream updates from database:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTelemetry();

    const pipelineHeartbeat = setInterval(() => {
      loadTelemetry();
    }, 5000);

    return () => clearInterval(pipelineHeartbeat);
  }, [prevTotalItems, loading, status]);

  // 3. Derived Analytical Values & Filters
  const totalItems = items.length;
  const criticalAlerts = items.filter(i => i.status === 'CRITICAL').length;
  const delayedAlerts = items.filter(i => i.status === 'DELAYED').length;
  
  const onTimeRate = totalItems > 0 
    ? Math.round(((items.filter(i => i.status === 'ON_TIME').length) / totalItems) * 100) 
    : 100;

  const itemsWithConfidence = items.filter(i => i.aiAnalysis?.confidenceScore !== undefined);
  const dynamicSystemIntegrity = itemsWithConfidence.length > 0
    ? (itemsWithConfidence.reduce((acc, curr) => acc + (curr.aiAnalysis?.confidenceScore || 0), 0) / itemsWithConfidence.length * 100).toFixed(1)
    : "99.2";

  const filteredItems = items.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.trackingNumber.toLowerCase().includes(searchLower) ||
      item.origin.toLowerCase().includes(searchLower) ||
      item.status.toLowerCase().includes(searchLower) ||
      item.aiAnalysis?.summary.toLowerCase().includes(searchLower)
    );
  });

  // 4. Client Loading Guard State
  if (status === "loading" || (loading && status === "authenticated")) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F4F6FA] text-slate-500 font-sans text-sm tracking-wide">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          Loading secure workspace context...
        </div>
      </div>
    );
  }

  // 5. Dynamic Operator Context Parsing
  const activeOperatorName = session?.user?.name || "Operator";
  const avatarInitials = activeOperatorName
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "OP";

  return (
    <div className="min-h-screen w-full bg-[#F4F6FA] text-slate-800 font-sans antialiased flex relative overflow-x-hidden">
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 transition-all duration-300">
        
        {/* LEFT COLUMN */}
        <div className="flex-1 flex flex-col gap-6 lg:gap-8 lg:w-3/4 w-full">
          
          {/* Header Row */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Welcome back, {activeOperatorName}</h1>
              <p className="text-xs text-slate-500 mt-0.5">Your personal natural language risk pipeline overview.</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="relative w-full md:w-80 group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-teal-500/10 rounded-full blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center bg-white border border-slate-200/80 rounded-full shadow-sm group-focus-within:border-indigo-500/50 transition-colors">
                  <span className="pl-4 pr-2 text-slate-400 text-xs font-medium tracking-wider font-mono select-none">AI</span>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask AI or search context..." 
                    className="bg-transparent text-xs text-slate-800 pr-10 py-2.5 w-full focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm flex-shrink-0 cursor-default select-none">
                {avatarInitials}
              </div>
            </div>
          </header>

          {/* TOP GRID */}
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-slate-100 flex flex-col justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-slate-100 border-2 border-indigo-500/20 flex items-center justify-center text-lg sm:text-xl">
                  🛡️
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">LogShield Engine</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Active Tenant Workspace</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-5 sm:mt-6 pt-4 border-t border-slate-50 text-center">
                <div>
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">{totalItems}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Alerts</p>
                  <p className="text-sm sm:text-base font-bold text-rose-500 mt-0.5">{criticalAlerts}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Secure</p>
                  <p className="text-sm sm:text-base font-bold text-emerald-500 mt-0.5">{items.filter(i => i.status === 'ON_TIME').length}</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[24px] p-5 sm:p-6 bg-gradient-to-br from-orange-400 via-rose-400 to-rose-500 text-white flex flex-col justify-between shadow-md shadow-rose-500/5">
              <div>
                <p className="text-[11px] font-medium tracking-wide uppercase opacity-90">Compliance Rate</p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">{onTimeRate}%</h2>
              </div>
              <div className="text-[11px] opacity-90 mt-5 sm:mt-6">Average across isolated payload indexes</div>
            </div>

            <div className="relative overflow-hidden rounded-[24px] p-5 sm:p-6 bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 text-white flex flex-col justify-between shadow-md shadow-indigo-500/5 sm:col-span-2 md:col-span-1">
              <div>
                <p className="text-[11px] font-medium tracking-wide uppercase opacity-90">System Integrity</p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">{dynamicSystemIntegrity}%</h2>
              </div>
              <div className="text-[11px] opacity-90 mt-5 sm:mt-6">Dynamic AI classifier confidence average</div>
            </div>
          </section>

          {/* DATATABLE */}
          <main className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Ingested Natural Language Targets</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Click any record row to expand full deep-dive intelligence metrics</p>
              </div>
              <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md self-start sm:self-auto animate-pulse">● Secure Isolation Stream</span>
            </div>

            <div className="overflow-x-auto flex-1">
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">No matching target streams found.</div>
              ) : (
                <>
                  <table className="w-full text-left border-collapse hidden md:table">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                        <th className="px-6 py-3.5">Tracking Reference</th>
                        <th className="px-6 py-3.5">Source Channel</th>
                        <th className="px-6 py-3.5">Status Label</th>
                        <th className="px-6 py-3.5">AI Executive Summary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs text-slate-600">
                      {filteredItems.map((item) => (
                        <tr 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={`transition-all duration-300 cursor-pointer ${
                            newRowId === item.id 
                              ? 'bg-emerald-50/70 border-y-2 border-emerald-300 text-emerald-900' 
                              : selectedItem?.id === item.id 
                              ? 'bg-indigo-50/40 font-medium border-l-4 border-l-indigo-500' 
                              : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="px-6 py-4 font-mono text-slate-900 font-semibold max-w-[160px] truncate">
                            {item.trackingNumber}
                          </td>
                          <td className="px-6 py-4 max-w-[200px] truncate text-slate-500">
                            {item.origin}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide ${
                              item.status === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              item.status === 'DELAYED' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              ● {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                            {item.aiAnalysis?.summary && item.aiAnalysis.summary !== "<." ? item.aiAnalysis.summary : "Analyzing context patterns..."}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex flex-col divide-y divide-slate-100 md:hidden">
                    {filteredItems.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`p-4 transition-all flex flex-col gap-2.5 cursor-pointer ${
                          newRowId === item.id 
                            ? 'bg-emerald-50 border-l-4 border-l-emerald-500' 
                            : selectedItem?.id === item.id
                            ? 'bg-indigo-50/40 border-l-4 border-l-indigo-500' 
                            : 'active:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-slate-900 font-bold text-sm">{item.trackingNumber}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium tracking-wide ${
                            item.status === 'CRITICAL' ? 'bg-rose-50 text-rose-600' :
                            item.status === 'DELAYED' ? 'bg-amber-50 text-amber-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>
                            ● {item.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">Source: {item.origin}</div>
                        <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50/50 border border-slate-100 rounded-lg p-2 mt-1">
                          {item.aiAnalysis?.summary && item.aiAnalysis.summary !== "<." ? item.aiAnalysis.summary : "Analyzing text structure..."}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-1/4 bg-white rounded-[24px] border border-slate-100 p-5 sm:p-6 flex flex-col gap-6 shadow-sm">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Pipeline Intelligence</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time analysis extraction feed</p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Processed Classes</h4>
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Critical Flags</span>
                <span className="font-semibold text-rose-500">{criticalAlerts}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${totalItems > 0 ? (criticalAlerts / totalItems) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Delayed Conditions</span>
                <span className="font-semibold text-amber-500">{delayedAlerts}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${totalItems > 0 ? (delayedAlerts / totalItems) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="flex flex-col gap-4 flex-1">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recent Ingestion History</h4>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] lg:max-h-[350px] pr-1">
              {items.slice(0, 4).map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-all cursor-pointer ${
                    selectedItem?.id === item.id 
                      ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' 
                      : 'bg-slate-50/50 border-slate-100 hover:border-indigo-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[10px] text-slate-700">{item.trackingNumber}</span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                    {item.aiAnalysis?.summary && item.aiAnalysis.summary !== "<." ? item.aiAnalysis.summary : "No brief computed."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DRAWER BACKGROUND OVERLAY */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity duration-300 lg:hidden ${
          selectedItem ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSelectedItem(null)}
      />

      {/* SLIDING CONTEXT DRAWER */}
      <div className={`fixed bottom-0 right-0 h-[85vh] lg:h-full w-full sm:w-[500px] lg:w-[480px] bg-white/95 backdrop-blur-xl border-t sm:border-t-0 sm:border-l border-slate-200/60 shadow-2xl z-50 transform transition-transform duration-300 ease-out p-5 sm:p-6 flex flex-col gap-5 sm:gap-6 rounded-t-[24px] sm:rounded-t-none ${
        selectedItem ? 'translate-y-0 lg:translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-full'
      }`}>
        {selectedItem && (
          <>
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">TARGET REF</span>
                <div className="flex items-center gap-2 mt-1">
                  <h2 className="text-base font-bold text-slate-900 font-mono">{selectedItem.trackingNumber}</h2>
                  <a 
                    href={selectedItem.emailUrl || `https://mail.google.com/`} 
                    target="_blank" 
                    rel="noreferrer"
                    title="Open tracking source email directly"
                    className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
                    onClick={(e) => e.stopPropagation()} 
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 h-8 w-8 rounded-full flex items-center justify-center transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-5 sm:gap-6 overflow-y-auto pr-1 min-h-0">
              <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50/50 border border-indigo-100/60 rounded-2xl p-4 flex flex-col gap-2 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold tracking-wide uppercase text-indigo-900">AI User-Intent Summary</h4>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    selectedItem.status === 'CRITICAL' ? 'bg-rose-50 text-rose-600' :
                    selectedItem.status === 'DELAYED' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {selectedItem.status}
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-normal leading-relaxed">
                  {selectedItem.aiAnalysis?.summary && selectedItem.aiAnalysis.summary !== "<." ? (
                    selectedItem.aiAnalysis.summary.includes("Route The rule") 
                      ? "A core system rule matrix was triggered by an incoming email payload. The layout contains structural configurations, automation conditions, or code blocks that are fully extracted in the technical section below."
                      : selectedItem.aiAnalysis.summary
                  ) : (
                    "No descriptive natural language summary was processed for this communication string."
                  )}
                </p>
              </div>

              {selectedItem.aiAnalysis?.summary && selectedItem.aiAnalysis.summary.includes("Route The rule") && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 flex-shrink-0">
                  <h4 className="text-[11px] font-bold tracking-wide uppercase text-slate-500">Automated Route Configuration Matrix</h4>
                  <p className="text-[11px] text-slate-600 font-mono leading-normal bg-white p-2.5 rounded-lg border border-slate-100">
                    {selectedItem.aiAnalysis.summary}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-[11px] font-bold tracking-wide uppercase text-slate-400 mb-2.5">Model Scoring Analytics</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                    <p className="text-[10px] text-slate-400">Confidence Score</p>
                    <p className="text-base sm:text-lg font-bold font-mono text-slate-800 mt-0.5">
                      {selectedItem.aiAnalysis ? `${Math.round(selectedItem.aiAnalysis.confidenceScore * 100)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                    <p className="text-[10px] text-slate-400">Severity Tier</p>
                    <p className="text-base sm:text-lg font-bold font-mono text-slate-800 mt-0.5">
                      {selectedItem.aiAnalysis?.severityLevel ?? 0}/5
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[200px]">
                <h4 className="text-[11px] font-bold tracking-wide uppercase text-slate-400 mb-2">Extracted Stream Content</h4>
                <div className="flex-1 bg-slate-900 rounded-2xl p-4 font-mono text-[11px] text-slate-300 overflow-y-auto leading-relaxed select-text border border-slate-950 shadow-inner">
                  <div className="text-slate-500 mb-2 border-b border-slate-800/60 pb-1.5 text-[10px]">
                    <span className="text-indigo-400 font-bold">FROM:</span> {selectedItem.origin} <br/>
                    <span className="text-indigo-400 font-bold">STAMP:</span> {new Date(selectedItem.updatedAt).toLocaleString()}
                  </div>
                  
                  {selectedItem.rawLogs && selectedItem.rawLogs.length > 0 ? (
                    <div className="whitespace-pre-wrap text-slate-200">
                      {selectedItem.rawLogs[0].rawText || selectedItem.rawLogs[0].bodySnippet}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">No text payloads attached to this reference.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}