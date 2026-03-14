"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Opportunity } from "@/data/opportunities";
import {
  scanSamGov,
  streamOpportunities,
  loadOpportunitiesFromDB,
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

type FilterTab = "new" | "go" | "no-go";

function OpportunitiesContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter") as FilterTab | null;
  const { user, companyProfile } = useAuth();

  // UI state
  const [activeTab, setActiveTab] = useState<FilterTab>("new");
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Data state
  const [allOpportunities, setAllOpportunities] = useState<Opportunity[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);
  const [totalOnSam, setTotalOnSam] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // ── Initialize: load from localStorage, then sync from DB ──
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // 1. Load from localStorage instantly
    try {
      const saved = localStorage.getItem("arber_opportunities");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.opportunities?.length > 0) {
          setAllOpportunities(parsed.opportunities.map((o: Opportunity) => ({ ...o, isNew: false })));
          setLastFetchTime(parsed.lastFetchTime || null);
          setTotalOnSam(parsed.totalOnSam ?? null);
          setIsLoading(false);
        }
      }
    } catch {
      // Ignore corrupt localStorage
    }

    // 2. Background sync from DB
    (async () => {
      try {
        const [dbData, state] = await Promise.all([
          loadOpportunitiesFromDB(userId),
          loadFetchState(userId),
        ]);

        if (dbData.opportunities && dbData.opportunities.length > 0) {
          setAllOpportunities(dbData.opportunities.map((o: Opportunity) => ({ ...o, isNew: false })));
          localStorage.setItem("arber_opportunities", JSON.stringify({
            opportunities: dbData.opportunities,
            lastFetchTime: state.lastFetchTime,
            totalOnSam: state.totalOnSam,
          }));
        }

        if (state.lastFetchTime) setLastFetchTime(state.lastFetchTime);
        if (state.totalOnSam) setTotalOnSam(state.totalOnSam);
      } catch (err) {
        console.error("Failed to load from DB:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [userId]);

  // ── Persist to localStorage whenever opportunities change (after analysis) ──
  useEffect(() => {
    if (isAnalyzing || allOpportunities.length === 0 || !userId || isLoading) return;

    const saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem("arber_opportunities", JSON.stringify({
          opportunities: allOpportunities,
          lastFetchTime,
          totalOnSam,
        }));
      } catch {
        // localStorage full
      }

      // Also save fetch state to DB
      saveFetchState(userId, {
        fetchOffset: 0,
        totalOnSam: totalOnSam || 0,
        lastFetchTime: lastFetchTime || "",
        naicsCodes: profileNaicsCodes,
      }).catch(console.error);
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [allOpportunities, lastFetchTime, totalOnSam, isAnalyzing, userId, isLoading, profileNaicsCodes]);

  useEffect(() => {
    if (filterParam === "go" || filterParam === "no-go" || filterParam === "new") {
      setActiveTab(filterParam);
    }
  }, [filterParam]);

  // ── Phase 1: SCAN ──
  const handleScan = useCallback(async (options: FetchOptions) => {
    // Cancel any in-progress analysis
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }

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

    // Cancel any previous stream
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }

    setIsAnalyzing(true);
    setProgress(null);

    // Clear isNew flags on existing
    setAllOpportunities((prev) => prev.map((o) => ({ ...o, isNew: false })));

    const abort = streamOpportunities(
      options.naicsCodes,
      50, // match scan limit
      {
        onMeta: (_total, toProcess) => {
          setProgress({ current: 0, total: toProcess });
        },

        onOpportunity: (opportunity, prog) => {
          setProgress((prev) => prev ? { ...prev, current: prog } : { current: prog, total: prog });

          setAllOpportunities((prev) => {
            // Deduplicate by noticeId — replace existing or prepend
            const existingIdx = prev.findIndex((o) => o.noticeId === opportunity.noticeId);
            if (existingIdx >= 0) {
              const updated = [...prev];
              updated[existingIdx] = { ...opportunity, isNew: true };
              return updated;
            }
            return [{ ...opportunity, isNew: true }, ...prev];
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
        },

        onError: (message) => {
          console.error("Pipeline error:", message);
        },
      },
      0, // offset always 0 — scan handles discovery
      options.noticeTypes,
      options.setAside,
      noticeIds, // only process these specific ones
      options.dateRange,
    );

    abortRef.current = abort;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current();
    };
  }, []);

  // ── Derived state ──
  const newCount = allOpportunities.filter((o) => o.isNew).length;

  const filtered = allOpportunities.filter((opp) => {
    const matchesTab =
      (activeTab === "new" && opp.isNew) ||
      (activeTab === "go" && opp.status === "Go") ||
      (activeTab === "no-go" && opp.status === "No-Go");

    const matchesSearch =
      searchQuery === "" ||
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.naicsCode.includes(searchQuery);

    return matchesTab && matchesSearch;
  });

  const goCount = allOpportunities.filter((o) => o.status === "Go").length;
  const noGoCount = allOpportunities.filter((o) => o.status === "No-Go").length;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "new", label: "New", count: newCount },
    { key: "go", label: "Go", count: goCount },
    { key: "no-go", label: "No-Go", count: noGoCount },
  ];

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Scan SAM.gov, then AI-analyze new contracts for your profile
            {totalOnSam !== null && (
              <span className="ml-2 font-semibold text-blue-600">
                ({totalOnSam.toLocaleString()} total on SAM.gov)
              </span>
            )}
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, agency, NAICS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
          />
        </div>
      </div>

      {/* Fetcher Bar (Scan) */}
      <FetcherBar
        lastFetchTime={lastFetchTime}
        isScanning={isScanning}
        isAnalyzing={isAnalyzing}
        newCount={newCount}
        onScan={handleScan}
        profileNaicsCodes={profileNaicsCodes}
      />

      {/* Scan Results Bar (between scan and analyze) */}
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

      {/* Progress Bar (during analysis) */}
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

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-100 shadow-sm mb-5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-[#1e2a3a] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span
              className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-sm text-gray-500">Loading opportunities from database...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onViewDetails={setSelectedOpp}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-sm text-gray-500">
            {allOpportunities.length === 0 && !isScanning && !isAnalyzing
              ? "Click Scan SAM.gov to discover contracts matching your profile"
              : isScanning
                ? "Scanning SAM.gov..."
                : isAnalyzing
                  ? "Analyzing opportunities..."
                  : "No opportunities match your search."}
          </p>
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
        <div className="p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Opportunities
          </h1>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded-lg w-80" />
            <div className="grid grid-cols-3 gap-4">
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
