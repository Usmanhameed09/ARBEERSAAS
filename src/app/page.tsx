"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusCard from "@/components/StatusCard";
import {
  OpportunityStackIcon,
  QualifiedSealIcon,
  NoGoShieldIcon,
  PricingHandshakeIcon,
  DraftClipboardIcon,
  SentPlaneIcon,
} from "@/components/DashboardRealisticIcons";
import { listDrafts, fetchSavedOpportunities, loadOpportunitiesFromDB } from "@/lib/api";
import type { SavedDraft } from "@/lib/api";
import type { Opportunity } from "@/data/opportunities";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { ChevronDown, Loader2, Building2, Calendar, ExternalLink } from "lucide-react";

interface DashboardStats {
  archivedOpportunities: number;
  qualified: number;
  noGo: number;
  activeDrafts: number;
  draftsReady: number;
  submitted: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    archivedOpportunities: 0,
    qualified: 0,
    noGo: 0,
    activeDrafts: 0,
    draftsReady: 0,
    submitted: 0,
  });
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [savedOpps, setSavedOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const { savedIds } = useSavedOpportunities();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("arber_token");
        if (!token) { setLoading(false); return; }

        // Fetch drafts
        const draftResult = await listDrafts();
        const allDrafts = draftResult.success ? draftResult.drafts : [];
        setDrafts(allDrafts);

        // Fetch saved opportunities
        const savedResult = await fetchSavedOpportunities();
        const allSavedOpps = savedResult.opportunities || [];
        setSavedOpps(allSavedOpps);

        const activeDraftCount = allDrafts.filter((d) => d.status === "draft" || d.status === "in_progress").length;
        const readyCount = allDrafts.filter((d) => d.status === "ready_for_review").length;
        const inProgressCount = allDrafts.filter((d) => d.status === "in_progress").length;
        const submittedCount = allDrafts.filter((d) => d.status === "submitted").length;

        // Fetch archived opportunities for Go/No-Go counts (same source as All Opps page)
        let qualified = 0;
        let noGo = 0;
        try {
          const archResult = await loadOpportunitiesFromDB("_");
          const archOpps = (archResult.opportunities || []).filter((o: Opportunity & { isSaved?: boolean }) => !o.isSaved);
          qualified = archOpps.filter((o: Opportunity) => o.status === "Go").length;
          noGo = archOpps.filter((o: Opportunity) => o.status === "No-Go").length;
        } catch { /* no archived data */ }

        setStats({
          archivedOpportunities: qualified + noGo,
          qualified,
          noGo,
          activeDrafts: activeDraftCount,
          draftsReady: readyCount + inProgressCount,
          submitted: submittedCount,
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [savedIds.size]);

  const statusCards = [
    { icon: OpportunityStackIcon, label: "Archived Opportunities", count: stats.archivedOpportunities, iconBg: "bg-transparent", iconColor: "", href: "/opportunities/pipeline" },
    { icon: QualifiedSealIcon, label: "Qualified (Go)", count: stats.qualified, iconBg: "bg-transparent", iconColor: "", href: "/opportunities/pipeline" },
    { icon: NoGoShieldIcon, label: "No-Go", count: stats.noGo, iconBg: "bg-transparent", iconColor: "" },
    { icon: PricingHandshakeIcon, label: "Active Drafts", count: stats.activeDrafts, iconBg: "bg-transparent", iconColor: "", href: "/proposals" },
    { icon: DraftClipboardIcon, label: "Ready for Review", count: stats.draftsReady, iconBg: "bg-transparent", iconColor: "", href: "/proposals" },
    { icon: SentPlaneIcon, label: "Submitted", count: stats.submitted, iconBg: "bg-transparent", iconColor: "" },
  ];

  const recentDrafts = drafts.slice(0, 5);
  const recentSavedOpps = savedOpps.filter((opp) => savedIds.has(opp.id)).slice(0, 5);

  return (
    <div className="p-3 sm:p-5">
      <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Mission Control</h1>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-5">
        {statusCards.map((card) => (
          <StatusCard key={card.label} {...card} />
        ))}
      </div>

      {/* Saved Opportunities Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 sm:mb-5">
        <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-gray-900">Saved Opportunities</h2>
          <Link href="/opportunities/saved" className="text-xs text-blue-600 hover:underline font-medium">
            View All
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : recentSavedOpps.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            No saved opportunities yet. Save opportunities from the search page.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] sm:text-[13px]" style={{ minWidth: "600px" }}>
              <thead>
                <tr className="bg-gray-50/80 text-left border-b border-gray-100">
                  <th className="px-5 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1">
                      Opportunity
                      <ChevronDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Agency</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">NAICS</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Set-Aside</th>
                </tr>
              </thead>
              <tbody>
                {recentSavedOpps.map((opp) => (
                  <tr key={opp.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-2.5">
                      <Link href={`/opportunities/summary?noticeId=${opp.noticeId}`} className="font-medium text-blue-600 hover:underline">
                        {opp.title || "Untitled"}
                      </Link>
                      {opp.noticeId && (
                        <span className="block text-[10px] text-gray-400 font-mono mt-0.5">{opp.noticeId}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        {opp.agency || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600">
                        {opp.type || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        {opp.dueDate ? new Date(opp.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 font-mono text-[11px]">{opp.naicsCode || "—"}</td>
                    <td className="px-4 py-2.5">
                      {opp.setAside ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                          {opp.setAside}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Drafts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-gray-900">Recent Drafts</h2>
          <Link href="/proposals" className="text-xs text-blue-600 hover:underline font-medium">
            View All
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : recentDrafts.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            No drafts yet. Generate a draft from an opportunity to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] sm:text-[13px]" style={{ minWidth: "600px" }}>
              <thead>
                <tr className="bg-gray-50/80 text-left border-b border-gray-100">
                  <th className="px-5 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1">
                      Draft
                      <ChevronDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Agency</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Version</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                {recentDrafts.map((draft) => (
                  <tr key={draft.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-2.5">
                      <Link href={`/opportunities/draft?draftId=${draft.id}`} className="font-medium text-blue-600 hover:underline">
                        {draft.title || "Untitled Draft"}
                      </Link>
                      {draft.notice_id && (
                        <span className="block text-[10px] text-gray-400 font-mono mt-0.5">{draft.notice_id}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{draft.agency || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {draft.due_date ? new Date(draft.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-600">
                        v{draft.version || 1}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        draft.status === "ready_for_review" ? "bg-green-100 text-green-700" :
                        draft.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                        draft.status === "submitted" ? "bg-purple-100 text-purple-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {(draft.status || "draft").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-[11px]">
                      {new Date(draft.last_modified).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                      {new Date(draft.last_modified).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
