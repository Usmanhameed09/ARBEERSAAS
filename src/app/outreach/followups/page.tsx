"use client";

/**
 * Pending Follow-ups inbox.
 *
 * When a subcontractor replies "interested" / asks a question / sends a quote,
 * the IMAP poller drafts a personalised reply with the AI and queues it here
 * for Arthur to review, edit, attach project docs to, and send with one click.
 */

import { useCallback, useEffect, useState } from "react";
import {
  Loader2, Send, X, AlertCircle, Mail, Paperclip, FileText, Award, Inbox,
  CheckCircle2, MessageSquareReply, Trash2, Upload,
} from "lucide-react";
import {
  listFollowupDrafts, getFollowupDraft, getFollowupAttachmentOptions,
  sendFollowupDraft, dismissFollowupDraft,
  type FollowupDraft, type FollowupAttachmentOptions, type FollowupAttachmentOption,
} from "@/lib/api";

type StatusFilter = "pending" | "sent" | "dismissed";

const CLASSIFICATION_LABEL: Record<string, { label: string; color: string }> = {
  interested:           { label: "Interested",           color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  clarifying_question:  { label: "Question",             color: "bg-blue-100 text-blue-800 border-blue-300" },
  quote_provided:       { label: "Quote Provided",       color: "bg-violet-100 text-violet-800 border-violet-300" },
};

interface NewUpload { id: string; filename: string; base64: string; mimeType: string; size: number }

export default function FollowupsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [drafts, setDrafts] = useState<FollowupDraft[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<FollowupDraft | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Editable fields
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCc, setEditCc] = useState("");
  const [editBcc, setEditBcc] = useState("");

  // Attachment picker
  const [options, setOptions] = useState<FollowupAttachmentOptions | null>(null);
  const [picked, setPicked] = useState<Record<string, { source: string; refId: string; fileName: string }>>({});
  const [uploads, setUploads] = useState<NewUpload[]>([]);

  // Send/dismiss state
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await listFollowupDrafts(statusFilter);
      setDrafts(r.drafts);
      setPendingCount(r.pendingCount);
      if (!selectedId && r.drafts.length > 0) setSelectedId(r.drafts[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Load detail + attachment options when a draft is selected
  useEffect(() => {
    if (!selectedId) { setDetail(null); setOptions(null); return; }
    let cancelled = false;
    setDetailLoading(true);
    setSendResult(null);
    (async () => {
      const [d, opts] = await Promise.all([getFollowupDraft(selectedId), getFollowupAttachmentOptions(selectedId)]);
      if (cancelled) return;
      if (d) {
        setDetail(d);
        setEditSubject(d.suggestedSubject || "");
        setEditBody(d.suggestedBody || "");
        setEditCc("");
        setEditBcc("");
      }
      setOptions(opts);
      setPicked({});
      setUploads([]);
      setDetailLoading(false);
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  const togglePick = (opt: FollowupAttachmentOption) => {
    const key = `${opt.source}:${opt.id}`;
    setPicked((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { source: opt.source, refId: opt.id, fileName: opt.fileName || "file" };
      return next;
    });
  };

  const onUploadFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const newOnes: NewUpload[] = [];
    for (const f of Array.from(fileList)) {
      if (f.size > 10 * 1024 * 1024) {
        setError(`${f.name} is over 10 MB — skipped`);
        continue;
      }
      const buf = await f.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      newOnes.push({
        id: `${f.name}-${f.size}-${Date.now()}`,
        filename: f.name,
        base64: b64,
        mimeType: f.type || "application/octet-stream",
        size: f.size,
      });
    }
    setUploads((prev) => [...prev, ...newOnes]);
  };

  const handleSend = async () => {
    if (!detail) return;
    setSending(true);
    setError(null);
    setSendResult(null);
    try {
      const splitAddrs = (s: string) => s.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);
      const r = await sendFollowupDraft(detail.id, {
        subject: editSubject,
        body: editBody,
        attachments: Object.values(picked).map(({ source, refId }) => ({ source, refId })),
        uploads: uploads.map((u) => ({ filename: u.filename, base64: u.base64, mimeType: u.mimeType })),
        cc: editCc.trim() ? splitAddrs(editCc) : undefined,
        bcc: editBcc.trim() ? splitAddrs(editBcc) : undefined,
      });
      if (r.success) {
        setSendResult(`Sent via ${r.provider} with ${r.attachments || 0} attachment(s).`);
        setSelectedId(null);
        await refresh();
      } else {
        setError(r.error || "Send failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = async () => {
    if (!detail) return;
    if (!confirm("Dismiss this follow-up? It won't appear in Pending anymore.")) return;
    setSending(true);
    try {
      await dismissFollowupDraft(detail.id);
      setSelectedId(null);
      await refresh();
    } finally { setSending(false); }
  };

  const totalAttachments = Object.keys(picked).length + uploads.length;

  return (
    <div className="p-3 sm:p-5">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            Pending Follow-ups
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            AI-drafted replies to interested subcontractors. Edit, attach project docs, and send with one click.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["pending", "sent", "dismissed"] as StatusFilter[]).map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setSelectedId(null); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded border ${statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 hover:bg-slate-100"}`}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg p-3 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      {sendResult && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg p-3 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {sendResult}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        {/* List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden max-h-[80vh] overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading…
            </div>
          )}
          {!loading && drafts.length === 0 && (
            <div className="p-10 text-center">
              <Inbox className="w-10 h-10 text-blue-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">No {statusFilter} follow-ups</h3>
              <p className="text-xs text-slate-500">When a sub replies, the AI drafts a follow-up here for you to review.</p>
            </div>
          )}
          {!loading && drafts.map((d) => {
            const cls = CLASSIFICATION_LABEL[d.classification] || { label: d.classification, color: "bg-slate-100 text-slate-700 border-slate-300" };
            const active = d.id === selectedId;
            return (
              <button key={d.id} onClick={() => setSelectedId(d.id)}
                className={`w-full text-left px-3 py-3 border-b border-gray-50 hover:bg-blue-50/50 ${active ? "bg-blue-50" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cls.color}`}>{cls.label}</span>
                  <span className="text-[10px] text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-sm font-semibold text-slate-900 truncate">{d.subcontractorCompany || "—"}</div>
                <div className="text-[11px] text-slate-500 truncate">{d.subcontractorContactName || ""} · {d.subcontractorEmail || ""}</div>
                <div className="text-[11px] text-slate-600 truncate mt-1 italic">"{(d.replyExcerpt || "").slice(0, 80)}…"</div>
                <div className="text-[10px] text-slate-400 truncate mt-1">{d.campaignTitle || "no campaign"}</div>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {detailLoading && (
            <div className="p-12 text-center text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading draft…
            </div>
          )}
          {!detailLoading && !detail && (
            <div className="p-12 text-center">
              <MessageSquareReply className="w-12 h-12 text-blue-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">Pick a follow-up to review</h3>
              <p className="text-xs text-slate-500">Or wait for the next IMAP poll (≤5 min) to bring in new replies.</p>
            </div>
          )}
          {!detailLoading && detail && (
            <div className="p-4">
              {/* Recipient + reply context */}
              <div className="mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{detail.subcontractorCompany || "—"}</div>
                    <div className="text-xs text-slate-600">{detail.subcontractorContactName || ""}{detail.subcontractorEmail ? ` · ${detail.subcontractorEmail}` : ""}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 text-right">
                    <div>Campaign: <strong>{detail.campaignTitle || "—"}</strong></div>
                    {detail.deadlineDate && <div>Deadline: <strong>{detail.deadlineDate}</strong></div>}
                  </div>
                </div>
                {detail.replyExcerpt && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Their reply</div>
                    <div className="whitespace-pre-wrap italic">"{detail.replyExcerpt}"</div>
                  </div>
                )}
              </div>

              {/* Editable subject + body */}
              <div className="mb-3">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Subject</label>
                <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">CC <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input value={editCc} onChange={(e) => setEditCc(e.target.value)}
                    placeholder="email@co.com, other@co.com"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">BCC <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input value={editBcc} onChange={(e) => setEditBcc(e.target.value)}
                    placeholder="archive@co.com"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded" />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Body (AI draft — edit freely)</label>
                <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={12}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded font-sans" />
              </div>

              {/* Attachment picker */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5" /> Attachments {totalAttachments > 0 && <span className="text-blue-700">({totalAttachments})</span>}
                  </label>
                  <label className="flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-800 cursor-pointer">
                    <Upload className="w-3 h-3" /> Upload file
                    <input type="file" multiple className="hidden" onChange={(e) => onUploadFiles(e.target.files)} />
                  </label>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                  {/* Opportunity docs */}
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> RFP / Opportunity Documents
                    </div>
                    {(options?.opportunityDocs || []).length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic ml-4">No opportunity docs available.</div>
                    ) : (
                      <div className="space-y-1 ml-4">
                        {options!.opportunityDocs.map((o) => {
                          const key = `${o.source}:${o.id}`;
                          return (
                            <label key={key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input type="checkbox" checked={!!picked[key]} onChange={() => togglePick(o)} />
                              <span className="truncate">{o.fileName}</span>
                              {o.fileType && <span className="text-[10px] text-slate-400">({o.fileType}{o.fileSize ? `, ${o.fileSize}` : ""})</span>}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Certifications */}
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Award className="w-3 h-3" /> Your Certifications
                    </div>
                    {(options?.certifications || []).length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic ml-4">No certifications uploaded.</div>
                    ) : (
                      <div className="space-y-1 ml-4">
                        {options!.certifications.map((o) => {
                          const key = `${o.source}:${o.id}`;
                          return (
                            <label key={key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input type="checkbox" checked={!!picked[key]} onChange={() => togglePick(o)} />
                              <span className="truncate">{o.fileName}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Newly uploaded */}
                  {uploads.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Just Uploaded
                      </div>
                      <div className="space-y-1 ml-4">
                        {uploads.map((u) => (
                          <div key={u.id} className="flex items-center gap-2 text-xs text-slate-700">
                            <span className="truncate flex-1">{u.filename} <span className="text-[10px] text-slate-400">({Math.round(u.size / 1024)} KB)</span></span>
                            <button onClick={() => setUploads((prev) => prev.filter((x) => x.id !== u.id))}
                              className="text-rose-600 hover:text-rose-700"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button onClick={handleDismiss} disabled={sending || detail.status !== "pending"}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-40">
                  <Trash2 className="w-3.5 h-3.5" /> Dismiss
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">{totalAttachments} attachment{totalAttachments === 1 ? "" : "s"}</span>
                  <button onClick={handleSend} disabled={sending || detail.status !== "pending" || !editSubject.trim() || !editBody.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white">
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send Follow-up
                  </button>
                </div>
              </div>
              {detail.status === "sent" && (
                <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Sent {detail.sentAt ? new Date(detail.sentAt).toLocaleString() : ""}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
