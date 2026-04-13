"use client";

/**
 * DraftSectionPickerModal — RFQ-only section selector.
 *
 * RFQs default to a lean section set (cover letter, profile, compliance matrix,
 * pricing, reps & certs). Sometimes an RFQ asks for content that normally lives
 * in a full RFP (technical capability, management plan, past performance, QCP).
 * This modal lets the user opt IN to those extra sections before draft generation.
 *
 * The backend recognizes the picks via `sectionsOverride` and tunes the tone so
 * the RFP-style sections come out quote-appropriate (concise), not RFP-verbose.
 */

import { useState } from "react";
import { X, Sparkles, CheckCircle2, Info } from "lucide-react";

export interface SectionOption {
  key: string;
  title: string;
  description: string;
  defaultForRfq: boolean;
  isExtra: boolean;   // true = normally RFP-only, offered as add-on for RFQ
}

// Source of truth — mirrors SECTION_SPECS in arber-backend/app/services/section_writer_v2.py
export const ALL_SECTIONS: SectionOption[] = [
  { key: "coverPage",          title: "Cover Page",                 description: "Solicitation number, agency, company identifiers, due date.", defaultForRfq: true,  isExtra: false },
  { key: "coverLetter",        title: "Cover Letter",               description: "One-page intro letter addressed to the Government POC.",      defaultForRfq: true,  isExtra: false },
  { key: "companyProfile",     title: "Company Profile",            description: "Company overview, UEI/CAGE, certifications, qualifications.",  defaultForRfq: true,  isExtra: false },
  { key: "complianceMatrix",   title: "Compliance Matrix",          description: "Section L / PWS requirements mapped to your proposal sections.", defaultForRfq: true,  isExtra: false },
  { key: "technicalCapability",title: "Technical Capability",       description: "Task-by-task technical approach. Quote-appropriate for RFQ.",  defaultForRfq: false, isExtra: true  },
  { key: "managementPlan",     title: "Management Plan",            description: "Org structure, phase-in, risk mitigation. Tuned for RFQ tone.", defaultForRfq: false, isExtra: true  },
  { key: "qualityControlPlan", title: "Quality Control Plan (QCP)", description: "Inspections, corrective actions, quality metrics.",            defaultForRfq: false, isExtra: true  },
  { key: "pastPerformance",    title: "Past Performance",           description: "Relevant references tied to the SOW.",                         defaultForRfq: false, isExtra: true  },
  { key: "clinData",           title: "CLIN Pricing",               description: "Line-item pricing table (always included).",                   defaultForRfq: true,  isExtra: false },
  { key: "repsAndCerts",       title: "Reps & Certs",               description: "Representations & certifications block.",                      defaultForRfq: true,  isExtra: false },
];

interface Props {
  onConfirm: (selectedKeys: string[]) => void;
  onClose: () => void;
}

export default function DraftSectionPickerModal({ onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(ALL_SECTIONS.filter((s) => s.defaultForRfq).map((s) => s.key)),
  );

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const extras = ALL_SECTIONS.filter((s) => s.isExtra);
  const defaults = ALL_SECTIONS.filter((s) => !s.isExtra);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-slate-200 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h2 className="text-base font-bold text-slate-800">Customize RFQ Draft Sections</h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pick which sections to include. RFQ defaults are pre-checked — add extras if the RFQ asks for them.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Standard RFQ sections */}
        <div className="px-5 sm:px-7 py-4 border-b border-slate-100">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
            Standard RFQ Sections
          </div>
          <div className="space-y-1.5">
            {defaults.map((s) => (
              <label
                key={s.key}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.key)}
                  onChange={() => toggle(s.key)}
                  className="mt-0.5 w-4 h-4 accent-amber-600 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-slate-800">{s.title}</div>
                  <div className="text-[11px] text-slate-500">{s.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Extra (normally-RFP) sections */}
        <div className="px-5 sm:px-7 py-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">
              Optional — Add RFP-style Sections
            </div>
            <Info className="w-3 h-3 text-indigo-400" />
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Read the AI Summary first. If the RFQ asks for any of these, opt in — AI will write each
            in a concise, RFQ-appropriate tone (not a full RFP volume).
          </p>
          <div className="space-y-1.5">
            {extras.map((s) => (
              <label
                key={s.key}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-indigo-50 cursor-pointer border border-slate-100"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.key)}
                  onChange={() => toggle(s.key)}
                  className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-slate-800">{s.title}</div>
                  <div className="text-[11px] text-slate-500">{s.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            <span className="font-bold text-slate-700">{selected.size}</span> section{selected.size === 1 ? "" : "s"} selected
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 border border-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(Array.from(selected))}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:bg-amber-300 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Generate Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
