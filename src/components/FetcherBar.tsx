"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
  Tag,
  Timer,
} from "lucide-react";
import { NAICS_CODES as BASE_NAICS_CODES } from "@/data/opportunities";
import AppIcon from "@/components/AppIcon";

interface FetcherBarProps {
  lastFetchTime: string | null;
  isScanning: boolean;
  isAnalyzing: boolean;
  newCount: number;
  onScan: (options: FetchOptions) => void;
  profileNaicsCodes?: string[];
}

export interface FetchOptions {
  dateRange: string;
  naicsCodes: string[];
  noticeTypes: string;
  setAside: string;
  minDaysUntilDue: number;
}

const DATE_RANGES = [
  { value: "1month", label: "Last 2 Months" },
  { value: "3months", label: "Last 6 Months" },
  { value: "6months", label: "Last 9 Months" },
  { value: "1year", label: "Last Year" },
];

// SAM.gov notice type codes
const NOTICE_TYPES = [
  { code: "k", label: "Combined Synopsis/Solicitation" },
  { code: "o", label: "Solicitation" },
  { code: "p", label: "Presolicitation" },
  { code: "r", label: "Sources Sought" },
  { code: "s", label: "Special Notice" },
];

const SET_ASIDE_OPTIONS = [
  { value: "", label: "All (No Filter)" },
  { value: "SBA", label: "Total Small Business Set-Aside" },
  { value: "SBP", label: "Partial Small Business Set-Aside" },
  { value: "8A", label: "8(a) Set-Aside" },
  { value: "8AN", label: "8(a) Sole Source" },
  { value: "HZC", label: "HUBZone Set-Aside" },
  { value: "SDVOSBC", label: "SDVOSB Set-Aside" },
  { value: "WOSB", label: "WOSB Set-Aside" },
  { value: "EDWOSB", label: "EDWOSB Set-Aside" },
];

const MIN_DAYS_OPTIONS = [
  { value: 0, label: "No Filter" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 21, label: "21 days" },
  { value: 30, label: "30 days" },
  { value: 45, label: "45 days" },
  { value: 60, label: "60 days" },
];

function loadStoredFilters() {
  if (typeof window === "undefined") {
    return {
      dateRange: "3months",
      naicsCodes: [] as string[],
      noticeTypes: ["k", "o", "p"],
      setAside: "SBA",
      minDaysUntilDue: 14,
    };
  }

  try {
    const saved = localStorage.getItem("arber_filters");
    if (!saved) {
      return {
        dateRange: "3months",
        naicsCodes: [] as string[],
        noticeTypes: ["k", "o", "p"],
        setAside: "SBA",
        minDaysUntilDue: 14,
      };
    }

    const parsed = JSON.parse(saved);
    return {
      dateRange: typeof parsed.dateRange === "string" && parsed.dateRange ? parsed.dateRange : "3months",
      naicsCodes: Array.isArray(parsed.naicsCodes) ? parsed.naicsCodes.filter((code: unknown): code is string => typeof code === "string" && !!code.trim()) : [],
      noticeTypes: Array.isArray(parsed.noticeTypes) && parsed.noticeTypes.length > 0 ? parsed.noticeTypes : ["k", "o", "p"],
      setAside: typeof parsed.setAside === "string" && parsed.setAside ? parsed.setAside : "SBA",
      minDaysUntilDue: typeof parsed.minDaysUntilDue === "number" ? parsed.minDaysUntilDue : 14,
    };
  } catch {
    return {
      dateRange: "3months",
      naicsCodes: [] as string[],
      noticeTypes: ["k", "o", "p"],
      setAside: "SBA",
      minDaysUntilDue: 14,
    };
  }
}

export default function FetcherBar({
  lastFetchTime,
  isScanning,
  isAnalyzing,
  newCount,
  onScan,
  profileNaicsCodes,
}: FetcherBarProps) {
  const storedFilters = loadStoredFilters();
  const normalizedProfileNaics = (profileNaicsCodes || []).map((code) => code.trim()).filter(Boolean);
  const initialNaics = normalizedProfileNaics.length > 0 ? normalizedProfileNaics : storedFilters.naicsCodes;

  const [showFilters, setShowFilters] = useState(true);
  const [dateRange, setDateRange] = useState(storedFilters.dateRange);
  const [selectedNaics, setSelectedNaics] = useState<string[]>(initialNaics);
  const [selectedNoticeTypes, setSelectedNoticeTypes] = useState<string[]>(storedFilters.noticeTypes);
  const [selectedSetAside, setSelectedSetAside] = useState(storedFilters.setAside);
  const [minDaysUntilDue, setMinDaysUntilDue] = useState(storedFilters.minDaysUntilDue);
  const hydratedRef = useRef(false);

  useEffect(() => {
    hydratedRef.current = true;
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem("arber_filters", JSON.stringify({
        dateRange,
        naicsCodes: selectedNaics,
        noticeTypes: selectedNoticeTypes,
        setAside: selectedSetAside,
        minDaysUntilDue,
      }));
    } catch { /* ignore */ }
  }, [dateRange, selectedNaics, selectedNoticeTypes, selectedSetAside, minDaysUntilDue]);

  // Merge profile NAICS codes into the display list
  const allNaicsCodes = (() => {
    const baseCodes = new Set(BASE_NAICS_CODES.map((n) => n.code));
    const profileOnly = (profileNaicsCodes || [])
      .filter((code) => !baseCodes.has(code))
      .map((code) => ({ code, label: `NAICS ${code}` }));
    const profileSet = new Set(profileNaicsCodes || []);
    const profileItems = [...profileOnly, ...BASE_NAICS_CODES.filter((n) => profileSet.has(n.code))];
    const otherItems = BASE_NAICS_CODES.filter((n) => !profileSet.has(n.code));
    return [...profileItems, ...otherItems];
  })();

  const toggleNaics = (code: string) => {
    setSelectedNaics((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleNoticeType = (code: string) => {
    setSelectedNoticeTypes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleScan = () => {
    if (selectedNaics.length === 0) return;
    onScan({
      dateRange,
      naicsCodes: selectedNaics,
      noticeTypes: selectedNoticeTypes.join(","),
      setAside: selectedSetAside,
      minDaysUntilDue,
    });
  };

  const isBusy = isScanning || isAnalyzing;

  return (
    <div className="bg-white rounded-[1.15rem] border border-slate-200/70 shadow-[0_10px_28px_rgba(15,23,42,0.06)] mb-5">
      {/* Main bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {/* Last fetch info */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[13px] text-slate-600 font-semibold min-w-0">
            <AppIcon icon={Clock} size="sm" tone="slate" />
            <span className="truncate">
              Last scan:{" "}
              <span className="font-bold text-slate-900">
                {lastFetchTime || "Never"}
              </span>
            </span>
          </div>

          {/* New count badge */}
          {newCount > 0 && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase shrink-0">
              {newCount} New
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showFilters
                ? "bg-[#182434] text-white border-[#182434]"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5" strokeWidth={2.1} />
            Filters
            {showFilters ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* Scan button */}
          <button
            onClick={handleScan}
            disabled={isBusy || selectedNaics.length === 0}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Search
              className={`w-3.5 h-3.5 ${isScanning ? "animate-pulse" : ""}`}
            />
            <span className="hidden sm:inline">
              {isScanning
                ? "Scanning SAM.gov..."
                : isAnalyzing
                  ? "Analyzing..."
                  : "Scan SAM.gov"}
            </span>
            <span className="sm:hidden">
              {isScanning ? "Scanning..." : isAnalyzing ? "Analyzing..." : "Scan"}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="px-3 sm:px-4 pb-4 pt-1 border-t border-slate-200/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {/* Date range */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-[0.18em] mb-2">
                <Calendar className="w-3 h-3" strokeWidth={2.1} />
                Posted Within
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DATE_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setDateRange(range.value)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${
                      dateRange === range.value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5">
                Filters by when opportunities were posted on SAM.gov
              </p>
            </div>

            {/* NAICS codes */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-[0.18em] mb-2">
                <Tag className="w-3 h-3" strokeWidth={2.1} />
                NAICS Codes
                <span className="text-[10px] font-medium normal-case text-slate-500 tracking-normal">
                  ({selectedNaics.length} selected)
                </span>
              </label>
              {/* Selected codes as removable chips */}
              {selectedNaics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedNaics.map((code) => {
                    const naics = allNaicsCodes.find((n) => n.code === code);
                    return (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold"
                        style={{ backgroundColor: "#2563eb", color: "#ffffff" }}
                      >
                        <span className="truncate max-w-[120px] sm:max-w-none">{code} – {naics?.label || `NAICS ${code}`}</span>
                        <button
                          onClick={() => toggleNaics(code)}
                          className="ml-0.5 font-bold cursor-pointer"
                          style={{ color: "rgba(255,255,255,0.8)" }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              {/* Dropdown to add codes */}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value && !selectedNaics.includes(e.target.value)) {
                    setSelectedNaics((prev) => [...prev, e.target.value]);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition cursor-pointer"
              >
                <option value="">+ Add NAICS code...</option>
                {allNaicsCodes
                  .filter((n) => !selectedNaics.includes(n.code))
                  .map((naics) => (
                    <option key={naics.code} value={naics.code}>
                      {naics.code} – {naics.label}
                    </option>
                  ))}
              </select>
              {/* Manual entry */}
              <div className="flex gap-1.5 mt-1.5">
                <input
                  type="text"
                  placeholder="Enter NAICS code manually..."
                  maxLength={6}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && /^\d{4,6}$/.test(val) && !selectedNaics.includes(val)) {
                        setSelectedNaics((prev) => [...prev, val]);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition placeholder-slate-400"
                />
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5">
                Auto-loaded from your company profile. Select from dropdown or type a code and press Enter.
              </p>
            </div>

            {/* Notice Type */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-[0.18em] mb-2">
                <Filter className="w-3 h-3" strokeWidth={2.1} />
                Notice Type
                <span className="text-[10px] font-medium normal-case text-slate-500 tracking-normal">
                  ({selectedNoticeTypes.length} selected)
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {NOTICE_TYPES.map((nt) => (
                  <button
                    key={nt.code}
                    onClick={() => toggleNoticeType(nt.code)}
                    className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all cursor-pointer ${
                      selectedNoticeTypes.includes(nt.code)
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {nt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Set-Aside */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-[0.18em] mb-2">
                <Tag className="w-3 h-3" strokeWidth={2.1} />
                Set-Aside
              </label>
              <select
                value={selectedSetAside}
                onChange={(e) => setSelectedSetAside(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition cursor-pointer"
              >
                {SET_ASIDE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5">
                Default: Total Small Business Set-Aside.
              </p>
            </div>

            {/* Min Days Until Due */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-[0.18em] mb-2">
                <Timer className="w-3 h-3" strokeWidth={2.1} />
                Minimum Days Until Due
                <span className="text-[10px] font-medium normal-case text-slate-500 tracking-normal">
                  (skip bids due sooner than this)
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MIN_DAYS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMinDaysUntilDue(opt.value)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all cursor-pointer ${
                      minDaysUntilDue === opt.value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1.5">
                Opportunities with due dates sooner than this will be excluded from scan results. Default: 14 days.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
