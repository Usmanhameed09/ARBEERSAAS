"use client";

import { useState, useEffect } from "react";
import {
  X,
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
  Briefcase,
  Target,
  ListChecks,
  ClipboardList,
  Compass,
} from "lucide-react";
import type { Opportunity } from "@/data/opportunities";
import { generateSummaryPdf } from "@/lib/generateSummaryPdf";

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
  recommendation: string;
  // Legacy
  requirementsSummary?: string;
  complianceAssessment?: string;
  pricingIntelligence?: string;
}

interface AISummaryModalProps {
  opportunity: Opportunity;
  onClose: () => void;
}

const API_BASE = "https://arbersaas.duckdns.org/api";
// const API_BASE = "http://localhost:8000/api";

export default function AISummaryModal({ opportunity, onClose }: AISummaryModalProps) {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [oppData, setOppData] = useState<Record<string, string | number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Fetch summary on mount
  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("arber_token") : null;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout
        const response = await fetch(`${API_BASE}/ai-summary`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ opportunity }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Backend error: ${response.status}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.error || "AI summary generation failed");

        setSummary(data.summary);
        setOppData(data.opportunity);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("Request timed out. The backend may be unavailable.");
        } else if (err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("Failed to fetch"))) {
          setError("Cannot connect to backend server. Please ensure it is running.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to generate summary");
        }
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await generateSummaryPdf(opportunity);
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const isGo = opportunity.status === "Go";

  const renderSection = (
    icon: React.ReactNode,
    title: string,
    content: string,
    color: string
  ) => (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="pl-8 text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">
        {content}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 relative">
        {/* Header */}
        <div className={`rounded-t-2xl px-6 py-5 ${isGo ? "bg-gradient-to-r from-[#182434] to-[#1e3a5f]" : "bg-gradient-to-r from-[#182434] to-[#4a1c1c]"}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${isGo ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                  AI: {opportunity.status}
                </span>
                {oppData && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/80">
                    Score: {oppData.complianceScore}/100
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white leading-snug mb-1">
                {opportunity.title}
              </h2>
              <div className="flex flex-wrap gap-3 text-[11px] text-white/70">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {opportunity.agency}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Due: {opportunity.dueDate}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {opportunity.placeOfPerformance || "N/A"}
                </span>
                <span>NAICS: {opportunity.naicsCode}</span>
                <span>Notice ID: {opportunity.noticeId}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
              >
                {downloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                PDF
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-sm text-slate-600 font-medium">Generating AI Summary...</p>
              <p className="text-xs text-slate-400 mt-1">Analyzing contract details with AI</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          ) : summary ? (
            <>
              {/* POC Section - from opportunity data */}
              {opportunity.pointOfContact && (opportunity.pointOfContact.name || opportunity.pointOfContact.email) && (
                <div className="mb-5 bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Point of Contact</h3>
                  </div>
                  <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-2 text-[13px]">
                    {opportunity.pointOfContact.name && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        {opportunity.pointOfContact.name}
                      </div>
                    )}
                    {opportunity.pointOfContact.email && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-blue-500" />
                        <a href={`mailto:${opportunity.pointOfContact.email}`} className="text-blue-600 hover:underline">
                          {opportunity.pointOfContact.email}
                        </a>
                      </div>
                    )}
                    {opportunity.pointOfContact.phone && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        {opportunity.pointOfContact.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {renderSection(
                <FileText className="w-3.5 h-3.5 text-slate-600" />,
                "Project Overview",
                summary.projectOverview,
                "bg-slate-100"
              )}
              {renderSection(
                <Clock className="w-3.5 h-3.5 text-red-600" />,
                "Key Deadlines",
                summary.keyDeadlines,
                "bg-red-50"
              )}
              {(summary.complianceGatekeepers || summary.complianceAssessment) && renderSection(
                <Shield className="w-3.5 h-3.5 text-amber-600" />,
                "Compliance Gatekeepers",
                summary.complianceGatekeepers || summary.complianceAssessment || "",
                "bg-amber-50"
              )}
              {(summary.scopeBreakdown || summary.requirementsSummary) && renderSection(
                <ClipboardList className="w-3.5 h-3.5 text-slate-600" />,
                "Scope of Work Breakdown",
                summary.scopeBreakdown || summary.requirementsSummary || "",
                "bg-slate-100"
              )}
              {summary.laborRequirements && renderSection(
                <Briefcase className="w-3.5 h-3.5 text-purple-600" />,
                "Labor & Resource Requirements",
                summary.laborRequirements,
                "bg-purple-50"
              )}
              {(summary.pricingStructure || summary.pricingIntelligence) && renderSection(
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />,
                "Pricing & Cost Structure",
                summary.pricingStructure || summary.pricingIntelligence || "",
                "bg-emerald-50"
              )}
              {summary.evaluationCriteria && renderSection(
                <ListChecks className="w-3.5 h-3.5 text-blue-600" />,
                "Evaluation Criteria",
                summary.evaluationCriteria,
                "bg-blue-50"
              )}
              {summary.risksRedFlags && renderSection(
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />,
                "Risks & Red Flags",
                summary.risksRedFlags,
                "bg-red-50"
              )}
              {summary.incumbentCompetition && renderSection(
                <Users className="w-3.5 h-3.5 text-purple-600" />,
                "Incumbent & Competition",
                summary.incumbentCompetition,
                "bg-purple-50"
              )}
              {summary.attachmentHighlights && renderSection(
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />,
                "Attachment Highlights",
                summary.attachmentHighlights,
                "bg-blue-50"
              )}
              {summary.opportunityMapping && renderSection(
                <Compass className="w-3.5 h-3.5 text-teal-600" />,
                "Opportunity Mapping",
                summary.opportunityMapping,
                "bg-teal-50"
              )}
              {summary.actionPlan && renderSection(
                <Target className="w-3.5 h-3.5 text-slate-700" />,
                "Action Plan",
                summary.actionPlan,
                "bg-slate-100"
              )}
              {summary.contactInfo && renderSection(
                <Phone className="w-3.5 h-3.5 text-blue-600" />,
                "Contact Information",
                summary.contactInfo,
                "bg-blue-50"
              )}

              {/* Recommendation - highlighted */}
              <div className={`rounded-xl p-4 border-2 ${isGo ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className={`w-5 h-5 ${isGo ? "text-green-600" : "text-red-600"}`} />
                  <h3 className={`text-sm font-bold uppercase tracking-wide ${isGo ? "text-green-800" : "text-red-800"}`}>
                    Recommendation
                  </h3>
                </div>
                <p className="text-[13px] text-slate-700 leading-relaxed pl-7">
                  {summary.recommendation}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
