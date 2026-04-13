"use client";

/**
 * DraftProgressOverlay — while a draft is being generated on the backend
 * (a single long POST taking 2-5 minutes), this full-screen overlay gives
 * the user visible progress feedback:
 *
 *   • A rotating checklist of pipeline steps that activate on a timer
 *   • An estimated time-remaining counter that decreases each second
 *   • A progress bar that fills as steps activate
 *
 * The timing is client-side only (no backend streaming) — averaged from
 * typical V2 pipeline runs. If the real call finishes sooner, the overlay
 * is simply dismissed. If it runs long, the last step stays "in progress"
 * and the counter clamps at "wrapping up…".
 */

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Sparkles, Clock } from "lucide-react";

interface Step {
  label: string;
  detail: string;
  /** Seconds from start at which this step activates */
  startAt: number;
}

const DEFAULT_STEPS: Step[] = [
  { startAt: 0,   label: "Reading your attachments",          detail: "Scanning PDFs, Word docs, and solicitation amendments" },
  { startAt: 20,  label: "Extracting Section L, SOW, and CLINs", detail: "Identifying instructions to offerors, tasks, and pricing lines" },
  { startAt: 50,  label: "Analyzing evaluation criteria",     detail: "Mapping Section M factors to your company profile" },
  { startAt: 80,  label: "Drafting cover letter & profile",   detail: "Personalizing with your POC and certifications" },
  { startAt: 110, label: "Drafting technical & management content", detail: "Writing core proposal sections with SOW references" },
  { startAt: 160, label: "Building the compliance matrix",    detail: "Cross-checking every 'shall' requirement" },
  { startAt: 200, label: "Generating pricing",                detail: "Computing CLIN-level pricing against your target bid" },
  { startAt: 230, label: "Verifying Section L compliance",    detail: "Final pass to confirm every requirement is addressed" },
  { startAt: 260, label: "Finalizing your draft",             detail: "Packaging sections and provenance data" },
];

interface Props {
  /** How long (seconds) we expect the pipeline to take on average */
  expectedSeconds?: number;
  /** Custom step list — falls back to the default 9-step pipeline */
  steps?: Step[];
  /** Optional heading override */
  title?: string;
}

export default function DraftProgressOverlay({
  expectedSeconds = 270,
  steps = DEFAULT_STEPS,
  title = "Generating your proposal draft",
}: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, expectedSeconds - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = remaining > 0
    ? `~${mins}:${secs.toString().padStart(2, "0")} remaining`
    : "Wrapping up…";

  const activeIdx = (() => {
    // The active step = last step whose startAt <= elapsed
    let idx = 0;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].startAt <= elapsed) idx = i;
    }
    return idx;
  })();

  // Progress = elapsed / expected, capped at 95% until finish
  const progressPct = Math.min(95, Math.floor((elapsed / expectedSeconds) * 100));

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-br from-amber-500 to-amber-700 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" />
            <h2 className="text-base font-bold">{title}</h2>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] opacity-90">
            <Clock className="w-3 h-3" />
            <span>{timeStr}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Steps */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2.5">
            {steps.map((step, i) => {
              const done = i < activeIdx;
              const active = i === activeIdx;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
                    active ? "bg-amber-50" : "bg-transparent"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : active ? (
                      <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[12px] font-semibold ${
                      done ? "text-slate-500 line-through" : active ? "text-amber-800" : "text-slate-600"
                    }`}>
                      {step.label}
                    </div>
                    <div className={`text-[10.5px] ${
                      active ? "text-amber-700" : "text-slate-400"
                    }`}>
                      {step.detail}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-[10.5px] text-slate-500 leading-relaxed">
            Please keep this tab open. Generating a high-quality draft with full
            document analysis takes a few minutes — your time here saves hours of
            drafting later.
          </p>
        </div>
      </div>
    </div>
  );
}
