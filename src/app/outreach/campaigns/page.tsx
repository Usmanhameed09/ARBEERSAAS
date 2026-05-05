"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2, AlertCircle, Send, ChevronRight, Pause, CheckCircle2, Clock, ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { listCampaigns, type OutreachCampaign } from "@/lib/api";

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-700", icon: <Clock className="w-3 h-3" /> },
  pending_approval: { label: "Pending approval", cls: "bg-amber-100 text-amber-800", icon: <ShieldAlert className="w-3 h-3" /> },
  active: { label: "Active", cls: "bg-emerald-100 text-emerald-800", icon: <Send className="w-3 h-3" /> },
  paused: { label: "Paused", cls: "bg-blue-100 text-blue-800", icon: <Pause className="w-3 h-3" /> },
  closed: { label: "Closed", cls: "bg-slate-200 text-slate-700", icon: <CheckCircle2 className="w-3 h-3" /> },
};

export default function OutreachCampaignsPage() {
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "draft" | "closed">("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCampaigns();
      setCampaigns(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = campaigns.filter((c) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return c.status === "active" || c.status === "pending_approval";
    if (activeTab === "draft") return c.status === "draft";
    if (activeTab === "closed") return c.status === "closed";
    return true;
  });

  const counts = {
    all: campaigns.length,
    active: campaigns.filter((c) => c.status === "active" || c.status === "pending_approval").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    closed: campaigns.filter((c) => c.status === "closed").length,
  };

  return (
    <div className="p-3 sm:p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Outreach Campaigns</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Email sequences sent to subcontractors per opportunity. Steps 2 & 3 send automatically based on your delay settings.
          </p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm">
        {(["all", "active", "draft", "closed"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`font-semibold ${activeTab === t ? "text-blue-700" : "text-gray-400 hover:text-gray-600"}`}>
            <span className={`${activeTab === t ? "text-blue-700" : "text-gray-800"} font-bold`}>{counts[t]}</span> {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading campaigns…
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg p-3 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {!loading && campaigns.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <Send className="w-12 h-12 text-blue-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No campaigns yet</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
            Open an opportunity → click <strong>Start Outreach Campaign</strong> to recruit subcontractors automatically.
          </p>
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50/80 text-left border-b border-gray-100">
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Opportunity</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Trade</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Location</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Deadline</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const badge = STATUS_BADGE[c.status] || STATUS_BADGE.draft;
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{c.opportunityTitle || "Untitled"}</div>
                      <div className="text-[11px] text-gray-500">{c.opportunityAgency || ""}{c.opportunityNoticeId ? ` · ${c.opportunityNoticeId}` : ""}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{c.tradeRequired || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{[c.locationCity, c.locationState].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{c.deadlineDate || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>
                        {badge.icon} {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/outreach/campaigns/${c.id}`} className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5">
                        View <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-sm text-gray-400">No campaigns in this tab.</div>
          )}
        </div>
      )}
    </div>
  );
}
