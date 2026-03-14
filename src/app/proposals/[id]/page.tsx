"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  FileWarning,
  CircleDot,
  Pencil,
  FileText,
  Shield,
  ClipboardList,
  BookOpen,
  ListChecks,
  Info,
  Clock,
  Upload,
  Eye,
  Sparkles,
  XCircle,
  CircleCheck,
  CircleAlert,
  File,
  Lightbulb,
} from "lucide-react";
import { proposalDrafts } from "@/data/proposals";
import type { ProposalDraft, ProposalVolume, ProposalSection, SectionStatus, ComplianceItem } from "@/data/proposals";

const statusConfig: Record<SectionStatus, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  ai_complete: { label: "AI Complete", color: "text-green-700", bg: "bg-green-100", icon: CheckCircle2 },
  ai_draft: { label: "AI Draft", color: "text-blue-700", bg: "bg-blue-100", icon: Pencil },
  human_required: { label: "Human Input Needed", color: "text-amber-700", bg: "bg-amber-100", icon: AlertTriangle },
  missing_doc: { label: "Missing Document", color: "text-red-600", bg: "bg-red-100", icon: FileWarning },
  not_started: { label: "Not Started", color: "text-gray-500", bg: "bg-gray-100", icon: CircleDot },
};

const complianceStatusConfig: Record<string, { label: string; color: string; dot: string }> = {
  met: { label: "Met", color: "text-green-700", dot: "bg-green-500" },
  partial: { label: "Partial", color: "text-amber-600", dot: "bg-amber-400" },
  not_met: { label: "Not Met", color: "text-red-600", dot: "bg-red-500" },
  needs_review: { label: "Needs Review", color: "text-blue-600", dot: "bg-blue-500" },
};

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const draft = proposalDrafts.find((d) => d.id === id);

  const [expandedVolumes, setExpandedVolumes] = useState<Set<string>>(new Set(["v1-1", "v2-1", "v3-1"]));
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"outline" | "compliance" | "requirements" | "forms">("outline");

  if (!draft) {
    return (
      <div className="p-5">
        <p className="text-sm text-gray-400">Proposal not found.</p>
        <Link href="/proposals" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
          Back to Proposals
        </Link>
      </div>
    );
  }

  const toggleVolume = (id: string) => {
    setExpandedVolumes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const totalSections = draft.volumes.reduce((acc, v) => acc + v.sections.length, 0);
  const completeSections = draft.volumes.reduce(
    (acc, v) => acc + v.sections.filter((s) => s.status === "ai_complete").length,
    0
  );
  const humanNeeded = draft.volumes.reduce(
    (acc, v) => acc + v.sections.filter((s) => s.status === "human_required" || s.status === "missing_doc").length,
    0
  );
  const complianceMet = draft.complianceMatrix.filter((c) => c.status === "met").length;
  const complianceTotal = draft.complianceMatrix.length;

  return (
    <div className="p-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
        <Link href="/proposals" className="hover:text-blue-600 transition-colors">
          Proposal Workspace
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-600 font-medium truncate max-w-[400px]">{draft.title}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                draft.status === "Ready for Review" ? "bg-green-100 text-green-700" :
                draft.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {draft.status}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">{draft.noticeId}</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-1">{draft.title}</h1>
            <p className="text-xs text-gray-500">{draft.agency}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Due Date</p>
              <p className="text-sm font-bold text-gray-800">{draft.dueDate}</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-5 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Progress</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${draft.overallProgress >= 80 ? "bg-green-500" : draft.overallProgress >= 50 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${draft.overallProgress}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-700">{draft.overallProgress}%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Sections Complete</p>
            <p className="text-sm font-bold text-gray-800 mt-1">{completeSections} / {totalSections}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Your Action Needed</p>
            <p className={`text-sm font-bold mt-1 ${humanNeeded > 0 ? "text-amber-600" : "text-green-600"}`}>
              {humanNeeded} section{humanNeeded !== 1 ? "s" : ""}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Compliance</p>
            <p className={`text-sm font-bold mt-1 ${complianceMet === complianceTotal ? "text-green-600" : "text-amber-600"}`}>
              {complianceMet} / {complianceTotal} met
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Last Modified</p>
            <p className="text-sm font-bold text-gray-800 mt-1">{draft.lastModified}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-5">
        {[
          { key: "outline" as const, label: "Proposal Outline", Icon: BookOpen },
          { key: "compliance" as const, label: "Compliance Matrix", Icon: ListChecks },
          { key: "requirements" as const, label: "Extracted Requirements", Icon: ClipboardList },
          { key: "forms" as const, label: "Forms & Docs", Icon: File },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-[#1e2a3a] text-white shadow"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="flex items-center justify-center w-4 h-4">
              <tab.Icon className="w-3.5 h-3.5" />
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "outline" && (
        <div className="space-y-4">
          {draft.volumes.map((volume) => {
            const isExpanded = expandedVolumes.has(volume.id);
            const volComplete = volume.sections.filter((s) => s.status === "ai_complete").length;
            const volHuman = volume.sections.filter((s) => s.status === "human_required" || s.status === "missing_doc").length;

            return (
              <div key={volume.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleVolume(volume.id)}
                  className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1e2a3a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {volume.number}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-sm font-bold text-gray-900">
                      Volume {volume.number} - {volume.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px]">
                      <span className="text-gray-400">{volume.sections.length} sections</span>
                      <span className="text-green-600">{volComplete} complete</span>
                      {volHuman > 0 && (
                        <span className="text-amber-600">{volHuman} need input</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {volume.sections.map((section) => {
                      const cfg = statusConfig[section.status];
                      const StatusIcon = cfg.icon;
                      const isSecExpanded = expandedSection === section.id;

                      return (
                        <div key={section.id} className="border-b border-gray-50 last:border-b-0">
                          <button
                            onClick={() => setExpandedSection(isSecExpanded ? null : section.id)}
                            className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50/30 transition-colors cursor-pointer"
                          >
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center ${cfg.bg}`}>
                              <StatusIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                            </span>
                            <span className="text-xs font-mono text-gray-400 w-8">{section.number}</span>
                            <span className="text-xs font-semibold text-gray-800 flex-1 text-left">{section.title}</span>
                            <div className="flex items-center gap-3 text-[10px] text-gray-400">
                              {section.scoringWeight && (
                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded font-semibold">
                                  {section.scoringWeight}% weight
                                </span>
                              )}
                              {section.pageLimit && (
                                <span className={`px-1.5 py-0.5 rounded font-semibold ${
                                  section.currentPages && section.currentPages >= section.pageLimit
                                    ? "bg-red-50 text-red-600"
                                    : "bg-gray-50 text-gray-500"
                                }`}>
                                  {section.currentPages || 0}/{section.pageLimit} pages
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded font-semibold ${cfg.bg} ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSecExpanded ? "rotate-180" : ""}`} />
                            </div>
                          </button>

                          {isSecExpanded && (
                            <div className="px-5 pb-4 ml-9 space-y-3">
                              {/* AI drafting prompt */}
                              {section.aiDraftingPrompt && (
                                <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                                  <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] font-bold text-blue-700 uppercase mb-0.5">AI Drafting Guidance</p>
                                    <p className="text-xs text-blue-600 leading-relaxed">{section.aiDraftingPrompt}</p>
                                  </div>
                                </div>
                              )}

                              {/* Human action required */}
                              {section.humanAction && (
                                <div className="bg-amber-50 rounded-lg p-3 flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] font-bold text-amber-700 uppercase mb-0.5">Action Required</p>
                                    <p className="text-xs text-amber-700 leading-relaxed">{section.humanAction}</p>
                                    {section.status === "missing_doc" && (
                                      <button className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white text-[10px] font-semibold rounded-lg hover:bg-amber-700 transition-colors">
                                        <Upload className="w-3 h-3" />
                                        Upload Document
                                      </button>
                                    )}
                                    {section.status === "human_required" && (
                                      <button className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white text-[10px] font-semibold rounded-lg hover:bg-amber-700 transition-colors">
                                        <Pencil className="w-3 h-3" />
                                        Complete Section
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Content preview */}
                              {section.content && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Draft Content</p>
                                    <div className="flex items-center gap-2">
                                      <button className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        Full View
                                      </button>
                                      <button className="text-[10px] text-gray-500 hover:text-gray-600 font-semibold flex items-center gap-1">
                                        <Pencil className="w-3 h-3" />
                                        Edit
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                                    {section.content}
                                  </p>
                                </div>
                              )}

                              {/* Section not started */}
                              {section.status === "not_started" && !section.humanAction && (
                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                  <p className="text-xs text-gray-400">This section has not been started yet.</p>
                                  <button className="mt-2 px-3 py-1.5 bg-[#1e2a3a] text-white text-[10px] font-semibold rounded-lg hover:bg-[#2a3a4e] transition-colors inline-flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Generate AI Draft
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "compliance" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Compliance Matrix
            </h2>
            <span className="text-xs text-gray-400">
              {complianceMet} of {complianceTotal} requirements met
            </span>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-5 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wider w-14">ID</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Requirement</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wider w-20">Section</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wider w-28">Status</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-500 text-[10px] uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody>
              {draft.complianceMatrix.map((item) => {
                const cfg = complianceStatusConfig[item.status];
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-blue-50/20">
                    <td className="px-5 py-2.5 font-mono text-gray-400">{item.id.toUpperCase()}</td>
                    <td className="px-4 py-2.5 text-gray-800">{item.requirement}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-500">{item.sectionRef}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 font-semibold ${cfg.color}`}>
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500">{item.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "requirements" && (
        <div className="space-y-4">
          {/* Section L */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Section L - Instructions to Offerors</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Extracted submission instructions and requirements</p>
            </div>
            <div className="px-5 py-3 space-y-2">
              {draft.extractedRequirements.sectionL.map((req, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <ClipboardList className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  {req}
                </div>
              ))}
            </div>
          </div>

          {/* Section M */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Section M - Evaluation Factors</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">How your proposal will be scored</p>
            </div>
            <div className="px-5 py-3 space-y-2">
              {draft.extractedRequirements.sectionM.map((factor, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Page Limits */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Page Limits</h2>
            </div>
            <div className="px-5 py-3 space-y-2">
              {draft.extractedRequirements.pageLimits.map((pl, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-700 flex-1">{pl.volume}</span>
                  <span className="font-bold text-gray-800">
                    {pl.limit === 0 ? "No limit" : `${pl.limit} pages`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Formatting Rules */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Formatting Rules</h2>
            </div>
            <div className="px-5 py-3 space-y-2">
              {draft.extractedRequirements.formattingRules.map((rule, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  {rule}
                </div>
              ))}
            </div>
          </div>

          {/* Mandatory Reps */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Mandatory Representations</h2>
            </div>
            <div className="px-5 py-3 space-y-2">
              {draft.extractedRequirements.mandatoryReps.map((rep, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {rep.status === "complete" ? (
                    <CircleCheck className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <CircleAlert className="w-3.5 h-3.5 text-red-500" />
                  )}
                  <span className="text-gray-700 flex-1">{rep.name}</span>
                  <span className={`text-[10px] font-semibold ${rep.status === "complete" ? "text-green-600" : "text-red-500"}`}>
                    {rep.status === "complete" ? "Complete" : "Incomplete"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "forms" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <File className="w-4 h-4 text-purple-500" />
              Required Forms & Attachments
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {draft.extractedRequirements.requiredForms.map((form, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  form.status === "attached" ? "bg-green-50" :
                  form.status === "in_progress" ? "bg-blue-50" :
                  "bg-red-50"
                }`}>
                  {form.status === "attached" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : form.status === "in_progress" ? (
                    <Clock className="w-4 h-4 text-blue-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-800">{form.name}</p>
                  <p className={`text-[10px] font-medium ${
                    form.status === "attached" ? "text-green-600" :
                    form.status === "in_progress" ? "text-blue-600" :
                    "text-red-500"
                  }`}>
                    {form.status === "attached" ? "Attached" : form.status === "in_progress" ? "In Progress" : "Missing"}
                  </p>
                </div>
                {form.status === "missing" && (
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-semibold rounded-lg transition-colors">
                    <Upload className="w-3 h-3" />
                    Upload
                  </button>
                )}
                {form.status === "attached" && (
                  <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-semibold rounded-lg transition-colors">
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
