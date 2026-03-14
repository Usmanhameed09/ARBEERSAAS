"use client";

import { useState } from "react";
import {
  Calendar,
  Building2,
  Sparkles,
  Download,
  Paperclip,
  Star,
  Play,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";
import type { Opportunity } from "@/data/opportunities";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { usePipeline } from "@/context/PipelineContext";
import AppIcon from "@/components/AppIcon";
import { formatContractValue } from "@/lib/usaspending";
import { generateSummaryPdf } from "@/lib/generateSummaryPdf";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onViewDetails: (opportunity: Opportunity) => void;
}

export default function OpportunityCard({
  opportunity,
  onViewDetails,
}: OpportunityCardProps) {
  const isGo = opportunity.status === "Go";
  const { toggle, isSaved } = useSavedOpportunities();
  const saved = isSaved(opportunity.id);
  const { addToPipeline, isInPipeline } = usePipeline();
  const inPipeline = isInPipeline(opportunity.id);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  return (
    <div
      onClick={() => onViewDetails(opportunity)}
      className={`bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden relative ${
        opportunity.isNew
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-slate-200/70"
      }`}
    >
      {/* NEW badge */}
      {opportunity.isNew && (
        <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded-md tracking-wider animate-pulse">
          NEW
        </div>
      )}

      {/* Go/No-Go top accent bar */}
      <div
        className={`h-1.5 w-full ${
          isGo ? "bg-green-500" : "bg-red-500"
        }`}
      />

      <div className="p-5">
        {/* Header row: badge + save */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                isGo
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              AI: {opportunity.status}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
              {opportunity.type}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggle(opportunity.id);
            }}
            className={`transition-colors ${
              saved
                ? "text-amber-500 hover:text-amber-600"
                : "text-slate-300 hover:text-amber-500"
            }`}
            title={saved ? "Remove from saved" : "Save opportunity"}
          >
            <Star className={`w-4 h-4 ${saved ? "fill-amber-500" : ""}`} strokeWidth={2.1} />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-bold text-slate-950 leading-snug mb-2 line-clamp-2 group-hover:text-blue-800 transition-colors">
          {opportunity.title}
        </h3>

        {/* Summary */}
        <p className="text-[13px] text-slate-600 leading-relaxed mb-3 line-clamp-3">
          {opportunity.summary}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 mb-4 font-semibold">
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" strokeWidth={2.1} />
            {opportunity.agency}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" strokeWidth={2.1} />
            Due: {opportunity.dueDate}
          </span>
          <span className="flex items-center gap-1">
            <Paperclip className="w-3 h-3" strokeWidth={2.1} />
            {opportunity.attachments.length} doc{opportunity.attachments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* AI reason snippet */}
        <div className="bg-slate-50 rounded-xl px-3 py-2.5 mb-4 border border-slate-200/80">
          <div className="flex items-center gap-1.5 mb-1">
            <AppIcon icon={Sparkles} size="sm" tone="blue" />
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.18em]">
              AI Insight
            </span>
          </div>
          <p className="text-[12px] text-slate-600 leading-snug line-clamp-2">
            {opportunity.aiReason}
          </p>
        </div>

        {/* AI Predicted Bid Price */}
        {opportunity.pricingPrediction?.predictedBid ? (
          <div className="bg-emerald-50 rounded-xl px-3 py-2.5 mb-4 border border-emerald-200/80">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-2.5 h-2.5 text-emerald-600" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-[0.18em]">
                  AI Predicted Bid
                </span>
              </div>
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                opportunity.pricingPrediction.confidence === "high"
                  ? "bg-emerald-200 text-emerald-800"
                  : opportunity.pricingPrediction.confidence === "medium"
                  ? "bg-amber-200 text-amber-800"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {opportunity.pricingPrediction.confidence}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-emerald-700">
                {formatContractValue(opportunity.pricingPrediction.predictedBid)}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">
                recommended
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-500" strokeWidth={2} />
              <span className="text-[10px] text-emerald-600">
                Range: {formatContractValue(opportunity.pricingPrediction.lowBid)} – {formatContractValue(opportunity.pricingPrediction.highBid)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl px-3 py-2.5 mb-4 border border-slate-200/80">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center">
                <DollarSign className="w-2.5 h-2.5 text-slate-400" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.18em]">
                AI Bid Pricing
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {opportunity.pricingPrediction?.reasoning || "No incumbent contract found for this opportunity. Manual pricing analysis recommended."}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (generatingPdf) return;
              setGeneratingPdf(true);
              try {
                await generateSummaryPdf(opportunity);
              } catch (err) {
                console.error("PDF generation error:", err);
                alert("Failed to generate summary: " + (err instanceof Error ? err.message : "Unknown error"));
              } finally {
                setGeneratingPdf(false);
              }
            }}
            disabled={generatingPdf}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#182434] hover:bg-[#223247] disabled:bg-[#182434]/70 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            {generatingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.1} />
            ) : (
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.1} />
            )}
            {generatingPdf ? "Generating..." : "AI Summarize"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const withUrl = opportunity.attachments.filter((a) => a.url);
              if (withUrl.length > 0) {
                withUrl.forEach((a) => window.open(a.url, "_blank"));
              }
            }}
            disabled={!opportunity.attachments.some((a) => a.url)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2.1} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!inPipeline) addToPipeline(opportunity);
            }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              inPipeline
                ? "bg-green-100 text-green-800 cursor-default"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
            title={inPipeline ? "Already in pipeline" : "Run Pipeline"}
          >
            {inPipeline ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                In Pipeline
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Pipeline
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
