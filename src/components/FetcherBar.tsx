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

export default function FetcherBar({
  lastFetchTime,
  isScanning,
  isAnalyzing,
  newCount,
  onScan,
  profileNaicsCodes,
}: FetcherBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState("3months");
  const [selectedNaics, setSelectedNaics] = useState<string[]>([]);
  const [selectedNoticeTypes, setSelectedNoticeTypes] = useState<string[]>(["k", "o", "p"]);
  const [selectedSetAside, setSelectedSetAside] = useState("");
  const initializedRef = useRef(false);

  // Load profile NAICS codes as defaults (once only)
  useEffect(() => {
    if (!initializedRef.current && profileNaicsCodes && profileNaicsCodes.length > 0) {
      setSelectedNaics(profileNaicsCodes);
      initializedRef.current = true;
    }
  }, [profileNaicsCodes]);

  // Merge profile NAICS codes into the display list (profile codes first, then rest)
  const allNaicsCodes = (() => {
    const baseCodes = new Set(BASE_NAICS_CODES.map((n) => n.code));
    const profileOnly = (profileNaicsCodes || [])
      .filter((code) => !baseCodes.has(code))
      .map((code) => ({ code, label: `NAICS ${code}` }));
    // Profile codes first (highlighted), then the rest
    const profileSet = new Set(profileNaicsCodes || []);
    const profileItems = [...profileOnly, ...BASE_NAICS_CODES.filter((n) => profileSet.has(n.code))];
    const otherItems = BASE_NAICS_CODES.filter((n) => !profileSet.has(n.code));
    return [...profileItems, ...otherItems];
  })();

  const toggleNaics = (code: string) => {
    setSelectedNaics((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  const toggleNoticeType = (code: string) => {
    setSelectedNoticeTypes((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  const handleScan = () => {
    if (selectedNaics.length === 0) return;
    onScan({
      dateRange,
      naicsCodes: selectedNaics,
      noticeTypes: selectedNoticeTypes.join(","),
      setAside: selectedSetAside,
    });
  };

  const isBusy = isScanning || isAnalyzing;

  return (
    <div className="bg-white rounded-[1.15rem] border border-slate-200/70 shadow-[0_10px_28px_rgba(15,23,42,0.06)] mb-5">
      {/* Main bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Last fetch info */}
          <div className="flex items-center gap-2 text-[13px] text-slate-600 font-semibold">
            <AppIcon icon={Clock} size="sm" tone="slate" />
            <span>
              Last scan:{" "}
              <span className="font-bold text-slate-900">
                {lastFetchTime || "Never"}
              </span>
            </span>
          </div>

          {/* New count badge */}
          {newCount > 0 && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">
              {newCount} New
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
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
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Search
              className={`w-3.5 h-3.5 ${isScanning ? "animate-pulse" : ""}`}
            />
            {isScanning
              ? "Scanning SAM.gov..."
              : isAnalyzing
                ? "Analyzing..."
                : "Scan SAM.gov"}
          </button>
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-200/80">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      dateRange === range.value
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
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
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {allNaicsCodes.map((naics) => (
                  <button
                    key={naics.code}
                    onClick={() => toggleNaics(naics.code)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                      selectedNaics.includes(naics.code)
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    title={naics.label}
                  >
                    {naics.code}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Auto-loaded from your company profile
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
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
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
              <p className="text-[11px] text-slate-500 mt-1.5">
                Default: All types. Select to filter small business set-asides.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
