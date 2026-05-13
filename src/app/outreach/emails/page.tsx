"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search, Mail, Loader2, AlertCircle, CheckCircle2, XCircle, ChevronRight, RefreshCw,
} from "lucide-react";
import { listCampaigns, getCampaign, type OutreachCampaign } from "@/lib/api";

interface SentEmailRow {
  id: string;
  campaignId: string;
  campaignTitle: string;
  step: number;
  toEmail: string;
  toCompany: string;
  subject: string;
  sentAt: string;
  openedAt?: string | null;
  bouncedAt?: string | null;
  provider: string;
}

type StatusFilter = "All" | "Sent" | "Opened" | "Bounced";

export default function SentEmailsPage() {
  const [rows, setRows] = useState<SentEmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const campaigns = await listCampaigns();
      const merged: SentEmailRow[] = [];
      for (const c of campaigns.slice(0, 20)) {
        const detail = await getCampaign(c.id);
        if (!detail) continue;
        for (const e of detail.emails || []) {
          const recipient = (detail.recipients || []).find((r) => r.id === e.recipient_id);
          const sub = recipient ? detail.subcontractors[recipient.subcontractorId] : undefined;
          merged.push({
            id: e.id,
            campaignId: c.id,
            campaignTitle: c.opportunityTitle || "Untitled",
            step: e.step,
            toEmail: sub?.contactEmail || "",
            toCompany: sub?.company || "",
            subject: e.subject,
            sentAt: e.sent_at,
            openedAt: e.opened_at,
            bouncedAt: e.bounced_at,
            provider: e.provider,
          });
        }
      }
      merged.sort((a, b) => (b.sentAt || "").localeCompare(a.sentAt || ""));
      setRows(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = rows.filter((r) => {
    const matchesSearch = !searchQuery ||
      (r.toCompany || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.toEmail || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.campaignTitle || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Sent" && !r.openedAt && !r.bouncedAt) ||
      (statusFilter === "Opened" && r.openedAt) ||
      (statusFilter === "Bounced" && r.bouncedAt);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-3 sm:p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Sent Emails</h1>
          <p className="text-xs text-gray-500 mt-0.5">All outreach emails across all campaigns. Open/bounce events show in real time.</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company, email, subject, or campaign…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white">
          {(["All", "Sent", "Opened", "Bounced"] as StatusFilter[]).map((s) => (
            <option key={s} value={s}>Status: {s}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading emails…
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg p-3 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <Mail className="w-12 h-12 text-blue-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No emails sent yet</h3>
          <p className="text-xs text-slate-500 mb-4">Launch your first campaign from an opportunity or the campaigns page.</p>
          <Link href="/outreach/campaigns" className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded">
            View campaigns <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50/80 text-left border-b border-gray-100">
                <th className="px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Recipient</th>
                <th className="px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Campaign</th>
                <th className="px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Step</th>
                <th className="px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Subject</th>
                <th className="px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Sent</th>
                <th className="px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-gray-800">{r.toCompany}</div>
                    <div className="text-[10px] text-gray-500">{r.toEmail}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/outreach/campaigns/${r.campaignId}`} className="text-xs text-blue-600 hover:text-blue-700">{r.campaignTitle}</Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-700">Step {r.step}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700 max-w-md truncate">{r.subject}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-700">{new Date(r.sentAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {r.bouncedAt ? <span className="text-rose-700 inline-flex items-center gap-1"><XCircle className="w-3 h-3" /> Bounced</span> :
                     r.openedAt ? <span className="text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Opened</span> :
                     <span className="text-blue-700">Sent</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && rows.length > 0 && (
            <div className="p-8 text-center text-xs text-gray-400">No emails match your filters.</div>
          )}
        </div>
      )}
    </div>
  );
}
