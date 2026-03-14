"use client";

import { useState } from "react";
import {
  X,
  Calendar,
  Building2,
  MapPin,
  User,
  Mail,
  Phone,
  Sparkles,
  Download,
  FileText,
  Tag,
  Clock,
  Shield,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Loader2,
} from "lucide-react";
import type { Opportunity } from "@/data/opportunities";
import { formatContractValue } from "@/lib/usaspending";
import { generateSummaryPdf } from "@/lib/generateSummaryPdf";
// AI Summary opens in new tab

interface OpportunityDetailModalProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export default function OpportunityDetailModal({
  opportunity,
  onClose,
}: OpportunityDetailModalProps) {
  const isGo = opportunity.status === "Go";
  const [generatingPdf, setGeneratingPdf] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden mx-4 flex flex-col">
        {/* Top accent bar */}
        <div
          className={`h-2 w-full flex-shrink-0 ${
            isGo ? "bg-green-500" : "bg-red-500"
          }`}
        />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    isGo
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  AI Recommendation: {opportunity.status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                  {opportunity.type}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug">
                {opportunity.title}
              </h2>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                Notice ID: {opportunity.noticeId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* Meta info grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-semibold tracking-wide">Agency</span>
              </div>
              <p className="text-xs font-medium text-gray-800">{opportunity.agency}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-semibold tracking-wide">Posted</span>
              </div>
              <p className="text-xs font-medium text-gray-800">{opportunity.postedDate}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-semibold tracking-wide">Due Date</span>
              </div>
              <p className="text-xs font-bold text-red-600">{(() => { try { return new Date(opportunity.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Chicago" }); } catch { return opportunity.dueDate; } })()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Tag className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-semibold tracking-wide">NAICS</span>
              </div>
              <p className="text-xs font-medium text-gray-800">{opportunity.naicsCode}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-semibold tracking-wide">Set-Aside</span>
              </div>
              <p className="text-xs font-medium text-gray-800">{opportunity.setAside}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-semibold tracking-wide">Location</span>
              </div>
              <p className="text-xs font-medium text-gray-800">{opportunity.placeOfPerformance}</p>
            </div>
          </div>

          {/* AI Insight */}
          <div className={`rounded-xl p-4 mb-5 ${isGo ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className={`w-4 h-4 ${isGo ? "text-green-600" : "text-red-600"}`} />
              <span className={`text-xs font-bold uppercase tracking-wide ${isGo ? "text-green-700" : "text-red-700"}`}>
                AI Analysis - {opportunity.status}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {opportunity.aiReason}
            </p>
          </div>

          {/* Compliance Score */}
          {opportunity.complianceScore !== undefined && (
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">Compliance Score</span>
                  <span className={`text-sm font-extrabold ${
                    opportunity.complianceScore >= 70 ? "text-green-600" :
                    opportunity.complianceScore >= 40 ? "text-amber-600" : "text-red-600"
                  }`}>{opportunity.complianceScore}/100</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      opportunity.complianceScore >= 70 ? "bg-green-500" :
                      opportunity.complianceScore >= 40 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${opportunity.complianceScore}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bid Killers / Compliance Warnings */}
          {opportunity.bidKillers && opportunity.bidKillers.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900">Compliance Flags ({opportunity.bidKillers.length})</h3>
              </div>
              <div className="space-y-1.5">
                {opportunity.bidKillers.map((bk, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                    bk.severity === "hard_stop"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      bk.severity === "hard_stop" ? "bg-red-200" : "bg-amber-200"
                    }`}>
                      {bk.severity === "hard_stop" ? "BLOCKER" : "WARNING"}
                    </span>
                    <span className="font-semibold">{bk.ruleName}</span>
                    <span className="ml-auto text-[10px] font-mono opacity-70">{bk.ruleCode}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incumbent Contractor */}
          {opportunity.incumbent && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 mb-5">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Incumbent Contractor</h3>
                  <p className="text-[10px] text-gray-500">Previous/current contract holder from USASpending</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-900">{opportunity.incumbent.contractorName}</p>
                  <p className="text-sm font-bold text-purple-700">
                    {formatContractValue(opportunity.incumbent.awardAmount)}
                  </p>
                </div>
                <p className="text-[11px] text-gray-600 mb-2">{opportunity.incumbent.description}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-500 mb-2">
                  <span><span className="font-semibold text-gray-600">Award ID:</span> {opportunity.incumbent.awardId}</span>
                  <span><span className="font-semibold text-gray-600">Period:</span> {opportunity.incumbent.startDate} → {opportunity.incumbent.endDate}</span>
                  {opportunity.incumbent.contractPricingType && (
                    <span><span className="font-semibold text-gray-600">Pricing:</span> {opportunity.incumbent.contractPricingType}</span>
                  )}
                  {opportunity.incumbent.numberOfOffers && (
                    <span><span className="font-semibold text-gray-600">Offers Received:</span> {opportunity.incumbent.numberOfOffers}</span>
                  )}
                  {opportunity.incumbent.extentCompeted && (
                    <span><span className="font-semibold text-gray-600">Competition:</span> {opportunity.incumbent.extentCompeted}</span>
                  )}
                  {opportunity.incumbent.baseAndAllOptions && opportunity.incumbent.baseAndAllOptions !== opportunity.incumbent.awardAmount ? (
                    <span><span className="font-semibold text-gray-600">Full Value (w/ options):</span> {formatContractValue(opportunity.incumbent.baseAndAllOptions)}</span>
                  ) : null}
                  {opportunity.incumbent.subAgency && (
                    <span><span className="font-semibold text-gray-600">Sub-Agency:</span> {opportunity.incumbent.subAgency}</span>
                  )}
                  {opportunity.incumbent.office && (
                    <span><span className="font-semibold text-gray-600">Office:</span> {opportunity.incumbent.office}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Predicted Bid Price */}
          {opportunity.pricingPrediction?.predictedBid ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">AI Predicted Bid Price</h3>
                    <p className="text-[10px] text-gray-500">Based on incumbent contract analysis</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                  opportunity.pricingPrediction.confidence === "high"
                    ? "bg-emerald-200 text-emerald-800"
                    : opportunity.pricingPrediction.confidence === "medium"
                    ? "bg-amber-200 text-amber-800"
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {opportunity.pricingPrediction.confidence} confidence
                </span>
              </div>

              {/* Price Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase mb-0.5">Aggressive</p>
                  <p className="text-sm font-extrabold text-gray-900">{formatContractValue(opportunity.pricingPrediction.lowBid)}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-emerald-200 ring-1 ring-emerald-100">
                  <p className="text-[9px] font-semibold text-emerald-600 uppercase mb-0.5">Recommended</p>
                  <p className="text-sm font-extrabold text-emerald-700">{formatContractValue(opportunity.pricingPrediction.predictedBid)}</p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase mb-0.5">Safe High</p>
                  <p className="text-sm font-extrabold text-gray-900">{formatContractValue(opportunity.pricingPrediction.highBid)}</p>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-white rounded-lg p-3 border border-emerald-100 mb-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Pricing Analysis</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{opportunity.pricingPrediction.reasoning}</p>
              </div>

              {/* Bid Strategy */}
              {opportunity.pricingPrediction.strategy && (
                <div className="flex items-start gap-2 pt-2 border-t border-emerald-100">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-emerald-700 font-medium leading-snug">{opportunity.pricingPrediction.strategy}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 mb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-700">AI Bid Pricing Unavailable</h3>
                  <p className="text-[10px] text-gray-400">Pricing prediction could not be generated</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {opportunity.pricingPrediction?.reasoning || "No incumbent contract found for this opportunity. Without historical contract data from USAspending, the AI cannot generate a reliable bid price prediction. Manual pricing analysis is recommended."}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="mb-5">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {opportunity.summary}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              {opportunity.fullDescription}
            </p>
          </div>

          {/* Point of Contact */}
          <div className="mb-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Point of Contact</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-400" />
                {opportunity.pointOfContact.name}
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Mail className="w-4 h-4 text-gray-400" />
                {opportunity.pointOfContact.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                {opportunity.pointOfContact.phone}
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Attached Documents ({opportunity.attachments.length})
            </h3>
            <div className="space-y-2">
              {opportunity.attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{att.name}</p>
                      <p className="text-[10px] text-gray-400">{att.size ? `${att.size} - ` : ""}{att.type}</p>
                    </div>
                  </div>
                  {att.url ? (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  ) : (
                    <button className="p-2 rounded-lg text-gray-300 cursor-not-allowed" disabled>
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0 bg-gray-50">
          <button
            onClick={() => {
              localStorage.setItem("arber_summary_opportunity", JSON.stringify(opportunity));
              window.open("/opportunities/summary", "_blank");
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1e2a3a] hover:bg-[#2a3d55] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {generatingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {generatingPdf ? "Generating PDF..." : "Generate AI Summary Report"}
          </button>
          <button
            onClick={async () => {
              const withUrl = opportunity.attachments.filter((a) => a.url);
              if (withUrl.length === 0) return;
              if (withUrl.length === 1) {
                window.open(withUrl[0].url, "_blank");
                return;
              }
              try {
                const JSZip = (await import("jszip")).default;
                const zip = new JSZip();
                await Promise.allSettled(
                  withUrl.map(async (a) => {
                    const resp = await fetch(a.url!);
                    if (!resp.ok) return;
                    const blob = await resp.blob();
                    zip.file(a.name || `attachment_${withUrl.indexOf(a) + 1}`, blob);
                  })
                );
                const content = await zip.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(content);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${opportunity.noticeId}_documents.zip`;
                link.click();
                URL.revokeObjectURL(url);
              } catch {
                withUrl.forEach((a) => window.open(a.url, "_blank"));
              }
            }}
            disabled={!opportunity.attachments.some((att) => att.url)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 hover:border-gray-300 hover:bg-white text-gray-600 text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Download All Docs
          </button>
        </div>
      </div>
    </div>
  );
}
