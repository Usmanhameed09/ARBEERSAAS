"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Loader2,
  FileText,
  Clock,
  MapPin,
  Building2,
  Shield,
  DollarSign,
  Users,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  User,
  ArrowLeft,
} from "lucide-react";
import type { Opportunity } from "@/data/opportunities";
import { generateSummaryPdf } from "@/lib/generateSummaryPdf";

const API_BASE = "https://arbersaas.duckdns.org/api";

interface AISummary {
  projectOverview: string;
  keyDeadlines: string;
  requirementsSummary: string;
  contactInfo: string;
  complianceAssessment: string;
  pricingIntelligence: string;
  incumbentCompetition: string;
  attachmentHighlights: string;
  recommendation: string;
}

export default function AISummaryPage() {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [oppData, setOppData] = useState<Record<string, string | number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    // Load opportunity from localStorage (set by opener)
    try {
      const raw = localStorage.getItem("arber_summary_opportunity");
      if (!raw) {
        setError("No opportunity data found. Please go back and try again.");
        setLoading(false);
        return;
      }
      const opp = JSON.parse(raw) as Opportunity;
      setOpportunity(opp);

      // Fetch AI summary
      (async () => {
        try {
          const token = localStorage.getItem("arber_token");
          const response = await fetch(`${API_BASE}/ai-summary`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ opportunity: opp }),
          });

          if (!response.ok) throw new Error(`Backend error: ${response.status}`);
          const data = await response.json();
          if (!data.success) throw new Error(data.error || "AI summary generation failed");

          setSummary(data.summary);
          setOppData(data.opportunity);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to generate summary");
        } finally {
          setLoading(false);
        }
      })();
    } catch {
      setError("Failed to load opportunity data.");
      setLoading(false);
    }
  }, []);

  const handleDownloadPdf = async () => {
    if (!opportunity) return;
    setDownloadingPdf(true);
    try {
      await generateSummaryPdf(opportunity);
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!opportunity && !loading && error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button onClick={() => window.close()} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  const isGo = opportunity?.status === "Go";

  const renderSection = (
    icon: React.ReactNode,
    title: string,
    content: string,
    bgColor: string,
    iconBg: string
  ) => (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
        <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
      </div>
      <div className={`${bgColor} rounded-xl p-4 border border-slate-100`}>
        <div className="text-[13px] text-slate-700 leading-[1.8] whitespace-pre-line">
          {content}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.close()}
              className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 text-sm font-medium transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Close
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-bold text-slate-800">AI Summary Report</span>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#182434] hover:bg-[#223247] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            {downloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download PDF
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            </div>
            <p className="text-base font-semibold text-slate-700">Generating AI Summary...</p>
            <p className="text-sm text-slate-400 mt-1">Analyzing contract details, compliance, and pricing</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32">
            <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        ) : summary && opportunity ? (
          <>
            {/* Hero Header */}
            <div className={`rounded-2xl overflow-hidden shadow-lg mb-8 ${isGo ? "bg-gradient-to-br from-[#182434] via-[#1a3050] to-[#0f4a3a]" : "bg-gradient-to-br from-[#182434] via-[#2d1a1a] to-[#4a1c1c]"}`}>
              <div className="px-8 py-7">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${isGo ? "bg-green-500/20 text-green-300 ring-1 ring-green-500/30" : "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"}`}>
                    AI Recommendation: {opportunity.status}
                  </span>
                  {oppData && (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white/80 ring-1 ring-white/10">
                      Compliance Score: {oppData.complianceScore}/100
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-white leading-snug mb-4">
                  {opportunity.title}
                </h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-white/70">
                    <Building2 className="w-4 h-4 text-white/40" />
                    <span>{opportunity.agency}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <Clock className="w-4 h-4 text-white/40" />
                    <span>Due: {opportunity.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <MapPin className="w-4 h-4 text-white/40" />
                    <span>{opportunity.placeOfPerformance || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <FileText className="w-4 h-4 text-white/40" />
                    <span>NAICS: {opportunity.naicsCode} | {opportunity.noticeId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* POC Section */}
            {opportunity.pointOfContact && (opportunity.pointOfContact.name || opportunity.pointOfContact.email) && (
              <div className="mb-6 bg-blue-50 rounded-2xl p-5 border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-[13px] font-bold text-blue-900 uppercase tracking-wider">Point of Contact</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-10">
                  {opportunity.pointOfContact.name && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="font-medium">{opportunity.pointOfContact.name}</span>
                    </div>
                  )}
                  {opportunity.pointOfContact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <a href={`mailto:${opportunity.pointOfContact.email}`} className="text-blue-600 hover:underline font-medium">
                        {opportunity.pointOfContact.email}
                      </a>
                    </div>
                  )}
                  {opportunity.pointOfContact.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Phone className="w-4 h-4 text-blue-400" />
                      <span className="font-medium">{opportunity.pointOfContact.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Two column layout for main sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                {renderSection(
                  <FileText className="w-4 h-4 text-slate-600" />,
                  "Project Overview",
                  summary.projectOverview,
                  "bg-white",
                  "bg-slate-100"
                )}
                {renderSection(
                  <Clock className="w-4 h-4 text-red-600" />,
                  "Key Deadlines",
                  summary.keyDeadlines,
                  "bg-white",
                  "bg-red-50"
                )}
                {renderSection(
                  <Shield className="w-4 h-4 text-amber-600" />,
                  "Compliance & Risk Assessment",
                  summary.complianceAssessment,
                  "bg-white",
                  "bg-amber-50"
                )}
                {renderSection(
                  <DollarSign className="w-4 h-4 text-emerald-600" />,
                  "Pricing Intelligence",
                  summary.pricingIntelligence,
                  "bg-white",
                  "bg-emerald-50"
                )}
              </div>
              <div>
                {renderSection(
                  <FileText className="w-4 h-4 text-slate-600" />,
                  "Requirements Summary",
                  summary.requirementsSummary,
                  "bg-white",
                  "bg-slate-100"
                )}
                {renderSection(
                  <Users className="w-4 h-4 text-purple-600" />,
                  "Incumbent & Competition",
                  summary.incumbentCompetition,
                  "bg-white",
                  "bg-purple-50"
                )}
                {renderSection(
                  <Paperclip className="w-4 h-4 text-blue-600" />,
                  "Attachment Highlights",
                  summary.attachmentHighlights,
                  "bg-white",
                  "bg-blue-50"
                )}
                {summary.contactInfo && renderSection(
                  <Phone className="w-4 h-4 text-blue-600" />,
                  "Contact Information",
                  summary.contactInfo,
                  "bg-white",
                  "bg-blue-50"
                )}
              </div>
            </div>

            {/* Recommendation - full width */}
            <div className={`rounded-2xl p-6 border-2 shadow-sm ${isGo ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-2.5 mb-3">
                <CheckCircle2 className={`w-6 h-6 ${isGo ? "text-green-600" : "text-red-600"}`} />
                <h3 className={`text-[14px] font-bold uppercase tracking-wider ${isGo ? "text-green-800" : "text-red-800"}`}>
                  Final Recommendation
                </h3>
              </div>
              <p className="text-[14px] text-slate-700 leading-[1.8] pl-9">
                {summary.recommendation}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-[11px] text-slate-400">
              Generated by ARBER AI · {new Date().toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "long", timeStyle: "short" })} CST
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
