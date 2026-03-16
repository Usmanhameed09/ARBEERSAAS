"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Radar } from "lucide-react";
import type { Opportunity } from "@/data/opportunities";
import { NAICS_CODES } from "@/data/opportunities";
import {
  scanSamGov,
  streamOpportunities,
  loadFetchState,
  saveFetchState,
} from "@/lib/api";
import type { ScanResult } from "@/lib/api";
import OpportunityCard from "@/components/OpportunityCard";
import OpportunityDetailModal from "@/components/OpportunityDetailModal";
import FetcherBar from "@/components/FetcherBar";
import ScanResultsBar from "@/components/ScanResultsBar";
import type { FetchOptions } from "@/components/FetcherBar";
import { useAuth } from "@/context/AuthContext";

function OpportunitiesContent() {
  const { user, companyProfile } = useAuth();

  // UI state
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Data state — starts EMPTY, only populated by current scan session
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);
  const [totalOnSam, setTotalOnSam] = useState<number | null>(null);

  // Two-phase state
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  // Refs
  const abortRef = useRef<(() => void) | null>(null);
  const lastScanOptionsRef = useRef<FetchOptions | null>(null);

  const userId = user?.id ?? null;
  const profileNaicsCodes = companyProfile?.naicsCodes || [];

  // Load last fetch time from DB (just for display, NOT opportunities)
  useEffect(() => {
    if (!userId) return;
    loadFetchState(userId).then((state) => {
      if (state.lastFetchTime) setLastFetchTime(state.lastFetchTime);
      if (state.totalOnSam) setTotalOnSam(state.totalOnSam);
    }).catch(() => {});
  }, [userId]);

  // ── Phase 1: SCAN ──
  const handleScan = useCallback(async (options: FetchOptions) => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }

    // Clear previous results
    setAllOpportunities([]);
    setActiveTab("all");
    setIsScanning(true);
    setScanResult(null);
    setIsAnalyzing(false);
    setProgress(null);
    lastScanOptionsRef.current = options;

    try {
      const result = await scanSamGov(
        options.naicsCodes,
        options.noticeTypes,
        options.setAside,
        50,
        options.dateRange,
        options.minDaysUntilDue,
      );
      setScanResult(result);
      setTotalOnSam(result.totalOnSam);
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // ── Phase 2: ANALYZE ──
  const handleAnalyze = useCallback((noticeIds?: string[]) => {
    const options = lastScanOptionsRef.current;
    if (!options) return;

    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }

    setIsAnalyzing(true);
    setProgress(null);

    const abort = streamOpportunities(
      options.naicsCodes,
      50,
      {
        onMeta: (_total, toProcess) => {
          setProgress({ current: 0, total: toProcess });
        },

        onOpportunity: (opportunity, prog) => {
          setProgress((prev) => prev ? { ...prev, current: prog } : { current: prog, total: prog });

          setAllOpportunities((prev) => {
            const existingIdx = prev.findIndex((o) => o.noticeId === opportunity.noticeId);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = { ...opportunity, isNew: true };
              return updated;
            }
            return [...prev, { ...opportunity, isNew: true }];
          });
        },

        onDone: () => {
          setIsAnalyzing(false);
          setProgress(null);
          setScanResult(null);
          abortRef.current = null;

          const now = new Date();
          const timeStr = now.toLocaleString("en-US", {
            timeZone: "America/Chicago",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }) + " CST";
          setLastFetchTime(timeStr);

          // Persist fetch state to DB
          if (userId) {
            saveFetchState(userId, {
              fetchOffset: 0,
              totalOnSam: totalOnSam || 0,
              lastFetchTime: timeStr,
              naicsCodes: profileNaicsCodes,
            }).catch(console.error);
          }
        },

        onError: (message) => {
          console.error("Pipeline error:", message);
        },
      },
      0,
      options.noticeTypes,
      options.setAside,
      noticeIds,
      options.dateRange,
      options.minDaysUntilDue,
    );

    abortRef.current = abort;
  }, [userId, totalOnSam, profileNaicsCodes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current();
    };
  }, []);

  // ── Build dynamic NAICS tabs ──
  const naicsWithResults = Array.from(
    new Set(allOpportunities.map((o) => o.naicsCode).filter(Boolean))
  ).sort();

  const naicsLabelMap = new Map(NAICS_CODES.map((n) => [n.code, n.label]));
  const getNaicsShort = (code: string) => {
    const label = naicsLabelMap.get(code);
    if (!label) return code;
    const words = label.split(" ");
    return words.length > 4 ? words.slice(0, 4).join(" ") + "…" : label;
  };

  const countFor = (naics?: string, status?: "Go" | "No-Go") =>
    allOpportunities.filter((o) => {
      if (naics && o.naicsCode !== naics) return false;
      if (status && o.status !== status) return false;
      return true;
    }).length;

  type TabDef = { key: string; code: string; label: string; total: number; go: number; nogo: number };

  const tabs: TabDef[] = [
    ...(naicsWithResults.length > 1
      ? [{
          key: "all",
          code: "",
          label: "All Results",
          total: allOpportunities.length,
          go: countFor(undefined, "Go"),
          nogo: countFor(undefined, "No-Go"),
        }]
      : []),
    ...naicsWithResults.map((code) => ({
      key: `naics-${code}`,
      code,
      label: getNaicsShort(code),
      total: countFor(code),
      go: countFor(code, "Go"),
      nogo: countFor(code, "No-Go"),
    })),
  ];

  // Fallback
  const validKeys = tabs.map((t) => t.key);
  const effectiveTab = validKeys.includes(activeTab) ? activeTab : (tabs[0]?.key || "all");

  // Filter
  const filtered = allOpportunities.filter((opp) => {
    if (effectiveTab !== "all") {
      const naicsCode = effectiveTab.replace("naics-", "");
      if (opp.naicsCode !== naicsCode) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return opp.title.toLowerCase().includes(q) || opp.agency.toLowerCase().includes(q) || opp.naicsCode.includes(searchQuery);
    }
    return true;
  });

  const goOpps = filtered.filter((o) => o.status === "Go");
  const noGoOpps = filtered.filter((o) => o.status === "No-Go");
  const hasResults = allOpportunities.length > 0;

  return (
    <div className="p-3 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
            Scan SAM.gov, then AI-analyze new contracts for your profile
            {totalOnSam !== null && (
              <span className="ml-1 sm:ml-2 font-semibold text-blue-600">
                ({totalOnSam.toLocaleString()} total on SAM.gov)
              </span>
            )}
          </p>
        </div>
        {hasResults && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, agency, NAICS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
            />
          </div>
        )}
      </div>

      {/* Fetcher Bar */}
      <FetcherBar
        lastFetchTime={lastFetchTime}
        isScanning={isScanning}
        isAnalyzing={isAnalyzing}
        newCount={allOpportunities.length}
        onScan={handleScan}
        profileNaicsCodes={profileNaicsCodes}
      />

      {/* Scan Results Bar */}
      {scanResult && !isAnalyzing && (
        <ScanResultsBar
          scanResult={scanResult}
          isAnalyzing={isAnalyzing}
          onAnalyzeCustom={(count) => {
            const newIds = scanResult.opportunities
              .filter((o) => o.isNew)
              .map((o) => o.noticeId)
              .slice(0, count);
            handleAnalyze(newIds);
          }}
          onAnalyzeAll={() => {
            const allIds = scanResult.opportunities.map((o) => o.noticeId);
            handleAnalyze(allIds);
          }}
          onDismiss={() => setScanResult(null)}
        />
      )}

      {/* Progress Bar */}
      {progress && progress.total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Analyzing contracts with AI...</span>
            <span className="font-semibold text-gray-700">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Dynamic NAICS Tabs */}
      {tabs.length > 0 && (
        <div className="mb-5 overflow-x-auto">
          <div className="flex gap-2 pb-1 min-w-0">
            {tabs.map((tab) => {
              const isActive = effectiveTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="shrink-0 group cursor-pointer"
                >
                  <div
                    className={`rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border-2 transition-all ${
                      isActive
                        ? "bg-[#182434] border-[#182434] shadow-lg shadow-slate-900/10"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                    style={{ minWidth: "120px" }}
                  >
                    {/* NAICS code or "All" */}
                    <div className={`text-[13px] sm:text-sm font-extrabold mb-0.5 ${isActive ? "text-white" : "text-slate-800"}`}>
                      {tab.code || "All"}
                    </div>
                    {/* Label */}
                    <div className={`text-[9px] sm:text-[10px] leading-tight mb-2 truncate max-w-[130px] sm:max-w-[160px] ${isActive ? "text-slate-400" : "text-slate-500"}`}>
                      {tab.code ? tab.label : `${tab.total} opportunities`}
                    </div>
                    {/* Go / No-Go badges */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold ${
                          isActive
                            ? "bg-green-500/20 text-green-300"
                            : "bg-green-50 text-green-700 border border-green-200"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {tab.go}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold ${
                          isActive
                            ? "bg-red-500/20 text-red-300"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {tab.nogo}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards */}
      {hasResults ? (
        <>
          {/* Go section */}
          {goOpps.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-500/10" />
                <h2 className="text-sm sm:text-[15px] font-bold text-gray-800">
                  Go <span className="text-gray-400 font-medium">({goOpps.length})</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
                {goOpps.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} onViewDetails={setSelectedOpp} />
                ))}
              </div>
            </div>
          )}

          {/* No-Go section */}
          {noGoOpps.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/10" />
                <h2 className="text-sm sm:text-[15px] font-bold text-gray-800">
                  No-Go <span className="text-gray-400 font-medium">({noGoOpps.length})</span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
                {noGoOpps.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} onViewDetails={setSelectedOpp} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && searchQuery && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
              <p className="text-xs sm:text-sm text-gray-500">No opportunities match &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 sm:p-16 text-center">
          {isScanning ? (
            <>
              <Radar className="w-10 h-10 text-blue-400 mx-auto mb-3 animate-pulse" />
              <p className="text-sm font-medium text-gray-600">Scanning SAM.gov...</p>
            </>
          ) : isAnalyzing ? (
            <>
              <Radar className="w-10 h-10 text-blue-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm font-medium text-gray-600">Analyzing opportunities with AI...</p>
            </>
          ) : (
            <>
              <Radar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500 mb-1">No scan results</p>
              <p className="text-xs text-gray-400">
                Set your filters above and click <strong>Scan SAM.gov</strong> to discover contracts matching your profile.
                <br />
                <span className="text-gray-400/80">Saved opportunities are available in the Saved section.</span>
              </p>
            </>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedOpp && (
        <OpportunityDetailModal
          opportunity={selectedOpp}
          onClose={() => setSelectedOpp(null)}
        />
      )}
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-3 sm:p-5">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            Opportunities
          </h1>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded-lg w-full sm:w-80" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <OpportunitiesContent />
    </Suspense>
  );
}
