"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  ChevronRight,
  Search,
  Loader2,
  Trash2,
  Calendar,
  Building2,
} from "lucide-react";
import { listDrafts, deleteDraft } from "@/lib/api";
import type { SavedDraft } from "@/lib/api";

function getStatusStyle(status: string) {
  switch (status) {
    case "ready_for_review":
      return "bg-green-100 text-green-700";
    case "in_progress":
      return "bg-blue-100 text-blue-700";
    case "draft":
      return "bg-gray-100 text-gray-600";
    case "submitted":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProposalWorkspacePage() {
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [bidTypeFilter, setBidTypeFilter] = useState<"all" | "RFQ" | "RFP">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await listDrafts();
        if (result.success) {
          setDrafts(result.drafts);
        } else {
          setLoadError((result as { error?: string }).error || "Failed to load drafts");
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to connect to backend");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (e: React.MouseEvent, draftId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this draft? This cannot be undone.")) return;
    setDeletingId(draftId);
    try {
      const result = await deleteDraft(draftId);
      if (result.success) {
        setDrafts((prev) => prev.filter((d) => d.id !== draftId));
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = drafts.filter((draft) => {
    const draftBidType = (draft.bidType || "").toUpperCase();
    if (bidTypeFilter !== "all" && draftBidType !== bidTypeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (draft.title || "").toLowerCase().includes(q) ||
      (draft.agency || "").toLowerCase().includes(q) ||
      (draft.notice_id || "").toLowerCase().includes(q)
    );
  });

  const rfqCount = drafts.filter((draft) => (draft.bidType || "").toUpperCase() === "RFQ").length;
  const rfpCount = drafts.filter((draft) => (draft.bidType || "").toUpperCase() === "RFP").length;

  return (
    <div className="p-3 sm:p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Proposal Workspace</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Your saved proposal drafts — click to continue editing
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-5">
        {[
          { label: "Total Drafts", value: drafts.length, color: "bg-slate-50 text-slate-700" },
          { label: "Draft", value: drafts.filter((d) => d.status === "draft").length, color: "bg-gray-50 text-gray-700" },
          { label: "In Progress", value: drafts.filter((d) => d.status === "in_progress").length, color: "bg-blue-50 text-blue-700" },
          { label: "Ready for Review", value: drafts.filter((d) => d.status === "ready_for_review").length, color: "bg-green-50 text-green-700" },
          { label: "Submitted", value: drafts.filter((d) => d.status === "submitted").length, color: "bg-purple-50 text-purple-700" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border border-gray-100 p-3 ${stat.color}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search drafts by title, agency, or notice ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
          />
        </div>
        <div className="flex items-center gap-2">
          {[
            { key: "all" as const, label: "All", count: drafts.length },
            { key: "RFQ" as const, label: "RFQ", count: rfqCount },
            { key: "RFP" as const, label: "RFP", count: rfpCount },
          ].map((option) => {
            const active = bidTypeFilter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setBidTypeFilter(option.key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-gray-200 hover:border-gray-300 hover:bg-slate-50"
                }`}
              >
                {option.label} ({option.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {loadError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-3" />
          <p className="text-sm text-slate-500">Loading drafts...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((draft) => (
            <Link
              key={draft.id}
              href={`/opportunities/draft?draftId=${draft.id}`}
              className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
            >
              <div className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusStyle(draft.status)}`}>
                        {formatStatus(draft.status)}
                      </span>
                      {draft.bidType && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          draft.bidType.toUpperCase() === "RFP"
                            ? "bg-red-100 text-red-700"
                            : draft.bidType.toUpperCase() === "RFQ"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {draft.bidType.toUpperCase()}
                        </span>
                      )}
                      {draft.version && draft.version > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-600">
                          v{draft.version}
                        </span>
                      )}
                      {draft.notice_id && (
                        <span className="text-[10px] text-gray-400 font-mono">{draft.notice_id}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 truncate pr-4">
                      {draft.title || "Untitled Draft"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                      {draft.agency && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {draft.agency}
                        </span>
                      )}
                      {draft.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Due: {new Date(draft.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Modified: {new Date(draft.last_modified).toLocaleDateString("en-US", { month: "short", day: "numeric" })} {new Date(draft.last_modified).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleDelete(e, draft.id)}
                      disabled={deletingId === draft.id}
                      className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete draft"
                    >
                      {deletingId === draft.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                {drafts.length === 0
                  ? "No drafts yet. Generate a draft from an opportunity to get started."
                  : "No drafts match your search."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
