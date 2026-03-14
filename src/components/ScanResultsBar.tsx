"use client";

import { useState } from "react";
import { Search, Sparkles, CheckCircle, ArrowRight, X, Minus, Plus } from "lucide-react";
import type { ScanResult } from "@/lib/api";

interface ScanResultsBarProps {
  scanResult: ScanResult;
  isAnalyzing: boolean;
  onAnalyzeCustom: (count: number) => void;
  onAnalyzeAll: () => void;
  onDismiss: () => void;
}

export default function ScanResultsBar({
  scanResult,
  isAnalyzing,
  onAnalyzeCustom,
  onAnalyzeAll,
  onDismiss,
}: ScanResultsBarProps) {
  const { totalOnSam, found, newCount, existingCount } = scanResult;
  const [analyzeCount, setAnalyzeCount] = useState(Math.min(newCount, 10));

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-2xl p-4 mb-5 shadow-sm">
      {/* Summary row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Search className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
          </div>

          <div className="flex items-center gap-3">
            {/* Total on SAM */}
            <div className="text-center px-3">
              <div className="text-lg font-bold text-slate-900">{totalOnSam.toLocaleString()}</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">On SAM.gov</div>
            </div>

            <div className="w-px h-8 bg-slate-200" />

            {/* Found in scan */}
            <div className="text-center px-3">
              <div className="text-lg font-bold text-slate-900">{found}</div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Scanned</div>
            </div>

            <div className="w-px h-8 bg-slate-200" />

            {/* New */}
            <div className="text-center px-3">
              <div className="text-lg font-bold text-emerald-600">{newCount}</div>
              <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">New</div>
            </div>

            <div className="w-px h-8 bg-slate-200" />

            {/* Already analyzed */}
            <div className="text-center px-3">
              <div className="text-lg font-bold text-slate-400">{existingCount}</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Already Done</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <div className="flex items-center gap-0">
              {/* Count selector */}
              <div className="flex items-center bg-white border border-emerald-200 rounded-l-xl overflow-hidden">
                <button
                  onClick={() => setAnalyzeCount((c) => Math.max(1, c - 1))}
                  disabled={isAnalyzing || analyzeCount <= 1}
                  className="px-1.5 py-2 hover:bg-emerald-50 disabled:opacity-30 cursor-pointer transition-colors"
                >
                  <Minus className="w-3 h-3 text-emerald-700" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={newCount}
                  value={analyzeCount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) setAnalyzeCount(Math.min(Math.max(1, v), newCount));
                  }}
                  className="w-8 text-center text-xs font-bold text-emerald-800 bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setAnalyzeCount((c) => Math.min(newCount, c + 1))}
                  disabled={isAnalyzing || analyzeCount >= newCount}
                  className="px-1.5 py-2 hover:bg-emerald-50 disabled:opacity-30 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3 text-emerald-700" />
                </button>
              </div>

              {/* Analyze button */}
              <button
                onClick={() => onAnalyzeCustom(analyzeCount)}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-r-xl transition-colors cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Analyze{analyzeCount < newCount ? ` ${analyzeCount}` : " All"} New
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {existingCount > 0 && found > newCount && (
            <button
              onClick={onAnalyzeAll}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Re-analyze All {found}
            </button>
          )}

          {newCount === 0 && existingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-xs font-semibold text-amber-700">
                All {found} are already analyzed
              </span>
              <button
                onClick={onAnalyzeAll}
                disabled={isAnalyzing}
                className="ml-1 text-xs font-bold text-amber-800 underline cursor-pointer hover:text-amber-900"
              >
                Re-analyze?
              </button>
            </div>
          )}

          {newCount === 0 && existingCount === 0 && (
            <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl">
              <span className="text-xs font-semibold text-slate-500">
                No opportunities found for these filters
              </span>
            </div>
          )}

          <button
            onClick={onDismiss}
            className="p-1.5 hover:bg-white/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
