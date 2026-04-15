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
  ClipboardList,
} from "lucide-react";
import type { Opportunity } from "@/data/opportunities";
import { generateSummaryPdf } from "@/lib/generateSummaryPdf";

const API_BASE = "https://arberwebapp.arbernetwork.com/api";
// const API_BASE = "http://localhost:8000/api";

interface AISummary {
  projectOverview: string;
  keyDeadlines: string;
  complianceGatekeepers: string;
  scopeBreakdown: string;
  laborRequirements: string;
  pricingStructure: string;
  evaluationCriteria: string;
  risksRedFlags: string;
  incumbentCompetition: string;
  attachmentHighlights: string;
  opportunityMapping: string;
  actionPlan: string;
  contactInfo: string;
  instructionsToOfferors: string;
  recommendation: string;
  // Legacy
  requirementsSummary?: string;
  complianceAssessment?: string;
  pricingIntelligence?: string;
}

export default function AISummaryPage() {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [oppData, setOppData] = useState<Record<string, string | number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("arber_summary_opportunity");
      if (!raw) {
        setError("No opportunity data found. Please go back and try again.");
        setLoading(false);
        return;
      }
      const opp = JSON.parse(raw) as Opportunity;
      setOpportunity(opp);

      // Cache AI summary per notice ID so reopening the page shows the same
      // summary immediately instead of re-running the expensive backend call.
      const cacheKey = `arber_ai_summary_${opp.noticeId || opp.id || "unknown"}`;
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached?.summary) {
            setSummary(cached.summary);
            setOppData(cached.opportunity || null);
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore cache errors, fall through to fetch
      }

      (async () => {
        try {
          const token = localStorage.getItem("arber_token");
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout
          const response = await fetch(`${API_BASE}/ai-summary`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ opportunity: opp }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) throw new Error(`Backend error: ${response.status}`);
          const data = await response.json();
          if (!data.success) throw new Error(data.error || "AI summary generation failed");

          setSummary(data.summary);
          setOppData(data.opportunity);
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              summary: data.summary,
              opportunity: data.opportunity,
              cachedAt: Date.now(),
            }));
          } catch {
            // storage full / private mode — non-fatal
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            setError("Request timed out. The backend may be unavailable — please try again.");
          } else if (err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("NetworkError") || err.message.includes("Failed to fetch"))) {
            setError("Cannot connect to backend server. Please ensure it is running.");
          } else {
            setError(err instanceof Error ? err.message : "Failed to generate summary");
          }
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
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

  const formatDueDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/Chicago",
      });
    } catch {
      return dateStr;
    }
  };

  const renderSection = (
    icon: React.ReactNode,
    title: string,
    content: string,
    bgColor: string,
    iconBg: string
  ) => (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl ${iconBg} flex items-center justify-center shadow-sm shrink-0`}>
          {icon}
        </div>
        <h3 className="text-[12px] sm:text-[13px] font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
      </div>
      <div className={`${bgColor} rounded-xl p-3 sm:p-4 border border-slate-100`}>
        <div className="text-[12px] sm:text-[13px] text-slate-700 leading-[1.7] sm:leading-[1.8] whitespace-pre-line">
          {content}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => window.close()}
              className="flex items-center gap-1 sm:gap-1.5 text-slate-600 hover:text-slate-800 text-xs sm:text-sm font-medium transition shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">AI Summary Report</span>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || loading}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#182434] hover:bg-[#223247] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm shrink-0"
          >
            {downloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-blue-600" />
              </div>
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-700">Generating AI Summary...</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 text-center px-4">Analyzing contract details, compliance, and pricing</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32">
            <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-sm text-red-600 font-medium text-center px-4">{error}</p>
          </div>
        ) : summary && opportunity ? (
          <>
            {/* Hero Header */}
            <div
              className={`rounded-xl sm:rounded-2xl overflow-hidden shadow-lg mb-4 sm:mb-8 ${isGo ? "bg-gradient-to-br from-[#182434] via-[#1a3050] to-[#0f4a3a]" : "bg-gradient-to-br from-[#182434] via-[#2d1a1a] to-[#4a1c1c]"}`}
            >
              <div style={{ padding: "20px" }} className="sm:!px-8 sm:!py-7">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                  <span
                    style={{
                      backgroundColor: isGo ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                      color: isGo ? "#86efac" : "#fca5a5",
                      border: `1px solid ${isGo ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    }}
                    className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider"
                  >
                    AI Recommendation: {opportunity.status}
                  </span>
                  {oppData && (
                    <span
                      style={{
                        backgroundColor: "rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.8)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold"
                    >
                      Compliance Score: {oppData.complianceScore}/100
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1
                  style={{ color: "#ffffff", fontSize: "clamp(1.1rem, 4vw, 1.5rem)" }}
                  className="font-bold leading-snug mb-3 sm:mb-4"
                >
                  {opportunity.title}
                </h1>

                {/* Metadata grid - 1 col mobile, 2 col tablet, 4 col desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
                    <span className="truncate">{opportunity.agency}</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
                    <span>Due: {formatDueDate(opportunity.dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
                    <span className="truncate">{opportunity.placeOfPerformance || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
                    <span className="truncate">NAICS: {opportunity.naicsCode} | {opportunity.noticeId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* POC Section */}
            {opportunity.pointOfContact && (opportunity.pointOfContact.name || opportunity.pointOfContact.email) && (
              <div className="mb-4 sm:mb-6 bg-blue-50 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-blue-100 shadow-sm">
                <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <h3 className="text-[12px] sm:text-[13px] font-bold text-blue-900 uppercase tracking-wider">Point of Contact</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pl-0 sm:pl-10">
                  {opportunity.pointOfContact.name && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                      <span className="font-medium">{opportunity.pointOfContact.name}</span>
                    </div>
                  )}
                  {opportunity.pointOfContact.email && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                      <a href={`mailto:${opportunity.pointOfContact.email}`} className="text-blue-600 hover:underline font-medium truncate">
                        {opportunity.pointOfContact.email}
                      </a>
                    </div>
                  )}
                  {opportunity.pointOfContact.phone && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                      <span className="font-medium">{opportunity.pointOfContact.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sections - two column on desktop, stacks on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 mb-4 sm:mb-6">
              <div>
                {renderSection(
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />,
                  "1. Project Overview",
                  summary.projectOverview,
                  "bg-white",
                  "bg-slate-100"
                )}
                {renderSection(
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />,
                  "2. Key Deadlines",
                  summary.keyDeadlines,
                  "bg-white",
                  "bg-red-50"
                )}
                {renderSection(
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />,
                  "3. Compliance Gatekeepers",
                  summary.complianceGatekeepers || summary.complianceAssessment || "",
                  "bg-white",
                  "bg-amber-50"
                )}
                {renderSection(
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />,
                  "4. Scope of Work Breakdown",
                  summary.scopeBreakdown || summary.requirementsSummary || "",
                  "bg-white",
                  "bg-slate-100"
                )}
                {(summary.laborRequirements) && renderSection(
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />,
                  "5. Labor & Resource Requirements",
                  summary.laborRequirements,
                  "bg-white",
                  "bg-purple-50"
                )}
                {renderSection(
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />,
                  "6. Pricing & Cost Structure",
                  summary.pricingStructure || summary.pricingIntelligence || "",
                  "bg-white",
                  "bg-emerald-50"
                )}
                {(summary.evaluationCriteria) && renderSection(
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />,
                  "7. Evaluation Criteria",
                  summary.evaluationCriteria,
                  "bg-white",
                  "bg-blue-50"
                )}
              </div>
              <div>
                {(summary.risksRedFlags) && renderSection(
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />,
                  "8. Risks & Red Flags",
                  summary.risksRedFlags,
                  "bg-white",
                  "bg-red-50"
                )}
                {renderSection(
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />,
                  "9. Incumbent & Competition",
                  summary.incumbentCompetition,
                  "bg-white",
                  "bg-purple-50"
                )}
                {renderSection(
                  <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />,
                  "10. Attachment Highlights",
                  summary.attachmentHighlights,
                  "bg-white",
                  "bg-blue-50"
                )}
                {(summary.opportunityMapping) && renderSection(
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />,
                  "11. Opportunity Mapping",
                  summary.opportunityMapping,
                  "bg-white",
                  "bg-teal-50"
                )}
                {(summary.actionPlan) && renderSection(
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />,
                  "12. Action Plan",
                  summary.actionPlan,
                  "bg-white",
                  "bg-slate-100"
                )}
                {summary.contactInfo && renderSection(
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />,
                  "13. Contact Information",
                  summary.contactInfo,
                  "bg-white",
                  "bg-blue-50"
                )}
                {summary.instructionsToOfferors && renderSection(
                  <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />,
                  "14. Instructions to Offerors (Section L)",
                  summary.instructionsToOfferors,
                  "bg-white",
                  "bg-indigo-50"
                )}
              </div>
            </div>

            {/* Recommendation - full width */}
            <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 shadow-sm ${isGo ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
                <CheckCircle2 className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${isGo ? "text-green-600" : "text-red-600"}`} />
                <h3 className={`text-[13px] sm:text-[14px] font-bold uppercase tracking-wider ${isGo ? "text-green-800" : "text-red-800"}`}>
                  Final Recommendation
                </h3>
              </div>
              <p className="text-[12px] sm:text-[14px] text-slate-700 leading-[1.7] sm:leading-[1.8] pl-7 sm:pl-9">
                {summary.recommendation}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-6 sm:mt-8 text-center text-[10px] sm:text-[11px] text-slate-400 pb-4">
              Generated by ARBER AI · {new Date().toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "long", timeStyle: "short" })} CST
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
