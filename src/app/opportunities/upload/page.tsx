"use client";

/**
 * Manual solicitation upload — for opportunities the client receives via email
 * (not listed on SAM.gov). User drops in PDF/DOCX/XLSX files + key metadata,
 * we feed them through the SAME draft pipeline as a SAM-discovered opportunity
 * and redirect to the existing draft viewer when complete.
 */

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  Upload, FileText, X, Loader2, AlertCircle, CheckCircle2, Send, ChevronLeft,
  Building2, Calendar, MapPin, Tag,
} from "lucide-react";
import {
  uploadManualSolicitation,
  generateDraftV2,
  saveDraft,
  type ManualUploadMetadata,
} from "@/lib/api";

const ALLOWED_TYPES = [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".txt"];
const MAX_FILES = 20;
const MAX_FILE_MB = 25;

type Phase = "idle" | "uploading" | "estimating" | "drafting" | "done" | "error";

export default function UploadSolicitationPage() {
  // Metadata
  const [title, setTitle] = useState("");
  const [agency, setAgency] = useState("");
  const [naicsCode, setNaicsCode] = useState("");
  const [setAside, setSetAside] = useState("");
  const [bidType, setBidType] = useState<"RFQ" | "RFP" | "SOURCES_SOUGHT">("RFQ");
  const [dueDate, setDueDate] = useState("");
  const [placeOfPerformance, setPlaceOfPerformance] = useState("");
  const [summary, setSummary] = useState("");

  // Files
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Progress
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setError(null);
    const list = Array.from(newFiles);
    const accepted: File[] = [];
    const skipped: string[] = [];
    for (const f of list) {
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      if (!ALLOWED_TYPES.includes(ext)) {
        skipped.push(`${f.name} (type not supported)`);
        continue;
      }
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        skipped.push(`${f.name} (over ${MAX_FILE_MB} MB)`);
        continue;
      }
      accepted.push(f);
    }
    setFiles((prev) => {
      const combined = [...prev, ...accepted];
      return combined.slice(0, MAX_FILES);
    });
    if (skipped.length > 0) {
      setError(`Skipped ${skipped.length} file${skipped.length === 1 ? "" : "s"}: ${skipped.join(", ")}`);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSubmit =
    title.trim().length > 3 &&
    agency.trim().length > 1 &&
    files.length > 0 &&
    phase !== "uploading" && phase !== "estimating" && phase !== "drafting";

  const handleGenerate = useCallback(async () => {
    if (!canSubmit) return;
    setError(null);
    setPhase("uploading");

    const metadata: ManualUploadMetadata = {
      title: title.trim(),
      agency: agency.trim(),
      naicsCode: naicsCode.trim() || undefined,
      setAside: setAside || undefined,
      bidType,
      dueDate: dueDate || undefined,
      placeOfPerformance: placeOfPerformance.trim() || undefined,
      summary: summary.trim() || undefined,
    };

    const uploadResp = await uploadManualSolicitation(metadata, files);
    if (!uploadResp.success || !uploadResp.opportunity) {
      setPhase("error");
      setError(uploadResp.error || "Upload failed");
      return;
    }

    setPhase("drafting");
    try {
      const draftResp = await generateDraftV2(uploadResp.opportunity, "recommended");
      if (!draftResp.success || !draftResp.draft) {
        setPhase("error");
        setError(draftResp.error || "Draft generation failed");
        return;
      }

      // Persist the draft to the backend FIRST so the viewer can load it
      // authoritatively by ID. Going through localStorage would let a stale
      // draft in another tab (or a slow handoff) show the wrong content —
      // exactly the symptom we were seeing.
      const oppJson: Record<string, unknown> = { ...(draftResp.opportunity || {}) };
      if (draftResp.attachmentAnalysis) {
        oppJson.attachmentAnalysis = draftResp.attachmentAnalysis;
      }
      // Persist pricingExcel metadata so the PDF generator can skip the inline
      // CLIN table when an xlsx template was filled (matches the SAM flow).
      const pe = draftResp.pricingExcel;
      if (pe && (pe.filename || pe.source)) {
        oppJson.pricingExcel = { filename: pe.filename, source: pe.source, generated: pe.generated };
      }
      const saved = await saveDraft({
        sectionsJson: draftResp.draft as unknown as Record<string, string>,
        opportunityJson: oppJson,
        companyJson: (draftResp.company || {}) as Record<string, unknown>,
        title: draftResp.opportunity?.title || draftResp.draft?.draftTitle || metadata.title,
      });

      if (!saved.success || !saved.draftId) {
        // Fall back to localStorage handoff if the save endpoint hiccupped —
        // user still gets the draft, just less robust against tab collisions.
        try {
          localStorage.setItem("arber_draft_data", JSON.stringify(draftResp));
        } catch { /* ignore */ }
        window.open("/opportunities/draft", "_blank");
      } else {
        // Authoritative path: viewer fetches by ID, no local-storage race.
        window.open(`/opportunities/draft?draftId=${encodeURIComponent(saved.draftId)}`, "_blank");
      }
      setPhase("done");
      // Reset so user can upload another solicitation if they want
      setTimeout(() => setPhase("idle"), 1500);
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Draft generation failed");
    }
  }, [canSubmit, title, agency, naicsCode, setAside, bidType, dueDate, placeOfPerformance, summary, files]);

  const phaseLabel: Record<Phase, string> = {
    idle: "Ready",
    uploading: "Uploading documents…",
    estimating: "Estimating bid range…",
    drafting: "AI is reading your documents and drafting the proposal — this can take 2-5 minutes…",
    done: "Done — redirecting…",
    error: "Error",
  };

  const isBusy = phase === "uploading" || phase === "estimating" || phase === "drafting";

  return (
    <div className="p-3 sm:p-5 max-w-4xl">
      <Link href="/opportunities" className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-3">
        <ChevronLeft className="w-3.5 h-3.5" /> All opportunities
      </Link>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Upload Solicitation</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Got an RFP/RFQ by email that isn&apos;t on SAM.gov? Drop the documents here with a few details
          and we&apos;ll run the same AI drafting pipeline to produce a full proposal draft.
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span className="whitespace-pre-wrap">{error}</span>
        </div>
      )}

      {/* Progress banner */}
      {phase !== "idle" && phase !== "error" && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-lg p-3 mb-4 flex items-center gap-2">
          {phase === "done" ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
          <span className="font-semibold">{phaseLabel[phase]}</span>
        </div>
      )}

      {/* Metadata form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" /> Opportunity Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Title *" full>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Custodial Services at Building 2592A" disabled={isBusy} />
          </Field>
          <Field label="Agency *">
            <input className={inputCls} value={agency} onChange={(e) => setAgency(e.target.value)}
              placeholder="e.g., Department of the Interior" disabled={isBusy} />
          </Field>
          <Field label="NAICS code">
            <input className={inputCls} value={naicsCode} onChange={(e) => setNaicsCode(e.target.value)}
              placeholder="e.g., 561720" disabled={isBusy} />
          </Field>
          <Field label="Solicitation type">
            <select className={inputCls} value={bidType} onChange={(e) => setBidType(e.target.value as typeof bidType)} disabled={isBusy}>
              <option value="RFQ">RFQ — Request for Quote</option>
              <option value="RFP">RFP — Request for Proposal</option>
              <option value="SOURCES_SOUGHT">Sources Sought / Market Research</option>
            </select>
          </Field>
          <Field label="Set-aside">
            <select className={inputCls} value={setAside} onChange={(e) => setSetAside(e.target.value)} disabled={isBusy}>
              <option value="">Not specified</option>
              <option value="unrestricted">Unrestricted</option>
              <option value="small_business">Small Business</option>
              <option value="wosb">WOSB</option>
              <option value="edwosb">EDWOSB</option>
              <option value="hubzone">HUBZone</option>
              <option value="sdvosb">SDVOSB</option>
              <option value="8a">8(a)</option>
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={isBusy} />
          </Field>
          <Field label="Place of performance">
            <input className={inputCls} value={placeOfPerformance} onChange={(e) => setPlaceOfPerformance(e.target.value)}
              placeholder="e.g., Alexandria, VA" disabled={isBusy} />
          </Field>
          <Field label="One-line summary (optional)" full>
            <textarea className={inputCls} value={summary} onChange={(e) => setSummary(e.target.value)} rows={2}
              placeholder="What's this opportunity about? (leave blank to use the title)" disabled={isBusy} />
          </Field>
        </div>
      </div>

      {/* File dropzone */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-600" /> Solicitation Documents
        </h2>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition ${
            dragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
          } ${isBusy ? "opacity-60 pointer-events-none" : "cursor-pointer"}`}
        >
          <input
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(",")}
            onChange={(e) => e.target.files && addFiles(e.target.files)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isBusy}
          />
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <div className="text-sm font-semibold text-slate-700">
            Drop solicitation files here, or click to browse
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            PDF, DOCX, XLSX, TXT — up to {MAX_FILE_MB} MB each, {MAX_FILES} files max
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{f.name}</span>
                  <span className="text-[10px] text-slate-500 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
                {!isBusy && (
                  <button onClick={() => removeFile(i)} className="text-rose-600 hover:text-rose-700 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <p className="text-[10px] text-slate-500 mt-2">{files.length} of {MAX_FILES} files</p>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-[11px] text-slate-500 max-w-md">
          We&apos;ll auto-estimate a target bid range from the uploaded documents, then run the same drafting pipeline (cover letter, technical approach, management plan, CLIN pricing, etc.). You can edit anything afterwards.
        </p>
        <button
          onClick={handleGenerate}
          disabled={!canSubmit}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {phase === "uploading" ? "Uploading…" :
           phase === "drafting" ? "Drafting…" :
           "Generate Draft"}
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500";

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">{label}</label>
      {children}
    </div>
  );
}
