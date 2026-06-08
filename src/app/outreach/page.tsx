"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail, MailOpen, Send, CheckCircle2, Megaphone, AlertCircle,
  ArrowRight, Loader2, Plus, Compass, Settings as SettingsIcon, MessageSquareReply,
} from "lucide-react";
import { listCampaigns, listFollowupDrafts, type OutreachCampaign } from "@/lib/api";
import OutreachCampaignBuilder from "@/components/OutreachCampaignBuilder";

export default function OutreachPage() {
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [pendingFollowups, setPendingFollowups] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [data, fu] = await Promise.all([
        listCampaigns(),
        listFollowupDrafts("pending").catch(() => ({ drafts: [], pendingCount: 0 })),
      ]);
      setCampaigns(data);
      setPendingFollowups(fu.pendingCount);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "active" || c.status === "pending_approval").length,
    closed: campaigns.filter((c) => c.status === "closed").length,
  };
  const recent = campaigns.slice(0, 6);

  return (
    <div className="p-3 sm:p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Outreach</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Automated email campaigns to subcontractors. Step 1 sends immediately, Steps 2 &amp; 3 on a schedule, replies auto-classified via IMAP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/outreach/followups" className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100">
            <MessageSquareReply className="w-3.5 h-3.5" /> Follow-ups
            {pendingFollowups > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-amber-500 text-white flex items-center justify-center">
                {pendingFollowups}
              </span>
            )}
          </Link>
          <Link href="/outreach/settings" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100">
            <SettingsIcon className="w-3.5 h-3.5" /> Settings
          </Link>
          <Link href="/subcontractors" className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100">
            <Compass className="w-3.5 h-3.5" /> Discover Subs
          </Link>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded">
            <Plus className="w-3.5 h-3.5" /> New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total campaigns" value={stats.total} icon={<Megaphone className="w-4 h-4" />} color="bg-blue-50 text-blue-700" />
        <StatCard label="Active / pending" value={stats.active} icon={<Send className="w-4 h-4" />} color="bg-emerald-50 text-emerald-700" />
        <StatCard label="Closed" value={stats.closed} icon={<CheckCircle2 className="w-4 h-4" />} color="bg-slate-50 text-slate-700" />
        <StatCard label="Pending approval" value={campaigns.filter((c) => c.status === "pending_approval").length} icon={<AlertCircle className="w-4 h-4" />} color="bg-amber-50 text-amber-700" />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg p-3 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">Recent Campaigns</h2>
          <Link href="/outreach/campaigns" className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading && (
          <div className="p-8 text-center text-sm text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading…
          </div>
        )}
        {!loading && recent.length === 0 && (
          <div className="p-10 text-center">
            <Mail className="w-10 h-10 text-blue-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No campaigns yet</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
              Open an opportunity → click <strong>Outreach Campaign</strong>, or use <strong>New Campaign</strong> above to start one manually.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded">
                <Plus className="w-4 h-4" /> New Campaign
              </button>
              <Link href="/subcontractors" className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-gray-50">
                <Compass className="w-4 h-4" /> Discover Subs first
              </Link>
            </div>
          </div>
        )}
        {!loading && recent.length > 0 && (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50/80 text-left border-b border-gray-100">
                <th className="px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Opportunity</th>
                <th className="px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Trade</th>
                <th className="px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Status</th>
                <th className="px-4 py-2 font-semibold text-gray-500 text-[11px] uppercase">Deadline</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-gray-800 truncate max-w-xs">{c.opportunityTitle || "Untitled"}</div>
                    <div className="text-[10px] text-gray-500">{c.opportunityAgency || ""}</div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-700">{c.tradeRequired || "—"}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-700">{c.deadlineDate || "—"}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/outreach/campaigns/${c.id}`} className="text-xs text-blue-600 hover:text-blue-700">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ActionTile href="/outreach/followups" icon={<MessageSquareReply className="w-5 h-5" />}
          title={pendingFollowups > 0 ? `Pending Follow-ups (${pendingFollowups})` : "Pending Follow-ups"}
          description="AI-drafted replies to interested subs. Edit, attach docs, send with one click." />
        <ActionTile href="/subcontractors" icon={<Compass className="w-5 h-5" />} title="Subcontractor Network"
          description="Discover new subs from USASpending + SAM.gov, manage your network." />
        <ActionTile href="/outreach/emails" icon={<MailOpen className="w-5 h-5" />} title="Sent Emails"
          description="Track every email sent — opens, replies, bounces." />
        <ActionTile href="/outreach/settings" icon={<SettingsIcon className="w-5 h-5" />} title="Settings"
          description="SendGrid / SMTP / IMAP credentials, campaign delays, sender identity." />
      </div>

      {showNew && (
        <OutreachCampaignBuilder
          open
          onClose={() => setShowNew(false)}
          defaults={{}}
          onLaunched={() => { setShowNew(false); refresh(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <div className="text-xl font-bold text-slate-800">{value}</div>
        <div className="text-[10px] uppercase text-slate-500 font-semibold">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-slate-100 text-slate-700" },
    pending_approval: { label: "Pending", cls: "bg-amber-100 text-amber-800" },
    active: { label: "Active", cls: "bg-emerald-100 text-emerald-800" },
    paused: { label: "Paused", cls: "bg-blue-100 text-blue-800" },
    closed: { label: "Closed", cls: "bg-slate-200 text-slate-700" },
  };
  const b = m[status] || { label: status, cls: "bg-slate-100 text-slate-700" };
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${b.cls}`}>{b.label}</span>;
}

function ActionTile({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link href={href} className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition p-4">
      <div className="flex items-center gap-2 mb-2 text-blue-600">{icon}<span className="font-bold text-sm text-slate-800">{title}</span></div>
      <p className="text-[11px] text-slate-500">{description}</p>
    </Link>
  );
}
