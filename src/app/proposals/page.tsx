"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Search,
  Filter,
  Eye,
  CircleDot,
  XCircle,
  FileWarning,
  Pencil,
} from "lucide-react";
import { proposalDrafts } from "@/data/proposals";
import type { ProposalDraft, SectionStatus } from "@/data/proposals";

type StatusFilter = "All" | "Draft" | "In Progress" | "Ready for Review" | "Submitted";

function getStatusStyle(status: string) {
  switch (status) {
    case "Ready for Review":
      return "bg-green-100 text-green-700";
    case "In Progress":
      return "bg-blue-100 text-blue-700";
    case "Draft":
      return "bg-gray-100 text-gray-600";
    case "Submitted":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function countSectionsByStatus(draft: ProposalDraft) {
  const counts: Record<SectionStatus, number> = {
    ai_complete: 0,
    ai_draft: 0,
    human_required: 0,
    missing_doc: 0,
    not_started: 0,
  };
  draft.volumes.forEach((vol) =>
    vol.sections.forEach((sec) => {
      counts[sec.status]++;
    })
  );
  return counts;
}

function complianceScore(draft: ProposalDraft) {
  const total = draft.complianceMatrix.length;
  if (total === 0) return 0;
  const met = draft.complianceMatrix.filter((c) => c.status === "met").length;
  return Math.round((met / total) * 100);
}

export default function ProposalWorkspacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const filtered = proposalDrafts.filter((draft) => {
    const matchesSearch =
      searchQuery === "" ||
      draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.noticeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || draft.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-3 sm:p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Proposal Workspace</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            AI-generated proposal drafts ready for review and completion
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-5">
        {[
          { label: "Total Drafts", value: proposalDrafts.length, color: "bg-slate-50 text-slate-700" },
          { label: "Ready for Review", value: proposalDrafts.filter((d) => d.status === "Ready for Review").length, color: "bg-green-50 text-green-700" },
          { label: "In Progress", value: proposalDrafts.filter((d) => d.status === "In Progress").length, color: "bg-blue-50 text-blue-700" },
          { label: "Human Action Needed", value: proposalDrafts.reduce((acc, d) => acc + countSectionsByStatus(d).human_required + countSectionsByStatus(d).missing_doc, 0), color: "bg-amber-50 text-amber-700" },
          { label: "Avg Compliance", value: Math.round(proposalDrafts.reduce((acc, d) => acc + complianceScore(d), 0) / proposalDrafts.length) + "%", color: "bg-purple-50 text-purple-700" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border border-gray-100 p-3 ${stat.color}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search proposals by title, agency, or notice ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-xs bg-white outline-none font-medium text-gray-600"
        >
          <option value="All">All Status</option>
          <option value="Draft">Draft</option>
          <option value="In Progress">In Progress</option>
          <option value="Ready for Review">Ready for Review</option>
          <option value="Submitted">Submitted</option>
        </select>
      </div>

      {/* Proposal cards */}
      <div className="space-y-4">
        {filtered.map((draft) => {
          const sectionCounts = countSectionsByStatus(draft);
          const totalSections = Object.values(sectionCounts).reduce((a, b) => a + b, 0);
          const compliance = complianceScore(draft);
          const humanActions = sectionCounts.human_required + sectionCounts.missing_doc;
          const missingForms = draft.extractedRequirements.requiredForms.filter((f) => f.status === "missing").length;

          return (
            <Link
              key={draft.id}
              href={`/proposals/${draft.id}`}
              className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div className="px-5 py-4">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(draft.status)}`}>
                        {draft.status}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{draft.noticeId}</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 truncate pr-4">{draft.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{draft.agency}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">Due Date</p>
                      <p className="text-xs font-semibold text-gray-700">{draft.dueDate}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-gray-500">Overall Progress</span>
                    <span className="text-[10px] font-bold text-gray-700">{draft.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        draft.overallProgress >= 80
                          ? "bg-green-500"
                          : draft.overallProgress >= 50
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${draft.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Section status breakdown + compliance */}
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {sectionCounts.ai_complete} AI Complete
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <Pencil className="w-3.5 h-3.5" />
                    {sectionCounts.ai_draft} AI Draft
                  </span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {sectionCounts.human_required} Human Needed
                  </span>
                  <span className="flex items-center gap-1 text-red-500">
                    <FileWarning className="w-3.5 h-3.5" />
                    {sectionCounts.missing_doc} Missing Docs
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <CircleDot className="w-3.5 h-3.5" />
                    {sectionCounts.not_started} Not Started
                  </span>
                  <span className="ml-auto text-gray-500 font-medium">
                    Compliance: <span className={compliance >= 70 ? "text-green-600" : compliance >= 40 ? "text-amber-600" : "text-red-500"}>{compliance}%</span>
                  </span>
                </div>

                {/* Alerts row */}
                {(humanActions > 0 || missingForms > 0) && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-50 flex items-center gap-3">
                    {humanActions > 0 && (
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-semibold">
                        {humanActions} section{humanActions > 1 ? "s" : ""} need your input
                      </span>
                    )}
                    {missingForms > 0 && (
                      <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-[10px] font-semibold">
                        {missingForms} required form{missingForms > 1 ? "s" : ""} missing
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-sm text-gray-400">No proposals match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
