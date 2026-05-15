"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2, AlertCircle, ChevronLeft, Mail, Send, CheckCircle2, XCircle,
  RefreshCw, MessageSquare, Pause, Award, MailOpen, Inbox, FileEdit, Trash2, ArrowRight,
} from "lucide-react";
import {
  getCampaign, closeCampaign, type CampaignDetailResponse, type CampaignRecipient,
  type SubcontractorRecord, type TimelineEvent,
} from "@/lib/api";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-slate-100 text-slate-700" },
  sent_step_1: { label: "Step 1 sent", cls: "bg-blue-100 text-blue-800" },
  sent_step_2: { label: "Step 2 sent", cls: "bg-blue-100 text-blue-800" },
  sent_step_3: { label: "Step 3 sent", cls: "bg-blue-100 text-blue-800" },
  replied: { label: "Replied", cls: "bg-emerald-100 text-emerald-800" },
  quoted: { label: "Quoted", cls: "bg-emerald-100 text-emerald-800" },
  declined: { label: "Declined", cls: "bg-rose-100 text-rose-800" },
  bounced: { label: "Bounced", cls: "bg-amber-100 text-amber-800" },
  unsubscribed: { label: "Opted out", cls: "bg-amber-100 text-amber-800" },
  closed_no_response: { label: "No response", cls: "bg-slate-200 text-slate-700" },
};

export default function CampaignDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [data, setData] = useState<CampaignDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getCampaign(id);
      if (!d) { setError("Campaign not found"); setData(null); }
      else { setData(d); setError(null); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleClose = async () => {
    if (!confirm("Close this campaign? Pending sends will be cancelled.")) return;
    setClosing(true);
    try {
      const ok = await closeCampaign(id, "manual");
      if (ok) refresh();
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="p-3 sm:p-5">
      <Link href="/outreach/campaigns" className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-3">
        <ChevronLeft className="w-3.5 h-3.5" /> All campaigns
      </Link>

      {loading && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading…
        </div>
      )}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg p-3 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {data && !loading && (
        <CampaignDetail data={data} onRefresh={refresh} onClose={handleClose} closing={closing} />
      )}
    </div>
  );
}

function CampaignDetail({ data, onRefresh, onClose, closing }: { data: CampaignDetailResponse; onRefresh: () => void; onClose: () => void; closing: boolean }) {
  const c = data.campaign;
  const recipients = data.recipients || [];
  const subs = data.subcontractors || {};
  const emails = data.emails || [];

  const getSub = (rid: string): SubcontractorRecord | undefined => {
    const r = recipients.find((x) => x.id === rid);
    return r ? subs[r.subcontractorId] : undefined;
  };
  void getSub;

  const summary = {
    total: recipients.length,
    sent: recipients.filter((r) => r.status?.startsWith("sent_") || r.status === "replied" || r.status === "quoted").length,
    replied: recipients.filter((r) => r.status === "replied" || r.status === "quoted").length,
    quoted: recipients.filter((r) => r.status === "quoted").length,
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.status === "active" ? "bg-emerald-100 text-emerald-800" : c.status === "closed" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-800"}`}>
                {c.status?.toUpperCase()}
              </span>
              {c.requiresApproval && <span className="text-[10px] text-amber-700">Required user approval</span>}
            </div>
            <h1 className="text-base font-bold text-gray-900">{c.opportunityTitle || "Untitled campaign"}</h1>
            <p className="text-xs text-gray-500">{c.opportunityAgency} {c.opportunityNoticeId ? `· ${c.opportunityNoticeId}` : ""}</p>
            <div className="flex items-center gap-3 text-[11px] text-gray-600 mt-2">
              <span>Trade: <strong>{c.tradeRequired || "—"}</strong></span>
              <span>Location: <strong>{[c.locationCity, c.locationState].filter(Boolean).join(", ") || "—"}</strong></span>
              <span>Deadline: <strong>{c.deadlineDate || "—"}</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRefresh} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            {c.status !== "closed" && (
              <button onClick={onClose} disabled={closing} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40">
                {closing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />} Close Campaign
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <Stat label="Recipients" value={summary.total} />
          <Stat label="Step ≥1 sent" value={summary.sent} />
          <Stat label="Replies" value={summary.replied} />
          <Stat label="Quotes received" value={summary.quoted} />
        </div>
      </div>

      <h2 className="text-sm font-bold text-gray-700 mb-2">Recipients</h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-gray-50/80 text-left border-b border-gray-100">
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Company</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Status</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Step</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Next send</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Reply</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => {
              const sub = subs[r.subcontractorId];
              const badge = STATUS_LABEL[r.status] || { label: r.status, cls: "bg-slate-100 text-slate-700" };
              return (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{sub?.company || "—"}</div>
                    <div className="text-[11px] text-gray-500">{sub?.contactEmail || "no email"}</div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-700">{r.currentStep ?? "—"} / 3</td>
                  <td className="px-4 py-3 text-xs text-gray-700">{r.nextSendAt ? new Date(r.nextSendAt).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {r.replyClassification ? (
                      <div>
                        <span className="font-semibold">{r.replyClassification}</span>
                        {r.replyExcerpt && <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{r.replyExcerpt}</div>}
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {recipients.length === 0 && <div className="p-8 text-center text-xs text-gray-500">No recipients on this campaign.</div>}
      </div>

      <h2 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
        Conversation timeline
        <span className="text-[10px] font-normal text-slate-500">
          (every email out, every reply in, every AI draft — chronological)
        </span>
      </h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
        <ConversationTimeline timeline={data.timeline || []} subcontractors={subs} recipients={recipients} />
      </div>

      <h2 className="text-sm font-bold text-gray-700 mb-2">Email history</h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-gray-50/80 text-left border-b border-gray-100">
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Sent</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Step</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Subject</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Provider</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Open / Bounce</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((e) => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                <td className="px-4 py-3 text-xs text-gray-700">{new Date(e.sent_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs">Step {e.step}</td>
                <td className="px-4 py-3 text-xs text-gray-800">{e.subject}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{e.provider}</td>
                <td className="px-4 py-3 text-xs">
                  {e.opened_at ? <span className="text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />opened</span> :
                   e.bounced_at ? <span className="text-rose-700 inline-flex items-center gap-1"><XCircle className="w-3 h-3" />bounced</span> :
                   <span className="text-gray-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {emails.length === 0 && <div className="p-8 text-center text-xs text-gray-500">No emails sent yet.</div>}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-[10px] uppercase text-slate-500 font-semibold">{label}</div>
    </div>
  );
}

const PURPOSE_LABEL: Record<string, string> = {
  campaign: "Campaign step",
  auto_reply: "Follow-up sent",
  test: "Test send",
};

const CLASSIFICATION_PILL: Record<string, string> = {
  interested: "bg-emerald-100 text-emerald-800 border-emerald-300",
  clarifying_question: "bg-blue-100 text-blue-800 border-blue-300",
  quote_provided: "bg-violet-100 text-violet-800 border-violet-300",
  not_interested: "bg-rose-100 text-rose-700 border-rose-300",
  unsubscribe: "bg-amber-100 text-amber-800 border-amber-300",
  auto_response: "bg-slate-100 text-slate-600 border-slate-300",
};

const DRAFT_STATUS_PILL: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  sent: "bg-emerald-100 text-emerald-800 border-emerald-300",
  dismissed: "bg-slate-100 text-slate-500 border-slate-200",
};

function ConversationTimeline({
  timeline, subcontractors, recipients,
}: {
  timeline: TimelineEvent[];
  subcontractors: Record<string, SubcontractorRecord>;
  recipients: CampaignRecipient[];
}) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center text-xs text-slate-500 py-8">
        <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        Nothing yet. The timeline fills in as Step 1 sends, replies arrive, and follow-ups are queued.
      </div>
    );
  }

  // Collapse the auto-emitted "draft" entry that always pairs with each "inbound" entry.
  // We render the inbound row with the draft inline.
  const inboundByTs = new Map<string, TimelineEvent>();
  for (const e of timeline) {
    if (e.kind === "draft") inboundByTs.set(e.ts, e);
  }
  const collapsed = timeline.filter((e) => e.kind !== "draft");

  const subFor = (recipientId?: string | null, subcontractorId?: string | null): SubcontractorRecord | undefined => {
    if (subcontractorId && subcontractors[subcontractorId]) return subcontractors[subcontractorId];
    if (!recipientId) return undefined;
    const r = recipients.find((x) => x.id === recipientId);
    return r ? subcontractors[r.subcontractorId] : undefined;
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" aria-hidden="true" />
      <div className="space-y-3">
        {collapsed.map((e, i) => {
          const sub = subFor(e.recipientId, e.subcontractorId);
          if (e.kind === "outbound") {
            const isAutoReply = e.purpose === "auto_reply";
            const Icon = isAutoReply ? MailOpen : Send;
            return (
              <div key={`o-${i}-${e.ts}`} className="relative pl-10">
                <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center border-2 border-white">
                  <Icon className="w-3 h-3" />
                </div>
                <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                    <span className="text-[11px] font-bold text-blue-800">
                      {PURPOSE_LABEL[e.purpose || ""] || "Outbound"}
                      {sub?.company ? ` → ${sub.company}` : e.toEmail ? ` → ${e.toEmail}` : ""}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(e.ts).toLocaleString()}</span>
                  </div>
                  {e.subject && <div className="text-xs text-slate-800 font-medium">{e.subject}</div>}
                  <div className="text-[10px] text-slate-500 mt-1">
                    From {e.fromEmail || "you"} · To {e.toEmail || "—"}
                  </div>
                </div>
              </div>
            );
          }
          // inbound — render with paired draft inline
          const draft = inboundByTs.get(e.ts);
          const cls = (e.classification || "").toString();
          const draftStatus = (draft?.kind === "draft" ? draft.draftStatus : null) || null;
          return (
            <div key={`i-${i}-${e.ts}`} className="relative pl-10">
              <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border-2 border-white">
                <Mail className="w-3 h-3" />
              </div>
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3">
                <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-800">
                      Reply from {sub?.company || sub?.contactEmail || "subcontractor"}
                    </span>
                    {cls && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${CLASSIFICATION_PILL[cls] || "bg-slate-100 text-slate-700 border-slate-300"}`}>
                        {cls.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(e.ts).toLocaleString()}</span>
                </div>
                {e.replyExcerpt && (
                  <div className="text-xs text-slate-700 italic whitespace-pre-wrap">"{e.replyExcerpt}"</div>
                )}
                {draft && draft.kind === "draft" && (
                  <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <FileEdit className="w-3 h-3 text-violet-700" />
                      <span className="text-[11px] text-slate-700">
                        AI draft: <strong>{draft.draftSubject || "(no subject)"}</strong>
                      </span>
                      {draftStatus && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DRAFT_STATUS_PILL[draftStatus] || "bg-slate-100 text-slate-700 border-slate-300"}`}>
                          {draftStatus}
                        </span>
                      )}
                    </div>
                    {draftStatus === "pending" && (
                      <Link href="/outreach/followups" className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-0.5">
                        Review & send <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                    {draftStatus === "sent" && draft.sentAt && (
                      <span className="text-[10px] text-emerald-700">Sent {new Date(draft.sentAt).toLocaleString()}</span>
                    )}
                    {draftStatus === "dismissed" && (
                      <span className="text-[10px] text-slate-500 inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Dismissed</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
