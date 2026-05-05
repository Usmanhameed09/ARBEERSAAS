"use client";

/**
 * OutreachCampaignBuilder — modal for building + launching an outreach campaign
 * from an opportunity / draft.
 *
 * 4 steps:
 *   1. Confirm campaign metadata (scope, trade, location, deadline) — pre-filled
 *   2. Match — backend ranks user's subs, modal shows checkable list with reasons
 *   3. Approval check — if AI says preview required, show step-1 preview + reasons
 *   4. Launch — sends step 1 immediately, schedules 2 & 3
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Loader2, Search, Send, ShieldAlert, CheckCircle2, AlertCircle, Mail, Phone, Award,
} from "lucide-react";
import {
  createCampaign, matchCampaignSubs, setCampaignRecipients, launchCampaign,
  type CampaignCreateInput, type MatchedSub, type LaunchCampaignResult,
} from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  defaults: CampaignCreateInput & { predictedBid?: number };
  onLaunched?: (campaignId: string, result: LaunchCampaignResult) => void;
}

type Step = "form" | "match" | "preview" | "done";

export default function OutreachCampaignBuilder({ open, onClose, defaults, onLaunched }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Step 1 — form
  const [form, setForm] = useState<CampaignCreateInput>({});
  useEffect(() => {
    if (open) {
      setForm({ ...defaults });
      setStep("form");
      setError(null);
      setMatches([]);
      setSelected({});
      setLaunchResult(null);
    }
  }, [open, defaults]);

  // Step 2 — match
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchedSub[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Step 3+4 — launch result
  const [launchResult, setLaunchResult] = useState<LaunchCampaignResult | null>(null);

  const update = (k: keyof CampaignCreateInput, v: unknown) => setForm((p) => ({ ...p, [k]: v as never }));

  const handleCreateAndMatch = useCallback(async () => {
    if (!form.tradeRequired || !form.locationState) {
      setError("Trade and state are required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const c = await createCampaign(form);
      if (!c) throw new Error("Failed to create campaign");
      setCampaignId(c.id);
      const m = await matchCampaignSubs(c.id, 50);
      setMatches(m);
      // pre-select top 10 subs that have an email
      const initSel: Record<string, boolean> = {};
      let picked = 0;
      for (const sub of m) {
        if (picked >= 10) break;
        if (sub.contactEmail) {
          initSel[sub.id] = true;
          picked++;
        }
      }
      setSelected(initSel);
      setStep("match");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Match failed");
    } finally {
      setBusy(false);
    }
  }, [form]);

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

  const handleLaunch = useCallback(async (bypass = false) => {
    if (!campaignId) return;
    if (selectedIds.length === 0) { setError("Select at least one recipient"); return; }
    setBusy(true);
    setError(null);
    try {
      await setCampaignRecipients(campaignId, selectedIds);
      const r = await launchCampaign(campaignId, { bypassApproval: bypass, predictedBid: defaults.predictedBid || 0 });
      setLaunchResult(r);
      if (r.status === "pending_approval" && !bypass) {
        setStep("preview");
      } else if (r.success) {
        setStep("done");
        onLaunched?.(campaignId, r);
      } else {
        setError(r.error || "Launch failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Launch failed");
    } finally {
      setBusy(false);
    }
  }, [campaignId, selectedIds, defaults.predictedBid, onLaunched]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal((
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-lg shadow-2xl w-full max-w-[1200px] h-[100vh] sm:h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {step === "form" && "1. Campaign Details"}
              {step === "match" && "2. Pick Subcontractors"}
              {step === "preview" && "3. Approval Required"}
              {step === "done" && "4. Campaign Launched"}
            </h2>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {step === "form" && "Confirm what you're sourcing for. Pre-filled from the opportunity."}
              {step === "match" && `Backend ranked ${matches.length} subs from your network. Pick who to email.`}
              {step === "preview" && "AI flagged this campaign for human approval. Review before launch."}
              {step === "done" && "Step 1 sent immediately. Steps 2 + 3 scheduled automatically."}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-200" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {/* === Step 1: Form === */}
          {step === "form" && (
            <div className="p-4 grid grid-cols-2 gap-3 max-w-3xl">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Scope summary (1-2 sentences)</label>
                <textarea value={form.scopeSummary || ""} onChange={(e) => update("scopeSummary", e.target.value)} rows={3}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Trade required *</label>
                <input value={form.tradeRequired || ""} onChange={(e) => update("tradeRequired", e.target.value)}
                  placeholder="e.g. Lawn maintenance, Janitorial"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">NAICS code</label>
                <input value={form.naicsCode || ""} onChange={(e) => update("naicsCode", e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Location city</label>
                <input value={form.locationCity || ""} onChange={(e) => update("locationCity", e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">State (2-letter) *</label>
                <input value={form.locationState || ""} onChange={(e) => update("locationState", e.target.value.toUpperCase().slice(0, 2))}
                  maxLength={2} className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Deadline date</label>
                <input type="date" value={form.deadlineDate || ""} onChange={(e) => update("deadlineDate", e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Step 2 delay (days)</label>
                <input type="number" value={form.step2DelayDays ?? 3} onChange={(e) => update("step2DelayDays", parseInt(e.target.value) || 3)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Step 3 delay (days)</label>
                <input type="number" value={form.step3DelayDays ?? 6} onChange={(e) => update("step3DelayDays", parseInt(e.target.value) || 6)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded" />
              </div>
            </div>
          )}

          {/* === Step 2: Match === */}
          {step === "match" && (
            <div>
              {matches.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No matching subs in your network. Go to the Subcontractors page → Discover Subs first.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-left text-slate-600 border-b border-slate-200">
                      <th className="px-2 py-2 w-10"></th>
                      <th className="px-2 py-2">Match</th>
                      <th className="px-2 py-2">Company</th>
                      <th className="px-2 py-2">Why</th>
                      <th className="px-2 py-2">Email</th>
                      <th className="px-2 py-2">Past Federal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m) => {
                      const noEmail = !m.contactEmail;
                      return (
                        <tr key={m.id}
                            onClick={() => !noEmail && setSelected((p) => ({ ...p, [m.id]: !p[m.id] }))}
                            className={`border-b border-slate-100 hover:bg-slate-50 ${selected[m.id] ? "bg-emerald-50/40" : ""} ${noEmail ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                          <td className="px-2 py-2">
                            <input type="checkbox" disabled={noEmail} checked={!!selected[m.id]}
                              onChange={() => setSelected((p) => ({ ...p, [m.id]: !p[m.id] }))}
                              onClick={(e) => e.stopPropagation()} />
                          </td>
                          <td className="px-2 py-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m.matchScore >= 70 ? "bg-emerald-100 text-emerald-800" : m.matchScore >= 40 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                              {m.matchScore}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <div className="font-semibold text-slate-900">{m.company}</div>
                            <div className="text-[10px] text-slate-500">{[m.city, m.state].filter(Boolean).join(", ")}</div>
                          </td>
                          <td className="px-2 py-2 text-[11px] text-slate-600">{m.matchReasons.slice(0, 3).join(" · ")}</td>
                          <td className="px-2 py-2">
                            {m.contactEmail ? <span className="text-emerald-700 flex items-center gap-1"><Mail className="w-3 h-3" />{m.contactEmail}</span> :
                              m.contactPhone ? <span className="text-slate-700 flex items-center gap-1"><Phone className="w-3 h-3" />{m.contactPhone}</span> :
                              <span className="text-amber-600">⚠ no email</span>}
                          </td>
                          <td className="px-2 py-2 text-[11px]">
                            {(m.pastFederalAwardCount || 0) > 0 ? (
                              <span className="flex items-center gap-1 text-emerald-700"><Award className="w-3 h-3" />{m.pastFederalAwardCount}</span>
                            ) : <span className="text-slate-400">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* === Step 3: Approval preview === */}
          {step === "preview" && launchResult?.previewStep1 && (
            <div className="p-4 max-w-3xl">
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-900">Approval needed before sending</h3>
                </div>
                <ul className="text-xs text-amber-900 ml-6 list-disc space-y-0.5">
                  {(launchResult.reasons || []).map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-600">
                  Preview — first recipient: <strong>{launchResult.previewStep1.company}</strong> ({launchResult.previewStep1.to})
                </div>
                <div className="px-3 py-2 border-b border-slate-200 text-xs">
                  <span className="text-slate-500">Subject:</span> <strong>{launchResult.previewStep1.subject}</strong>
                </div>
                <pre className="px-3 py-3 text-xs whitespace-pre-wrap text-slate-800 font-sans">{launchResult.previewStep1.body}</pre>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {launchResult.recipientCount} recipients will receive this email (with their own contact name + personal note).
              </p>
            </div>
          )}

          {/* === Step 4: Done === */}
          {step === "done" && launchResult && (
            <div className="p-8 max-w-xl mx-auto text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">Campaign launched</h3>
              <p className="text-sm text-slate-600 mb-4">
                Step 1 sent to <strong>{launchResult.sent}</strong> recipient{launchResult.sent === 1 ? "" : "s"}.
                {(launchResult.skippedNoEmail || 0) > 0 && <> Skipped {launchResult.skippedNoEmail} (no email).</>}
                {(launchResult.failed || 0) > 0 && <> {launchResult.failed} failed.</>}
              </p>
              <p className="text-[11px] text-slate-500">
                Steps 2 & 3 will be sent automatically based on your delay settings, and the campaign will auto-close on the deadline.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-xs text-rose-800 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        {/* Footer actions */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100">
            {step === "done" ? "Close" : "Cancel"}
          </button>
          <div className="flex items-center gap-2">
            {step === "form" && (
              <button onClick={handleCreateAndMatch} disabled={busy || !form.tradeRequired || !form.locationState}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Find matching subs
              </button>
            )}
            {step === "match" && (
              <>
                <span className="text-[11px] text-slate-600">{selectedIds.length} selected</span>
                <button onClick={() => handleLaunch(false)} disabled={busy || selectedIds.length === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white">
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Launch Campaign
                </button>
              </>
            )}
            {step === "preview" && (
              <button onClick={() => handleLaunch(true)} disabled={busy}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white">
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Approve & Launch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  ), document.body);
}
