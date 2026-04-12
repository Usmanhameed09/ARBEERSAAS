"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Download,
  ArrowLeft,
  Building2,
  Calendar,
  Tag,
  Loader2,
  ClipboardCopy,
  DollarSign,
  Shield,
  PenTool,
  Save,
  Edit3,
  Eye,
  CheckCircle2,
  Briefcase,
  Settings,
  ClipboardList,
  Award,
  Cloud,
  CloudOff,
  Sparkles,
  Search,
  Send,
  X,
  AlertTriangle,
  Trash2,
  Users,
  UserCheck,
  Info,
} from "lucide-react";
import type { DraftResult, SectionProvenance, ProvenanceSource, ComplianceVerification } from "@/lib/api";
import { API_BASE, saveDraft, loadDraft, rewriteSection, extractPageLimits } from "@/lib/api";
import type { PageLimit, FormattingReq } from "@/lib/api";

interface DraftSection {
  key: string;
  title: string;
  icon: React.ReactNode;
  volume?: string;
  internalOnly?: boolean; // Not included in PDF — for internal reference only
}

const SECTION_DEFS: DraftSection[] = [
  { key: "coverPage", title: "Cover Page", icon: <FileText className="w-3.5 h-3.5" /> },
  { key: "coverLetter", title: "Cover Letter", icon: <PenTool className="w-3.5 h-3.5" /> },
  { key: "companyProfile", title: "Federal Contracting Profile", icon: <Building2 className="w-3.5 h-3.5" /> },
  { key: "complianceMatrix", title: "Compliance Matrix (Internal)", icon: <CheckCircle2 className="w-3.5 h-3.5" />, volume: "Internal", internalOnly: true },
  { key: "technicalCapability", title: "Technical Approach", icon: <Settings className="w-3.5 h-3.5" />, volume: "Vol II" },
  { key: "managementPlan", title: "Management Plan", icon: <Briefcase className="w-3.5 h-3.5" />, volume: "Vol II" },
  { key: "qualityControlPlan", title: "Quality Control Plan", icon: <ClipboardList className="w-3.5 h-3.5" />, volume: "Vol II" },
  { key: "keyPersonnel", title: "Key Personnel", icon: <UserCheck className="w-3.5 h-3.5" />, volume: "Vol II" },
  { key: "staffingPlan", title: "Staffing Plan", icon: <Users className="w-3.5 h-3.5" />, volume: "Vol II" },
  { key: "pastPerformance", title: "Past Performance", icon: <Award className="w-3.5 h-3.5" />, volume: "Vol II" },
  { key: "clinData", title: "CLIN Pricing", icon: <DollarSign className="w-3.5 h-3.5" />, volume: "Vol III" },
  { key: "repsAndCerts", title: "Reps & Certifications", icon: <Shield className="w-3.5 h-3.5" />, volume: "Vol IV" },
];

// Strip duplicate headings and scoring notes from GPT content before PDF rendering
function cleanContentForPdf(text: string): string {
  return text
    // Remove [SCORING NOTE: ...] blocks (single line)
    .replace(/\[SCORING NOTE:[^\]]*\]/gi, "")
    // Remove duplicate volume headers that the PDF already adds
    .replace(/^VOLUME\s+I+\s*[—–-]\s*TECHNICAL PROPOSAL\s*\n*/im, "")
    .replace(/^VOLUME\s+II+\s*[—–-]\s*PAST PERFORMANCE\s*\n*/im, "")
    .replace(/^VOLUME\s+III+\s*[—–-]\s*PRICE PROPOSAL\s*\n*/im, "")
    .replace(/^VOLUME\s+IV+\s*[—–-]\s*ADMINISTRATIVE\s*\n*/im, "")
    // Remove leading blank lines after stripping
    .replace(/^\n+/, "")
    .trim();
}

interface ClinItem {
  item: string;
  description: string;
  psc: string;
  pricingArrangement: string;
  qty: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

interface ClinGroup {
  period: string;
  items: ClinItem[];
}

function parseClinData(raw: string): ClinGroup[] | null {
  if (!raw || !raw.trim()) return null;

  // Helper: try JSON.parse, return parsed array or null
  const tryParse = (s: string): ClinGroup[] | null => {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].period) return parsed;
    } catch { /* not JSON */ }
    return null;
  };

  // 1. Try parsing as JSON array directly
  const direct = tryParse(raw);
  if (direct) return direct;

  // 2. Try extracting embedded JSON array from text
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    const embedded = tryParse(jsonMatch[0]);
    if (embedded) return embedded;
  }

  // 3. Handle Python-style single-quote dicts (GPT sometimes returns these)
  //    Convert {'key':'value'} → {"key":"value"}
  if (raw.includes("'period'") || raw.includes("'items'")) {
    try {
      const fixed = raw
        .replace(/'/g, '"')           // single → double quotes
        .replace(/True/g, "true")     // Python booleans
        .replace(/False/g, "false")
        .replace(/None/g, "null");
      const fixedMatch = fixed.match(/\[[\s\S]*\]/);
      const toParse = fixedMatch ? fixedMatch[0] : fixed;
      const parsed = tryParse(toParse);
      if (parsed) return parsed;
    } catch { /* conversion failed */ }
  }

  // 4. Parse text format (GPT commonly returns this):
  //    ITEM 0001
  //    Description text
  //    Base Year
  //    Product Service Code: Z1KA
  //    Pricing Arrangement: Firm Fixed Price
  //    1 Job $9,750,000 $9,750,000
  return parseCliNTextFormat(raw);
}

function parseCliNTextFormat(text: string): ClinGroup[] | null {
  const lines = text.split(/\r?\n/);
  const groups: ClinGroup[] = [];
  let currentPeriod = "Base Year";
  let currentItems: ClinItem[] = [];
  let currentItem: Partial<ClinItem> | null = null;

  const parseNum = (s: string) => parseFloat(s.replace(/[$,]/g, "")) || 0;

  const flushItem = () => {
    if (currentItem && currentItem.item) {
      // Auto-calculate amount if missing
      const qty = currentItem.qty || 0;
      const unitPrice = currentItem.unitPrice || 0;
      const amount = currentItem.amount || qty * unitPrice;
      currentItems.push({
        item: currentItem.item || "",
        description: currentItem.description || "",
        psc: currentItem.psc || "",
        pricingArrangement: currentItem.pricingArrangement || "Firm Fixed Price",
        qty,
        unit: currentItem.unit || "Each",
        unitPrice,
        amount,
      });
    }
    currentItem = null;
  };

  const flushGroup = () => {
    flushItem();
    if (currentItems.length > 0) {
      groups.push({ period: currentPeriod, items: [...currentItems] });
      currentItems = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.match(/^[-─═]+$/) || line.startsWith("Subtotal") || line.startsWith("GRAND TOTAL")) continue;

    // Detect period headers: "--- BASE YEAR ---" or "═══ BASE YEAR ═══" or "Base Year" standalone
    const periodMatch = line.match(/^[-═]+\s*(BASE YEAR|OPTION YEAR \d+)\s*[-═]+$/i) ||
                        line.match(/^(Base Year|Option Year \d+)\s*$/i);
    if (periodMatch) {
      const newPeriod = periodMatch[1].replace(/\b\w/g, c => c.toUpperCase());
      if (newPeriod !== currentPeriod) {
        flushGroup();
        currentPeriod = newPeriod;
      }
      continue;
    }

    // Detect "ITEM 0001" or "ITEM: 0001"
    const itemMatch = line.match(/^ITEM[:\s]+(\d+)/i);
    if (itemMatch) {
      flushItem();
      currentItem = { item: itemMatch[1] };
      continue;
    }

    // Simple format: "Description: ..."
    const descMatch = line.match(/^Description:\s*(.+)/i);
    if (descMatch && currentItem) {
      currentItem.description = descMatch[1];
      continue;
    }

    // Simple format: "Qty: 1 | Unit: Lot" or "Qty: 1, Unit: Lot"
    const qtyUnitMatch = line.match(/^Qty:\s*(\d+)\s*[|,]\s*Unit:\s*(.+)/i);
    if (qtyUnitMatch && currentItem) {
      currentItem.qty = parseInt(qtyUnitMatch[1]);
      currentItem.unit = qtyUnitMatch[2].trim();
      continue;
    }

    // Simple format: "Unit Price: $9,750,000.00"
    const unitPriceMatch = line.match(/^Unit Price:\s*\$?([\d,.]+)/i);
    if (unitPriceMatch && currentItem) {
      currentItem.unitPrice = parseNum(unitPriceMatch[1]);
      continue;
    }

    // Simple format: "Amount: $9,750,000.00"
    const amountMatch = line.match(/^Amount:\s*\$?([\d,.]+)/i);
    if (amountMatch && currentItem) {
      currentItem.amount = parseNum(amountMatch[1]);
      continue;
    }

    // "PSC: Z1KA" or "Product Service Code: Z1KA"
    const pscMatch = line.match(/^(?:PSC|Product Service Code):\s*(.+)/i);
    if (pscMatch && currentItem) {
      currentItem.psc = pscMatch[1].trim();
      continue;
    }

    // "Pricing: Firm Fixed Price" or "Pricing Arrangement: Firm Fixed Price"
    const pricingMatch = line.match(/^(?:Pricing|Pricing Arrangement):\s*(.+)/i);
    if (pricingMatch && currentItem) {
      currentItem.pricingArrangement = pricingMatch[1].trim();
      continue;
    }

    // Old table format: "1 Job $9,750,000 $9,750,000"
    const oldPriceMatch = line.match(/^(\d+(?:\.\d+)?)\s+([A-Za-z/]+)\s+\$?([\d,]+(?:\.\d{2})?)\s+\$?([\d,]+(?:\.\d{2})?)$/);
    if (oldPriceMatch && currentItem) {
      currentItem.qty = parseInt(oldPriceMatch[1]);
      currentItem.unit = oldPriceMatch[2];
      currentItem.unitPrice = parseNum(oldPriceMatch[3]);
      currentItem.amount = parseNum(oldPriceMatch[4]);
      continue;
    }

    // Skip header-like lines from old table format
    if (line.match(/^ITEM\s+SUPPLIES/i) || line.match(/^UNIT PRICE\s+AMOUNT/i) || line.match(/^[%═─]+$/)) continue;

    // Description line (first non-recognized line after ITEM)
    if (currentItem && !currentItem.description) {
      currentItem.description = line;
      continue;
    }
  }

  // Flush remaining
  flushGroup();

  return groups.length > 0 ? groups : null;
}

function formatClinForDisplay(groups: ClinGroup[]): string {
  let text = "";
  for (const group of groups) {
    text += `--- ${group.period.toUpperCase()} ---\n\n`;
    for (const item of group.items) {
      text += `ITEM ${item.item}\n`;
      text += `Description: ${item.description}\n`;
      text += `Qty: ${item.qty} | Unit: ${item.unit}\n`;
      text += `Unit Price: $${item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n`;
      text += `Amount: $${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n`;
      if (item.psc) text += `PSC: ${item.psc}\n`;
      text += `Pricing: ${item.pricingArrangement}\n`;
      text += "\n";
    }
    const total = group.items.reduce((sum, i) => sum + i.amount, 0);
    text += `Subtotal: $${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n\n`;
  }
  const grandTotal = groups.reduce((sum, g) => sum + g.items.reduce((s, i) => s + i.amount, 0), 0);
  text += `GRAND TOTAL: $${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}\n`;
  return text;
}

export default function DraftViewerPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<DraftResult | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Draft workspace state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftVersion, setDraftVersion] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AI Rewrite state
  const [aiChatOpen, setAiChatOpen] = useState<string | null>(null); // section key or null
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<Record<string, { role: string; content: string }[]>>({});
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Page limits state
  const [pageLimits, setPageLimits] = useState<PageLimit[]>([]);
  const [formattingReqs, setFormattingReqs] = useState<FormattingReq[]>([]);

  // Excel pricing state
  const [excelDownloading, setExcelDownloading] = useState(false);

  // Provenance modal state (V2 pipeline) — shows which sources were used to generate a section
  const [provenanceOpen, setProvenanceOpen] = useState<string | null>(null); // section key or null
  const provenanceMap: Record<string, SectionProvenance> =
    (data as unknown as { provenance?: Record<string, SectionProvenance> })?.provenance || {};
  const complianceReport: ComplianceVerification | null =
    (data as unknown as { compliance?: ComplianceVerification | null })?.compliance || null;

  // Helper to initialize editedContent from draft data
  const initializeContent = useCallback((draft: Record<string, string>) => {
    console.log("[initializeContent] called with draft type:", typeof draft, "keys:", draft ? Object.keys(draft) : "null");
    if (!draft || typeof draft !== "object") {
      console.error("[initializeContent] draft is not an object!", draft);
      return;
    }
    const d = draft;
    const fallbacks: Record<string, string> = {
      clinData: d.clinData || d.clinPricing || "",
      technicalCapability: d.technicalCapability || d.technicalResponse || "",
      managementPlan: d.managementPlan || "",
      qualityControlPlan: d.qualityControlPlan || "",
      pastPerformance: d.pastPerformance || "",
      complianceMatrix: d.complianceMatrix || "",
    };

    const initial: Record<string, string> = {};
    SECTION_DEFS.forEach((s) => {
      let content = fallbacks[s.key] !== undefined ? fallbacks[s.key] : (d[s.key] || "");
      if (s.key === "clinData" && content) {
        try {
          const groups = parseClinData(content);
          if (groups) {
            content = formatClinForDisplay(groups);
          } else if (content.startsWith("[") || content.startsWith("{")) {
            const fixed = content.replace(/'/g, '"').replace(/True/g, "true").replace(/False/g, "false").replace(/None/g, "null");
            const retryGroups = parseClinData(fixed);
            if (retryGroups) content = formatClinForDisplay(retryGroups);
          }
        } catch (e) {
          console.warn("[initializeContent] clinData parsing error, keeping raw:", e);
        }
      }
      initial[s.key] = content;
    });
    const nonEmpty = Object.entries(initial).filter(([, v]) => v && v.length > 0);
    console.log("[initializeContent] Setting editedContent:", nonEmpty.length, "non-empty sections:", nonEmpty.map(([k, v]) => `${k}:${v.length}`));
    setEditedContent(initial);
  }, []);

  // Load draft: from URL param draftId OR localStorage
  useEffect(() => {
    const urlDraftId = searchParams.get("draftId");

    if (urlDraftId) {
      // Load from backend
      console.log("[DRAFT-LOAD] Loading from backend, draftId:", urlDraftId);
      (async () => {
        try {
          const result = await loadDraft(urlDraftId);
          console.log("[DRAFT-LOAD] loadDraft result:", result.success, "draft keys:", result.draft ? Object.keys(result.draft) : "NO DRAFT");
          if (result.success && result.draft) {
            setData(result);
            setDraftId(urlDraftId);
            initializeContent(result.draft as unknown as Record<string, string>);
            if (result.pageLimits) setPageLimits(result.pageLimits);
            if (result.formattingRequirements) setFormattingReqs(result.formattingRequirements);
          } else {
            console.error("[DRAFT-LOAD] Failed or no draft, falling back to localStorage", result);
            loadFromLocalStorage();
          }
        } catch (err) {
          console.error("[DRAFT-LOAD] Error loading draft:", err);
          loadFromLocalStorage();
        }
      })();
    } else {
      loadFromLocalStorage();
    }

    function loadFromLocalStorage() {
      try {
        const raw = localStorage.getItem("arber_draft_data");
        console.log("[DRAFT-DEBUG] raw localStorage length:", raw?.length || 0);
        if (raw) {
          const parsed = JSON.parse(raw);
          console.log("[DRAFT-DEBUG] parsed.success:", parsed.success);
          console.log("[DRAFT-DEBUG] parsed.draft keys:", parsed.draft ? Object.keys(parsed.draft) : "NO DRAFT");
          if (parsed.draft) {
            const nonEmpty = Object.entries(parsed.draft).filter(([, v]) => v && String(v).length > 10);
            console.log("[DRAFT-DEBUG] non-empty sections:", nonEmpty.map(([k, v]) => `${k}:${String(v).length}`));
          }
          setData(parsed);
          if (parsed.draft) {
            initializeContent(parsed.draft);
          }
          // Auto-save new drafts to backend
          if (!parsed._draftId) {
            autoSaveToBackend(parsed);
          } else {
            setDraftId(parsed._draftId);
          }
        }
      } catch { /* ignore */ }
    }

    async function autoSaveToBackend(parsed: DraftResult) {
      try {
        // Include attachmentAnalysis in opportunityJson so it persists across loads
        const oppJson = { ...(parsed.opportunity || {}) } as Record<string, unknown>;
        if (parsed.attachmentAnalysis) {
          oppJson.attachmentAnalysis = parsed.attachmentAnalysis;
        }
        const result = await saveDraft({
          sectionsJson: parsed.draft as unknown as Record<string, string>,
          opportunityJson: oppJson,
          companyJson: (parsed.company || {}) as Record<string, unknown>,
          title: parsed.opportunity?.title || parsed.draft?.draftTitle || "Untitled Draft",
        });
        if (result.success && result.draftId) {
          setDraftId(result.draftId);
          // Store draftId in localStorage for reference
          const updated = { ...parsed, _draftId: result.draftId };
          localStorage.setItem("arber_draft_data", JSON.stringify(updated));
        }
      } catch { /* silent */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getContent = useCallback(
    (key: string) => editedContent[key] || "",
    [editedContent]
  );

  // Use refs to always have current values in save functions (avoids stale closures)
  const dataRef = useRef(data);
  const draftIdRef = useRef(draftId);
  const editedContentRef = useRef(editedContent);
  const pageLimitsRef = useRef(pageLimits);
  const formattingReqsRef = useRef(formattingReqs);
  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { draftIdRef.current = draftId; }, [draftId]);
  useEffect(() => { editedContentRef.current = editedContent; }, [editedContent]);
  useEffect(() => { pageLimitsRef.current = pageLimits; }, [pageLimits]);
  useEffect(() => { formattingReqsRef.current = formattingReqs; }, [formattingReqs]);

  const triggerSave = useCallback(async () => {
    const curData = dataRef.current;
    const curDraftId = draftIdRef.current;
    const curContent = editedContentRef.current;
    if (!curData) return;
    setSaveStatus("saving");
    try {
      console.log("[triggerSave] saving draft", curDraftId, "sections:", Object.keys(curContent));
      // Preserve attachmentAnalysis in opportunityJson so it persists
      const oppJson = { ...(curData.opportunity || {}) } as Record<string, unknown>;
      if (curData.attachmentAnalysis) {
        oppJson.attachmentAnalysis = curData.attachmentAnalysis;
      }
      const result = await saveDraft({
        draftId: curDraftId,
        sectionsJson: curContent,
        opportunityJson: oppJson,
        companyJson: (curData.company || {}) as Record<string, unknown>,
        title: curData.opportunity?.title || curData.draft?.draftTitle || "Untitled Draft",
        pageLimits: pageLimitsRef.current,
        formattingRequirements: formattingReqsRef.current,
      });
      console.log("[triggerSave] result:", result);
      if (result.success) {
        if (result.draftId && !curDraftId) {
          setDraftId(result.draftId);
          draftIdRef.current = result.draftId;
        }
        if (result.version) setDraftVersion(result.version);
        setSaveStatus("saved");
      } else {
        console.error("[triggerSave] save failed:", result);
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("[triggerSave] error:", err);
      setSaveStatus("error");
    }
  }, []);

  const saveAsNewVersion = useCallback(async () => {
    const curData = dataRef.current;
    const curDraftId = draftIdRef.current;
    const curContent = editedContentRef.current;
    if (!curData || !curDraftId) return;
    setSaveStatus("saving");
    try {
      console.log("[saveAsNewVersion] creating new version from", curDraftId);
      // Preserve attachmentAnalysis in opportunityJson
      const oppJson2 = { ...(curData.opportunity || {}) } as Record<string, unknown>;
      if (curData.attachmentAnalysis) {
        oppJson2.attachmentAnalysis = curData.attachmentAnalysis;
      }
      const result = await saveDraft({
        draftId: curDraftId,
        sectionsJson: curContent,
        opportunityJson: oppJson2,
        companyJson: (curData.company || {}) as Record<string, unknown>,
        title: curData.opportunity?.title || curData.draft?.draftTitle || "Untitled Draft",
        pageLimits: pageLimitsRef.current,
        formattingRequirements: formattingReqsRef.current,
        createNewVersion: true,
      });
      console.log("[saveAsNewVersion] result:", result);
      if (result.success) {
        if (result.draftId) {
          setDraftId(result.draftId);
          draftIdRef.current = result.draftId;
        }
        if (result.version) setDraftVersion(result.version);
        setSaveStatus("saved");
      } else {
        console.error("[saveAsNewVersion] failed:", result);
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("[saveAsNewVersion] error:", err);
      setSaveStatus("error");
    }
  }, []);

  const updateContent = useCallback((key: string, value: string) => {
    setEditedContent((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("unsaved");
    // Debounced auto-save (30s)
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      triggerSave();
    }, 30000);
  }, [triggerSave]);

  const saveEdits = useCallback(() => {
    if (!data) return;
    const updated = { ...data, draft: { ...data.draft!, ...editedContent } };
    setData(updated);
    localStorage.setItem("arber_draft_data", JSON.stringify(updated));
    setEditMode(false);
    triggerSave();
  }, [data, editedContent, triggerSave]);

  // AI Rewrite handler
  const handleAiRewrite = useCallback(async (sectionKey: string) => {
    if (!aiInstruction.trim() || aiLoading) return;
    setAiLoading(true);
    setAiPreview(null);
    setAiError(null);

    const history = aiHistory[sectionKey] || [];
    try {
      let sectionContent = getContent(sectionKey);
      if (sectionKey === "clinData") {
        const clinGroups = parseClinData(sectionContent);
        if (clinGroups) {
          sectionContent = JSON.stringify(clinGroups, null, 2);
        }
      }

      const result = await rewriteSection({
        sectionKey,
        sectionContent,
        instruction: aiInstruction,
        conversationHistory: history,
        opportunityContext: (data?.opportunity || {}) as Record<string, unknown>,
        pageLimit: getPageLimitForSection(sectionKey),
      });

      if (result.success && result.rewrittenContent) {
        // Show preview — user can accept or reject
        let previewContent = result.rewrittenContent;
        if (sectionKey === "clinData") {
          const clinGroups = parseClinData(result.rewrittenContent || "");
          if (!clinGroups) {
            setAiError("AI rewrite returned invalid CLIN pricing data. Try a more specific instruction.");
            return;
          }
          previewContent = formatClinForDisplay(clinGroups);
        }
        setAiPreview(previewContent);
        // Update chat history
        setAiHistory((prev) => ({
          ...prev,
          [sectionKey]: [
            ...(prev[sectionKey] || []),
            { role: "user", content: aiInstruction },
            { role: "assistant", content: result.rewrittenContent! },
          ].slice(-8), // Keep last 8 messages (4 turns)
        }));
      } else {
        setAiError(result.error || "AI rewrite failed for this section.");
      }
    } catch {
      setAiError("AI rewrite failed. Please try again.");
    } finally {
      setAiLoading(false);
      setAiInstruction("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiInstruction, aiLoading, aiHistory, data, editedContent]);

  const applyAiRewrite = useCallback((sectionKey: string) => {
    if (!aiPreview) return;
    updateContent(sectionKey, aiPreview);
    setAiPreview(null);
    setAiError(null);
    setAiChatOpen(null);
    // Auto-save to backend after AI rewrite is applied
    setTimeout(() => triggerSave(), 500);
  }, [aiPreview, updateContent, triggerSave]);

  // Page limit helper
  const getPageLimitForSection = (sectionKey: string): number | null => {
    const volumeMap: Record<string, string> = {
      technicalCapability: "Technical",
      managementPlan: "Technical",
      qualityControlPlan: "Technical",
      pastPerformance: "Past Performance",
      clinData: "Price",
    };
    const vol = volumeMap[sectionKey];
    if (!vol) return null;
    const limit = pageLimits.find((pl) => pl.volume === vol);
    return limit?.maxPages || null;
  };

  // Estimate page count for a section
  const estimatePages = (text: string): number => {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.ceil(wordCount / 250); // ~250 words per page
  };

  // Download filled Excel pricing sheet
  const handleDownloadPricingExcel = useCallback(async () => {
    if (!data?.attachmentAnalysis?.pricingFormatUrl) return;
    setExcelDownloading(true);
    try {
      const clinContent = getContent("clinData") || data.draft?.clinData || "";
      let clinParsed: unknown = clinContent;
      try { clinParsed = JSON.parse(clinContent); } catch { /* send as text */ }

      const resp = await fetch(`${API_BASE}/draft/fill-pricing-excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("arber_token")}` },
        body: JSON.stringify({
          sourceUrl: data.attachmentAnalysis.pricingFormatUrl,
          clinData: clinParsed,
          clinText: clinContent,
          filename: data.attachmentAnalysis.pricingFormatSource || "Pricing_Schedule.xlsx",
        }),
      });
      const result = await resp.json();
      if (result.success && result.excelBase64) {
        const bytes = Uint8Array.from(atob(result.excelBase64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename || "Pricing_Schedule_Filled.xlsx";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Excel download error:", err);
    } finally {
      setExcelDownloading(false);
    }
  }, [data, getContent]);

  const handleCopyAll = useCallback(() => {
    const sections = SECTION_DEFS.filter((s) => getContent(s.key));
    const fullText = sections
      .map((s) => `=== ${s.title.toUpperCase()} ===\n\n${getContent(s.key)}`)
      .join("\n\n\n");
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [getContent]);

  const handleDownloadPdf = useCallback(async (mode: "download" | "preview" = "download") => {
    if (!data?.draft) return;
    setGeneratingPdf(true);

    try {
      const { jsPDF } = await import("jspdf");
      const { PDFDocument } = await import("pdf-lib");

      const doc = new jsPDF({ unit: "mm", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 25;
      const maxWidth = pageWidth - margin * 2;
      const opp = data.opportunity || { title: "", agency: "", noticeId: "", naicsCode: "", dueDate: "", bidType: "" };
      const comp = data.company || { name: "", uei: "", cageCode: "", address: "", samStatus: "", businessType: "", naicsCode: "", website: "", phone: "", email: "", annualRevenue: "", employeeCount: "", certifications: [], managerName: "", jobTitle: "" };
      const solNum = opp.noticeId || "";

      // Helper: add header to each page
      const addPageHeader = (solNumber: string, companyName: string) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text(companyName, margin, 12);
        doc.text(`SOL: ${solNumber}`, pageWidth - margin, 12, { align: "right" });
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, 14, pageWidth - margin, 14);
      };

      // Helper: wrap and write text, auto-paginate
      const writeText = (
        text: string,
        startY: number,
        fontSize: number = 10,
        style: string = "normal",
        color: [number, number, number] = [40, 40, 40]
      ): number => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", style);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, maxWidth);
        const lineHeight = fontSize * 0.5;
        let y = startY;

        for (const line of lines) {
          if (y + lineHeight > pageHeight - 20) {
            doc.addPage();
            addPageHeader(solNum, comp.name);
            y = 22;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        }
        return y;
      };

      // Strip inline markdown (bold/italic/code markers) from a line of text
      const stripInlineMd = (s: string): string => {
        return s
          .replace(/\*\*\*(.+?)\*\*\*/g, "$1") // ***bold italic***
          .replace(/\*\*(.+?)\*\*/g, "$1")     // **bold**
          .replace(/__(.+?)__/g, "$1")         // __bold__
          .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1") // *italic* (not **)
          .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, "$1")       // _italic_
          .replace(/`([^`]+)`/g, "$1")         // `code`
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
          // Final sweep — remove any orphan markers that slipped through
          .replace(/\*{2,}/g, "")              // orphan ** or ***
          .replace(/(?:^|\s)#{1,6}\s+/g, (m) => m.replace(/#+\s+/, "")); // orphan leading ####
      };

      // Helper: write markdown-aware multi-line text.
      // Handles: # headings, **bold**, - bullets, 1. numbered, | tables, blockquotes.
      const writeMultiLine = (text: string, startY: number, fontSize: number = 10): number => {
        let y = startY;
        const lines = text.split("\n");

        // Collect consecutive table rows so we can render as a real table
        let tableBuffer: string[] = [];
        const flushTable = () => {
          if (tableBuffer.length === 0) return;
          // Drop markdown separator rows like |---|---|
          const rows = tableBuffer
            .filter((r) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(r))
            .map((r) => r.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => stripInlineMd(c.trim())));
          if (rows.length === 0) { tableBuffer = []; return; }

          const colCount = Math.max(...rows.map((r) => r.length));
          const colWidth = maxWidth / colCount;
          const rowHeight = 5;

          // Header row (first row) styled
          doc.setFontSize(fontSize - 1);
          for (let ri = 0; ri < rows.length; ri++) {
            if (y + rowHeight > pageHeight - 20) {
              doc.addPage();
              addPageHeader(solNum, comp.name);
              y = 22;
            }
            const row = rows[ri];
            const isHeader = ri === 0;
            if (isHeader) {
              doc.setFillColor(241, 245, 249);
              doc.rect(margin, y - 3.5, maxWidth, rowHeight + 1, "F");
              doc.setFont("helvetica", "bold");
              doc.setTextColor(30, 30, 30);
            } else {
              doc.setFont("helvetica", "normal");
              doc.setTextColor(50, 50, 50);
            }
            let tallest = rowHeight;
            for (let ci = 0; ci < colCount; ci++) {
              const cell = row[ci] || "";
              const wrapped = doc.splitTextToSize(cell, colWidth - 2);
              doc.text(wrapped, margin + ci * colWidth + 1, y);
              const cellHeight = wrapped.length * (fontSize * 0.48);
              if (cellHeight > tallest) tallest = cellHeight;
            }
            // Row border
            doc.setDrawColor(220, 220, 220);
            doc.line(margin, y + tallest - 3, margin + maxWidth, y + tallest - 3);
            y += tallest + 1;
          }
          y += 2;
          tableBuffer = [];
        };

        for (const rawLine of lines) {
          const line = rawLine.replace(/\s+$/, "");
          const trimmed = line.trim();

          // Table row detection (must have a pipe and not be a link)
          if (trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|", 1)) {
            tableBuffer.push(trimmed);
            continue;
          } else if (tableBuffer.length > 0) {
            flushTable();
          }

          if (!trimmed) { y += 3; continue; }

          // ATX headings: # through ###### — check longest first, all levels stripped
          const hAny = trimmed.match(/^(#{1,6})\s+(.+?)\s*#*$/);
          if (hAny) {
            const level = hAny[1].length;
            const headingText = stripInlineMd(hAny[2]);
            // Map level → font bump; levels 4+ get smallest bump but still bold
            const bumpMap: Record<number, number> = { 1: 3, 2: 2, 3: 1, 4: 0, 5: 0, 6: 0 };
            const bump = bumpMap[level] ?? 0;
            const shade: [number, number, number] =
              level === 1 ? [20, 20, 20] :
              level === 2 ? [25, 25, 25] :
              level === 3 ? [30, 30, 30] :
              [40, 40, 40];
            y += level <= 2 ? 3 : 2;
            y = writeText(headingText, y, fontSize + bump, "bold", shade);
            y += level <= 2 ? 2 : 1;
            continue;
          }

          // Horizontal rule
          if (/^[-*_]{3,}$/.test(trimmed)) {
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, y, margin + maxWidth, y);
            y += 4;
            continue;
          }

          // Blockquote
          if (trimmed.startsWith(">")) {
            const quoteText = stripInlineMd(trimmed.replace(/^>\s?/, ""));
            y = writeText(quoteText, y, fontSize, "italic", [90, 90, 90]);
            continue;
          }

          // Bullet list: -, *, • at start
          const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
          if (bulletMatch) {
            const bulletText = stripInlineMd(bulletMatch[1]);
            doc.setFontSize(fontSize);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(40, 40, 40);
            if (y + fontSize * 0.5 > pageHeight - 20) {
              doc.addPage();
              addPageHeader(solNum, comp.name);
              y = 22;
            }
            doc.text("•", margin + 2, y);
            const wrapped = doc.splitTextToSize(bulletText, maxWidth - 8);
            for (let i = 0; i < wrapped.length; i++) {
              if (y + fontSize * 0.5 > pageHeight - 20) {
                doc.addPage();
                addPageHeader(solNum, comp.name);
                y = 22;
              }
              doc.text(wrapped[i], margin + 6, y);
              y += fontSize * 0.5;
            }
            continue;
          }

          // Numbered list: 1. 2. etc
          const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
          if (numMatch) {
            const numText = stripInlineMd(numMatch[2]);
            const numberLabel = `${numMatch[1]}.`;
            doc.setFontSize(fontSize);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(40, 40, 40);
            if (y + fontSize * 0.5 > pageHeight - 20) {
              doc.addPage();
              addPageHeader(solNum, comp.name);
              y = 22;
            }
            doc.text(numberLabel, margin + 2, y);
            const wrapped = doc.splitTextToSize(numText, maxWidth - 10);
            for (let i = 0; i < wrapped.length; i++) {
              if (y + fontSize * 0.5 > pageHeight - 20) {
                doc.addPage();
                addPageHeader(solNum, comp.name);
                y = 22;
              }
              doc.text(wrapped[i], margin + 8, y);
              y += fontSize * 0.5;
            }
            continue;
          }

          // Fallback: detect old-style uppercase/Volume headings
          const isLegacyHeading = /^(VOLUME|Factor|Contract\s\d|CPARS|─|═)/.test(trimmed);
          if (isLegacyHeading) {
            y += 2;
            y = writeText(stripInlineMd(trimmed), y, fontSize, "bold", [30, 30, 30]);
            y += 1;
            continue;
          }

          // Regular paragraph — strip inline markdown and write
          y = writeText(stripInlineMd(trimmed), y, fontSize, "normal", [40, 40, 40]);
        }
        // Flush any trailing table
        flushTable();
        return y;
      };

      const bidType = (opp.bidType || "RFQ").toUpperCase();
      const isRFQ = bidType === "RFQ";

      // ─── PAGE 1: COVER PAGE ───────────────────────────────────
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text((comp.name || "Company Name").toUpperCase(), pageWidth / 2, 60, { align: "center" });

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text("Solicitation Response", pageWidth / 2, 75, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      doc.text(`Solicitation Number: ${solNum}`, pageWidth / 2, 90, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const titleLines = doc.splitTextToSize(`(${opp.title || ""})`, maxWidth - 20);
      let titleY = 100;
      for (const line of titleLines) {
        doc.text(line, pageWidth / 2, titleY, { align: "center" });
        titleY += 6;
      }

      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth / 2, titleY + 10, { align: "center" });

      // ATTN block at bottom of cover
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const coverPageContent = getContent("coverPage");
      const attnMatch = coverPageContent.match(/ATTN:[\s\S]*/);
      if (attnMatch) {
        let attnY = 180;
        const attnLines = attnMatch[0].split("\n").filter((l: string) => l.trim());
        for (const line of attnLines) {
          doc.text(line.trim(), margin, attnY);
          attnY += 5;
        }
      } else {
        doc.text(`ATTN: ${opp.agency || ""}`, margin, 180);
      }

      // ─── PAGE 2: COVER LETTER ─────────────────────────────────
      doc.addPage();
      addPageHeader(solNum, comp.name);
      let y = 22;
      const letterContent = getContent("coverLetter");
      if (letterContent) {
        y = writeMultiLine(letterContent, y, 10);
      }

      // ─── PAGE 3: TABLE OF CONTENTS (placeholder — filled after content pages) ───
      doc.addPage();
      addPageHeader(solNum, comp.name);
      const tocPageNumber = doc.getNumberOfPages(); // remember TOC page to fill later
      y = 28;

      // ─── PAGE 4: COMPANY PROFILE (TABLE FORMAT) ──────────────
      doc.addPage();
      addPageHeader(solNum, comp.name);
      y = 22;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${comp.name}, Federal Contracting Profile`, margin, y);
      y += 10;

      // Render profile as a bordered table like the original
      // Extract POC/phone/email from companyProfile content or use company data
      const profileContent = getContent("companyProfile");
      const extractField = (label: string): string => {
        const match = profileContent.match(new RegExp(`${label}[:\\s]+(.+)`, "i"));
        return match ? match[1].trim() : "";
      };
      const profilePoc = extractField("POC Name") || extractField("Point of Contact") || extractField("Manager") || comp.managerName || "";
      const profilePhone = extractField("Phone") || comp.phone || "";
      const profileEmail = extractField("Email") || comp.email || "";
      const profileTaxId = extractField("Taxpayer ID") || extractField("TAXPAYER ID") || "";

      const profileRows: [string, string][] = [
        ["Company Name:", comp.name || ""],
        ["Address:", comp.address || ""],
        ["POC Name:", profilePoc],
        ["Phone:", profilePhone],
        ["Email:", profileEmail],
        ["Taxpayer ID #:", profileTaxId],
        ["PSC/NAICS Code:", comp.naicsCode || data.opportunity?.naicsCode || ""],
        ["SAM.gov Registered:", comp.samStatus ? "Yes" : "Yes"],
        ["SAM Unique Entity ID:", comp.uei || ""],
        ["CAGE:", comp.cageCode || ""],
        ["Business Type:", comp.businessType || "Small Business"],
      ];

      const profileTableWidth = maxWidth;
      const profileRowHeight = 8;

      // Outer border
      const totalTableHeight = profileRows.filter(r => r[1]).length * profileRowHeight;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, profileTableWidth, totalTableHeight, 2, 2, "S");
      doc.setLineWidth(0.2);

      for (const [label, value] of profileRows) {
        if (!value) continue;
        // Row separator
        if (y > 32) {
          doc.setDrawColor(210, 210, 210);
          doc.line(margin + 2, y, margin + profileTableWidth - 2, y);
        }
        y += 5.5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(label, margin + 5, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(value, margin + 55, y);
        y += 2.5;
      }
      y += 5;

      // ─── NOTE: Compliance Matrix is INTERNAL ONLY — not included in submitted PDF ───

      // Track page numbers for TOC
      const tocEntries: { title: string; page: number; indent?: boolean }[] = [];
      tocEntries.push({ title: `${comp.name}, Federal Contracting Profile`, page: doc.getNumberOfPages() + 1 });

      // ─── VOLUME I: TECHNICAL CAPABILITY (RFP only) ──────────────────────
      const techContent = cleanContentForPdf(getContent("technicalCapability"));
      if (!isRFQ && techContent) {
        doc.addPage();
        addPageHeader(solNum, comp.name);
        y = 22;
        tocEntries.push({ title: "Volume I — Technical Proposal", page: doc.getNumberOfPages() });
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text("Volume I — Technical Proposal", margin, y);
        y += 10;
        y = writeMultiLine(techContent, y, 10);

        // ─── MANAGEMENT PLAN (RFP only) ──────────────────────────────────────
        const mgmtContent = cleanContentForPdf(getContent("managementPlan"));
        if (mgmtContent) {
          if (y + 30 > pageHeight - 20) {
            doc.addPage();
            addPageHeader(solNum, comp.name);
            y = 22;
          } else {
            y += 6;
          }
          tocEntries.push({ title: "Factor 2: Management Plan", page: doc.getNumberOfPages(), indent: true });
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 30, 30);
          doc.text("Factor 2 — Management Plan", margin, y);
          y += 10;
          y = writeMultiLine(mgmtContent, y, 10);
        }

        // ─── QUALITY CONTROL PLAN (RFP only) ──────────────────────────────────
        const qcContent = cleanContentForPdf(getContent("qualityControlPlan"));
        if (qcContent) {
          if (y + 30 > pageHeight - 20) {
            doc.addPage();
            addPageHeader(solNum, comp.name);
            y = 22;
          } else {
            y += 6;
          }
          tocEntries.push({ title: "Factor 3: Quality Control Plan", page: doc.getNumberOfPages(), indent: true });
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 30, 30);
          doc.text("Factor 3 — Quality Control Plan", margin, y);
          y += 10;
          y = writeMultiLine(qcContent, y, 10);
        }

        // ─── VOLUME II: PAST PERFORMANCE (RFP only) ───────────────────────────
        const ppContent = cleanContentForPdf(getContent("pastPerformance"));
        if (ppContent) {
          doc.addPage();
          addPageHeader(solNum, comp.name);
          y = 22;
          tocEntries.push({ title: "Volume II — Past Performance", page: doc.getNumberOfPages() });
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 30, 30);
          doc.text("Volume II — Past Performance", margin, y);
          y += 10;
          y = writeMultiLine(ppContent, y, 10);
        }
      }

      // ─── CLIN PRICING (both RFQ and RFP) ───────────────
      // For RFP with Excel pricing sheet: skip detailed CLIN in PDF, add reference note
      const hasExcelPricing = !isRFQ && data.attachmentAnalysis?.pricingFormatType === "spreadsheet" && data.attachmentAnalysis?.pricingFormatUrl;

      doc.addPage();
      addPageHeader(solNum, comp.name);
      y = 22;

      const clinLabel = isRFQ ? "CLIN" : "Volume III — CLIN Pricing Schedule";
      tocEntries.push({ title: isRFQ ? "CLIN" : "Volume III — CLIN Pricing Schedule", page: doc.getNumberOfPages() });
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(clinLabel, margin, y);
      y += 8;

      if (hasExcelPricing) {
        // RFP with Excel pricing — just add a reference note, no detailed table
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        doc.text("Pricing is provided in the attached Excel pricing schedule as required by the solicitation.", margin, y);
        y += 6;
        doc.text(`Source: ${data.attachmentAnalysis?.pricingFormatSource || "Solicitation pricing spreadsheet"}`, margin, y);
      } else {

      // Try to parse structured CLIN data for table rendering
      // Use edited content first (user may have edited pricing), fallback to original draft data
      const rawClinData = getContent("clinData") || data.draft.clinData || data.draft.clinPricing || "";
      const clinGroups = parseClinData(rawClinData);

      if (clinGroups && clinGroups.length > 0) {
        // ── Render proper CLIN table with borders ──
        const colWidths = [14, 52, 18, 16, 26, 28]; // mm
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const tableX = margin;
        const rowHeight = 5;
        const subRowHeight = 3.5;

        const drawTableHeader = () => {
          doc.setFillColor(30, 41, 59); // slate-800
          doc.rect(tableX, y - 3.5, tableWidth, rowHeight + 1, "F");
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          let cx = tableX + 1;
          const headers = ["ITEM", "SUPPLIES/SERVICE", "QTY", "UNIT", "UNIT PRICE", "AMOUNT"];
          for (let i = 0; i < headers.length; i++) {
            doc.text(headers[i], cx, y);
            cx += colWidths[i];
          }
          y += rowHeight + 1;
        };

        for (const group of clinGroups) {
          // Period header (Base Year, Option Year 1, etc.)
          if (y + 20 > pageHeight - 20) {
            doc.addPage();
            addPageHeader(solNum, comp.name);
            y = 22;
          }

          doc.setFillColor(241, 245, 249); // slate-100
          doc.rect(tableX, y - 3.5, tableWidth, rowHeight + 1, "F");
          doc.setDrawColor(200, 200, 200);
          doc.rect(tableX, y - 3.5, tableWidth, rowHeight + 1, "S");
          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 30, 30);
          doc.text(group.period.toUpperCase(), tableX + 2, y);
          y += rowHeight + 2;

          // Table header row
          drawTableHeader();

          for (const item of group.items) {
            // Check if we need a new page
            if (y + 18 > pageHeight - 20) {
              doc.addPage();
              addPageHeader(solNum, comp.name);
              y = 22;
              drawTableHeader();
            }

            // Main row with item data
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(40, 40, 40);
            let cx = tableX + 1;
            doc.text(item.item, cx, y);
            cx += colWidths[0];

            doc.setFont("helvetica", "normal");
            // Truncate description to fit
            const descLines = doc.splitTextToSize(item.description, colWidths[1] - 2);
            doc.text(descLines[0], cx, y);
            cx += colWidths[1];

            doc.text(String(item.qty), cx, y);
            cx += colWidths[2];
            doc.text(item.unit, cx, y);
            cx += colWidths[3];
            doc.text(`$${item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, cx, y);
            cx += colWidths[4];
            doc.setFont("helvetica", "bold");
            doc.text(`$${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, cx, y);
            y += rowHeight;

            // Sub-row: description continuation + PSC + pricing arrangement
            doc.setFontSize(6);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100, 100, 100);
            const descMaxWidth = tableWidth - colWidths[0] - 2;
            if (descLines.length > 1) {
              const remainingDesc = descLines.slice(1).join(" ");
              const wrappedRemaining = doc.splitTextToSize(remainingDesc, descMaxWidth);
              for (const wLine of wrappedRemaining) {
                if (y + subRowHeight > pageHeight - 20) {
                  doc.addPage();
                  addPageHeader(solNum, comp.name);
                  y = 22;
                  drawTableHeader();
                }
                doc.text(wLine, tableX + colWidths[0] + 1, y);
                y += subRowHeight;
              }
            }
            doc.text(`PSC: ${item.psc} | ${item.pricingArrangement}`, tableX + colWidths[0] + 1, y);
            y += subRowHeight;

            // Light separator between items (no heavy border)
            y += 1;
          }

          // Subtotal row
          const subtotal = group.items.reduce((sum, i) => sum + i.amount, 0);
          doc.setFillColor(248, 250, 252);
          doc.rect(tableX, y - 1, tableWidth, rowHeight + 1, "F");
          doc.setDrawColor(200, 200, 200);
          doc.rect(tableX, y - 1, tableWidth, rowHeight + 1, "S");
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 30, 30);
          const subtotalX = tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3];
          doc.text("SUBTOTAL:", subtotalX, y + 2);
          doc.text(`$${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, subtotalX + colWidths[4], y + 2);
          y += rowHeight + 4;
        }

        // Grand total
        const grandTotal = clinGroups.reduce((sum, g) => sum + g.items.reduce((s, i) => s + i.amount, 0), 0);
        doc.setFillColor(30, 41, 59);
        doc.rect(tableX, y - 1, tableWidth, rowHeight + 2, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        const grandX = tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3];
        doc.text("GRAND TOTAL:", grandX, y + 2);
        doc.text(`$${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, grandX + colWidths[4], y + 2);
      } else {
        // Fallback: render pricing as plain text if structured parsing failed
        const clinText = getContent("clinData") || rawClinData;
        if (clinText) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(40, 40, 40);
          y = writeMultiLine(clinText, y, 9);
        }
      }
      } // end else (no Excel pricing)

      // ─── VOLUME IV: REPS & CERTS ───────────────────────────────
      // ─── REPS & CERTS ───────────────────────────────
      const repsContent = cleanContentForPdf(getContent("repsAndCerts"));
      if (repsContent) {
        doc.addPage();
        addPageHeader(solNum, comp.name);
        y = 28;
        const repsLabel = isRFQ ? "Representations and Certifications" : "Volume IV — Representations and Certifications";
        tocEntries.push({ title: repsLabel, page: doc.getNumberOfPages() });
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(repsLabel, pageWidth / 2, y, { align: "center" });
        y += 12;
        y = writeMultiLine(repsContent, y, 9);
      }

      // ─── NOW FILL THE TOC PAGE ────────────────────────────────
      // Go back to the TOC page and render the entries with real page numbers
      doc.setPage(tocPageNumber);
      let tocY = 28;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Contents", margin, tocY);
      tocY += 10;

      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      for (const entry of tocEntries) {
        const xOff = entry.indent ? margin + 8 : margin;
        doc.setFont("helvetica", entry.indent ? "normal" : "bold");
        const dots = ".".repeat(Math.max(5, 80 - entry.title.length));
        doc.text(`${entry.title} ${dots}`, xOff, tocY);
        doc.text(String(entry.page), pageWidth - margin, tocY, { align: "right" });
        tocY += 6;
      }
      // Add Appendix A entry (DFARS) — page unknown until merge, show as "Appended"
      doc.setFont("helvetica", "bold");
      const appendixTitle = "Appendix A — FAR/DFARS Certifications";
      const appDots = ".".repeat(Math.max(5, 80 - appendixTitle.length));
      doc.text(`${appendixTitle} ${appDots}`, margin, tocY);
      doc.text("Appended", pageWidth - margin, tocY, { align: "right" });

      // ─── MERGE SF1449 + DFARS ──────────────────────────────────
      const mainPdfBytes = doc.output("arraybuffer");
      const mainPdfDoc = await PDFDocument.load(mainPdfBytes);

      // ─── SF1449: Fetch, fill, and prepend as first page(s) ───
      const analysisData = data.attachmentAnalysis;

      if (analysisData?.sf1449Found && analysisData.sf1449SourceUrl) {
        try {
          const token = localStorage.getItem("arber_token");
          const sf1449Resp = await fetch(`${API_BASE}/draft/extract-sf1449`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              sourceUrl: analysisData.sf1449SourceUrl,
              pageIndices: analysisData.sf1449Pages || [0],
              company: data.company || {},
            }),
          });
          if (sf1449Resp.ok) {
            const sf1449Data = await sf1449Resp.json();
            if (sf1449Data.success && sf1449Data.pdfBase64) {
              // Decode base64 to bytes
              const binaryStr = atob(sf1449Data.pdfBase64);
              const sf1449Bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) {
                sf1449Bytes[i] = binaryStr.charCodeAt(i);
              }

              const sf1449Pdf = await PDFDocument.load(sf1449Bytes.buffer);
              // Copy ALL SF1449 pages (some forms span multiple pages)
              const allPageIndices = Array.from({ length: sf1449Pdf.getPageCount() }, (_, i) => i);
              const sf1449Pages = await mainPdfDoc.copyPages(sf1449Pdf, allPageIndices);

              // Insert all SF1449 pages after cover page
              for (let pi = 0; pi < sf1449Pages.length; pi++) {
                mainPdfDoc.insertPage(1 + pi, sf1449Pages[pi]);
              }

              // Overlay company info via pdf-lib using detected field positions
              {
                const { rgb: sfRgb } = await import("pdf-lib");
                const firstPage = mainPdfDoc.getPage(1); // SF1449 is now page 2 (index 1)
                const pgWidth = firstPage.getWidth();
                const pgHeight = firstPage.getHeight();

                // Use backend-detected field positions or sensible fallbacks
                const fp = sf1449Data.fieldPositions || {};
                const sfManagerName = sf1449Data.managerName || comp.managerName || comp.name || "";
                const sfJobTitle = sf1449Data.jobTitle || comp.jobTitle || "Manager";
                const dateStr = new Date().toLocaleDateString("en-US");

                if (!sf1449Data.filled) {
                  // Block 12: Discount Terms — large font, below the label
                  const b12x = fp["12_fill_x"] ?? 200;
                  const b12y = fp["12_fill_y"] ?? (pgHeight - 210);
                  firstPage.drawText("NET 30", {
                    x: b12x, y: b12y, size: 12, color: sfRgb(0, 0, 0),
                  });

                  // Block 17a: Contractor/Offeror name, address, phone, email
                  const b17x = fp["17a_fill_x"] ?? 36;
                  const b17y = fp["17a_fill_y"] ?? (pgHeight - 280);
                  firstPage.drawText(comp.name || "", {
                    x: b17x, y: b17y, size: 8, color: sfRgb(0, 0, 0),
                  });
                  if (comp.address) {
                    firstPage.drawText(comp.address, {
                      x: b17x, y: b17y - 11, size: 7, color: sfRgb(0, 0, 0),
                    });
                  }
                  if (comp.phone) {
                    firstPage.drawText(`Tel: ${comp.phone}`, {
                      x: b17x, y: b17y - 22, size: 7, color: sfRgb(0, 0, 0),
                    });
                  }
                  if (comp.email) {
                    firstPage.drawText(comp.email, {
                      x: b17x, y: b17y - 33, size: 7, color: sfRgb(0, 0, 0),
                    });
                  }

                  // Block 17a CODE box: CAGE code
                  if (comp.cageCode) {
                    const codeX = fp["17a_code_fill_x"] ?? 220;
                    // Nudge upward a bit to center better in the CODE box
                    const codeYOffset = 16;
                    const codeY = (fp["17a_code_fill_y"] ?? b17y + 10) + codeYOffset;
                    firstPage.drawText(comp.cageCode, {
                      x: codeX, y: codeY, size: 9, color: sfRgb(0, 0, 0),
                    });
                  }

                  // Block 30b: Name and Title of Signer
                  const b30bx = fp["30b_fill_x"] ?? 25;
                  const b30by = fp["30b_fill_y"] ?? 50;
                  firstPage.drawText(`${sfManagerName}, ${sfJobTitle}`, {
                    x: b30bx, y: b30by, size: 9, color: sfRgb(0, 0, 0),
                  });

                  // Block 30c: Date Signed
                  const b30cx = fp["30c_fill_x"] ?? 420;
                  const b30cy = fp["30c_fill_y"] ?? b30by;
                  firstPage.drawText(dateStr, {
                    x: b30cx, y: b30cy, size: 9, color: sfRgb(0, 0, 0),
                  });
                }

                // Block 30a: Draw signature image — fill most of the 30a box
                if (sf1449Data.signatureBase64) {
                  try {
                    const sigBytes = Uint8Array.from(atob(sf1449Data.signatureBase64), c => c.charCodeAt(0));
                    let sigImage;
                    try {
                      sigImage = await mainPdfDoc.embedPng(sigBytes);
                    } catch {
                      sigImage = await mainPdfDoc.embedJpg(sigBytes);
                    }
                    // Fit signature — fill 30a box generously, left-center
                    const boxH = fp["30a_height"] ? Number(fp["30a_height"]) : 35;
                    const targetH = Math.max(boxH, 38);
                    const targetW = targetH * 5; // wide for signature
                    const sigScale = Math.min(targetW / sigImage.width, targetH / sigImage.height);
                    const sigW = sigImage.width * sigScale;
                    const sigH = sigImage.height * sigScale;
                    // Left-center in 30a box
                    const sigX = fp["30a_fill_x"] ? Number(fp["30a_fill_x"]) : 220;
                    const sigY = fp["30a_fill_y"] ?? 65;
                    firstPage.drawImage(sigImage, {
                      x: sigX,
                      y: sigY,
                      width: sigW,
                      height: sigH,
                    });
                  } catch (sigErr) {
                    console.warn("Could not embed signature image:", sigErr);
                  }
                }
              }
            }
          }
        } catch (sfErr) {
          console.warn("Could not merge SF1449:", sfErr);
        }
      }

      // Add a separator page before DFARS
      const { rgb } = await import("pdf-lib");
      const separatorPage = mainPdfDoc.addPage([612, 792]);
      separatorPage.drawText("Appendix A", {
        x: 220, y: 450, size: 28,
        color: rgb(0.12, 0.16, 0.23),
      });
      separatorPage.drawText("FAR & DFARS Representations and Certifications", {
        x: 110, y: 410, size: 16,
        color: rgb(0.35, 0.35, 0.35),
      });
      separatorPage.drawText(`${comp.name} — SAM.gov Certified`, {
        x: 180, y: 370, size: 12,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Fetch and merge the DFARS PDF
      try {
        const dfarsResponse = await fetch("/arber-dfars.pdf");
        if (dfarsResponse.ok) {
          const dfarsBytes = await dfarsResponse.arrayBuffer();
          const dfarsPdf = await PDFDocument.load(dfarsBytes);
          const dfarsPages = await mainPdfDoc.copyPages(dfarsPdf, dfarsPdf.getPageIndices());
          for (const page of dfarsPages) {
            mainPdfDoc.addPage(page);
          }
        }
      } catch (err) {
        console.warn("Could not merge DFARS PDF:", err);
      }

      // Save merged PDF and download
      const mergedBytes = await mainPdfDoc.save();
      const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const filename = `${comp.name || "Company"}_SOL_${solNum}_Response.pdf`;

      if (mode === "preview") {
        const previewUrl = URL.createObjectURL(blob);
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        if (isMobile) {
          // Mobile browsers often block window.open for blob URLs
          window.location.href = previewUrl;
        } else {
          window.open(previewUrl, "_blank", "noopener,noreferrer");
        }
        // Delay revoke to allow the new tab/page to load the PDF
        setTimeout(() => URL.revokeObjectURL(previewUrl), 60000);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
  }, [data, getContent]);

  if (!data || !data.draft) {
    return (
      <div className="min-h-screen bg-[#eef1f4] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading draft...</p>
        </div>
      </div>
    );
  }

  const opp = data.opportunity || { title: "", agency: "", noticeId: "", naicsCode: "", dueDate: "", bidType: "" };
  const comp = data.company || { name: "", uei: "", cageCode: "", address: "", samStatus: "", businessType: "", naicsCode: "", website: "", phone: "", email: "", annualRevenue: "", employeeCount: "", certifications: [], managerName: "", jobTitle: "" };
  const encodedNoticeId = opp.noticeId ? encodeURIComponent(opp.noticeId) : "";

  // For RFQ: hide technical sections (technicalCapability, managementPlan, qualityControlPlan, pastPerformance)
  const currentBidType = (data?.opportunity?.bidType || "RFQ").toUpperCase();
  const rfqHiddenSections = ["technicalCapability", "managementPlan", "qualityControlPlan", "keyPersonnel", "staffingPlan", "pastPerformance"];
  const sections = SECTION_DEFS.filter((s) => {
    if (!getContent(s.key)) return false;
    if (currentBidType === "RFQ" && rfqHiddenSections.includes(s.key)) return false;
    return true;
  });
  const currentSection = sections[activeSection] || sections[0];

  return (
    <div className="min-h-screen bg-[#eef1f4]">
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <button
            onClick={() => { window.history.length > 1 ? window.history.back() : (window.location.href = "/proposals"); }}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs sm:text-sm mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Close Draft
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="font-bold leading-tight mb-1.5" style={{ fontSize: "clamp(1rem, 3.5vw, 1.4rem)", color: "#ffffff" }}>
                {data.opportunity?.title || data.draft.draftTitle || "RFQ Solicitation Response"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {opp.bidType || "RFQ"} RESPONSE
                </span>
                <span style={{ color: "rgba(255,255,255,0.5)" }} className="text-[10px] sm:text-xs">
                  SOL: {opp.noticeId}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Save status indicator */}
              <span className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full ${
                saveStatus === "saved" ? "text-green-300 bg-green-500/10" :
                saveStatus === "saving" ? "text-blue-300 bg-blue-500/10" :
                saveStatus === "error" ? "text-red-300 bg-red-500/10" :
                "text-amber-300 bg-amber-500/10"
              }`}>
                {saveStatus === "saved" ? <Cloud className="w-3 h-3" /> :
                 saveStatus === "saving" ? <Loader2 className="w-3 h-3 animate-spin" /> :
                 saveStatus === "error" ? <CloudOff className="w-3 h-3" /> :
                 <CloudOff className="w-3 h-3" />}
                <span className="hidden sm:inline">
                  {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : saveStatus === "error" ? "Save failed" : "Unsaved"}
                </span>
              </span>
              {draftVersion > 0 && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-white/60 border border-white/10">
                  v{draftVersion}
                </span>
              )}
              <button
                onClick={() => {
                  if (editMode) {
                    saveEdits();
                  } else {
                    setEditMode(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold border transition-colors ${
                  editMode
                    ? "bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30"
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                }`}
              >
                {editMode ? <Cloud className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                {editMode ? "Save" : "Edit"}
              </button>
              {opp.noticeId && (
                <>
                  <button
                    onClick={() => window.open(`/opportunities/saved?search=${encodedNoticeId}`, "_blank")}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
                    title={`Find solicitation ${opp.noticeId} in saved bids`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Find in Saved</span>
                    <span className="sm:hidden">Saved</span>
                  </button>
                  <button
                    onClick={() => window.open(`/opportunities?tab=archived&search=${encodedNoticeId}`, "_blank")}
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
                    title={`Find solicitation ${opp.noticeId} in archived bids`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Find in Archived</span>
                    <span className="sm:hidden">Archived</span>
                  </button>
                </>
              )}
              {draftId && (
                <button
                  onClick={() => saveAsNewVersion()}
                  disabled={saveStatus === "saving"}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-colors disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Version</span>
                </button>
              )}
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              >
                <ClipboardCopy className="w-3.5 h-3.5" />
                {copied ? "Copied!" : "Copy All"}
              </button>
              <button
                onClick={() => handleDownloadPdf("preview")}
                disabled={generatingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors disabled:opacity-40"
              >
                {generatingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{generatingPdf ? "Generating PDF..." : "Preview PDF"}</span>
                <span className="sm:hidden">{generatingPdf ? "PDF..." : "Preview"}</span>
              </button>
              <button
                onClick={() => handleDownloadPdf("download")}
                disabled={generatingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white transition-colors"
              >
                {generatingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{generatingPdf ? "Generating PDF..." : "Download PDF"}</span>
                <span className="sm:hidden">{generatingPdf ? "PDF..." : "PDF"}</span>
              </button>
            </div>
          </div>

          {/* Opportunity meta */}
          <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 sm:mt-4 text-[10px] sm:text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {opp.agency}</span>
            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> NAICS: {opp.naicsCode}</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Due: {(() => { try { return new Date(opp.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); } catch { return opp.dueDate; } })()}
            </span>
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {comp.name}</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="md:w-60 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-4">
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Proposal Sections</h3>
                {editMode && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">EDITING</span>
                )}
              </div>
              <nav className="p-1.5 sm:p-2 space-y-0.5">
                {sections.map((section, i) => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(i)}
                    className={`w-full flex items-center gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg text-left text-[11px] sm:text-xs font-medium transition-all ${
                      activeSection === i
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`shrink-0 ${activeSection === i ? "text-amber-600" : "text-slate-400"}`}>
                      {section.icon}
                    </span>
                    <span className="truncate flex-1">{section.title}</span>
                    {section.volume && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${
                        section.internalOnly
                          ? "bg-purple-100 text-purple-600 border border-purple-200"
                          : activeSection === i ? "bg-amber-200/60 text-amber-700" : "bg-slate-100 text-slate-400"
                      }`}>
                        {section.internalOnly ? "Internal" : section.volume}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Section Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                    {currentSection?.icon}
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">{currentSection?.title}</h2>
                    <p className="text-[10px] sm:text-[11px] text-slate-400">
                      {currentSection?.internalOnly ? "Internal reference — not included in PDF" : `${currentSection?.volume ? `${currentSection.volume} — ` : ""}Section ${activeSection + 1} of ${sections.length}`} {editMode && "— Click to edit"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Page count badge */}
                  {(() => {
                    const limit = getPageLimitForSection(currentSection?.key || "");
                    const pages = estimatePages(getContent(currentSection?.key || ""));
                    if (pages > 0) {
                      const overLimit = limit ? pages > limit : false;
                      return (
                        <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          overLimit ? "bg-red-50 text-red-600 border border-red-200" :
                          limit ? "bg-green-50 text-green-600 border border-green-200" :
                          "bg-slate-50 text-slate-500 border border-slate-200"
                        }`}>
                          ~{pages}{limit ? `/${limit}` : ""} pg
                          {overLimit && <AlertTriangle className="w-3 h-3 inline ml-0.5" />}
                        </span>
                      );
                    }
                    return null;
                  })()}
                  {/* Provenance info button — shows what sources were used to generate this section */}
                  {currentSection?.key && provenanceMap[currentSection.key] && (
                    <button
                      onClick={() => setProvenanceOpen(currentSection.key)}
                      className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors border border-slate-200"
                      title="See what sources were used to generate this section"
                    >
                      <Info className="w-3 h-3" /> Sources
                    </button>
                  )}
                  {/* AI Rewrite button */}
                  <button
                    onClick={() => setAiChatOpen(aiChatOpen === currentSection?.key ? null : (currentSection?.key || null))}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-colors border ${
                      aiChatOpen === currentSection?.key
                        ? "text-purple-700 bg-purple-50 border-purple-200"
                        : "text-purple-500 hover:text-purple-700 hover:bg-purple-50 border-slate-200"
                    }`}
                  >
                    <Sparkles className="w-3 h-3" /> AI Rewrite
                  </button>
                  {editMode ? (
                    <>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200">
                        <Edit3 className="w-3 h-3" /> Editing
                      </span>
                      <button
                        onClick={() => {
                          if (confirm("Delete this section? It will be removed from the draft and PDF.")) {
                            updateContent(currentSection?.key || "", "");
                            setActiveSection(Math.max(0, activeSection - 1));
                          }
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-slate-200"
                        title="Delete section (removes from draft and PDF)"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Section
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getContent(currentSection?.key || ""));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200"
                    >
                      <ClipboardCopy className="w-3 h-3" />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
              </div>

              {/* Section Content */}
              <div className="px-4 sm:px-6 py-4 sm:py-6">
                {editMode && currentSection?.key === "clinData" ? (
                  // ── CLIN section edit mode: inline editable table ──
                  (() => {
                    const sources = [
                      getContent("clinData"),
                      data?.draft?.clinData,
                      data?.draft?.clinPricing,
                    ].filter(Boolean);

                    let editGroups: ClinGroup[] | null = null;
                    for (const src of sources) {
                      editGroups = parseClinData(src || "");
                      if (editGroups && editGroups.length > 0) break;
                    }

                    if (!editGroups || editGroups.length === 0) {
                      // No parseable CLIN data — fall back to textarea
                      return (
                        <textarea
                          value={getContent("clinData")}
                          onChange={(e) => updateContent("clinData", e.target.value)}
                          className="w-full min-h-[400px] sm:min-h-[500px] p-3 sm:p-4 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-mono resize-y outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                          spellCheck={false}
                        />
                      );
                    }

                    const updateClinField = (gi: number, ii: number, field: keyof ClinItem, value: string | number) => {
                      const newGroups = editGroups!.map((g, gIdx) => ({
                        ...g,
                        items: g.items.map((item, iIdx) => {
                          if (gIdx !== gi || iIdx !== ii) return item;
                          const updated = { ...item, [field]: value };
                          if (field === "qty" || field === "unitPrice") {
                            updated.amount = (field === "qty" ? (value as number) : updated.qty) * (field === "unitPrice" ? (value as number) : updated.unitPrice);
                          }
                          return updated;
                        }),
                      }));
                      updateContent("clinData", JSON.stringify(newGroups));
                    };

                    const updatePeriod = (gi: number, value: string) => {
                      const newGroups = editGroups!.map((g, gIdx) => gIdx === gi ? { ...g, period: value } : g);
                      updateContent("clinData", JSON.stringify(newGroups));
                    };

                    const grandTotal = editGroups.reduce((s, g) => s + g.items.reduce((a, i) => a + i.amount, 0), 0);

                    return (
                      <div className="space-y-6">
                        <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          Editing mode — click any cell to modify values. Amounts auto-calculate from Qty × Unit Price.
                        </p>
                        {editGroups.map((group, gi) => {
                          const subtotal = group.items.reduce((s, i) => s + i.amount, 0);
                          return (
                            <div key={gi}>
                              <input
                                value={group.period}
                                onChange={(e) => updatePeriod(gi, e.target.value)}
                                className="text-sm font-bold text-slate-800 mb-2 px-2 py-1 rounded border border-transparent hover:border-amber-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 bg-transparent w-auto"
                              />
                              <div className="overflow-x-auto border border-amber-200 rounded-lg">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-amber-50 border-b border-amber-200">
                                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Item</th>
                                      <th className="px-3 py-2 text-left font-semibold text-slate-600">Description</th>
                                      <th className="px-3 py-2 text-center font-semibold text-slate-600">Qty</th>
                                      <th className="px-3 py-2 text-center font-semibold text-slate-600">Unit</th>
                                      <th className="px-3 py-2 text-right font-semibold text-slate-600">Unit Price</th>
                                      <th className="px-3 py-2 text-right font-semibold text-slate-600">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.items.map((item, ii) => (
                                      <tr key={ii} className={ii % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                        <td className="px-2 py-1">
                                          <input
                                            value={item.item}
                                            onChange={(e) => updateClinField(gi, ii, "item", e.target.value)}
                                            className="w-16 font-mono text-slate-700 border border-transparent hover:border-amber-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 rounded px-1 py-0.5 bg-transparent"
                                          />
                                        </td>
                                        <td className="px-2 py-1">
                                          <input
                                            value={item.description}
                                            onChange={(e) => updateClinField(gi, ii, "description", e.target.value)}
                                            className="w-full min-w-[180px] text-slate-700 border border-transparent hover:border-amber-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 rounded px-1 py-0.5 bg-transparent"
                                          />
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                          <input
                                            type="number"
                                            value={item.qty}
                                            onChange={(e) => updateClinField(gi, ii, "qty", parseFloat(e.target.value) || 0)}
                                            className="w-14 text-center text-slate-700 border border-transparent hover:border-amber-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 rounded px-1 py-0.5 bg-transparent"
                                          />
                                        </td>
                                        <td className="px-2 py-1 text-center">
                                          <input
                                            value={item.unit}
                                            onChange={(e) => updateClinField(gi, ii, "unit", e.target.value)}
                                            className="w-16 text-center text-slate-600 border border-transparent hover:border-amber-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 rounded px-1 py-0.5 bg-transparent"
                                          />
                                        </td>
                                        <td className="px-2 py-1 text-right">
                                          <input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => updateClinField(gi, ii, "unitPrice", parseFloat(e.target.value) || 0)}
                                            className="w-28 text-right font-mono text-slate-700 border border-transparent hover:border-amber-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/30 rounded px-1 py-0.5 bg-transparent"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">
                                          ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t border-slate-300 bg-slate-50">
                                      <td colSpan={5} className="px-3 py-2 text-right font-semibold text-slate-600">Subtotal</td>
                                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-end px-1">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                            <span className="text-sm font-bold text-amber-800">Grand Total: ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : editMode ? (
                  <textarea
                    value={getContent(currentSection?.key || "")}
                    onChange={(e) => updateContent(currentSection?.key || "", e.target.value)}
                    className="w-full min-h-[400px] sm:min-h-[500px] p-3 sm:p-4 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-mono resize-y outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
                    spellCheck={false}
                  />
                ) : currentSection?.key === "clinData" ? (
                  // ── CLIN section: ALWAYS try table first, never show raw array ──
                  (() => {
                    // Try every possible source to get parseable CLIN data
                    const sources = [
                      getContent("clinData"),
                      data?.draft?.clinData,
                      data?.draft?.clinPricing,
                    ].filter(Boolean);

                    let groups: ClinGroup[] | null = null;
                    for (const src of sources) {
                      groups = parseClinData(src || "");
                      if (groups && groups.length > 0) break;
                    }

                    if (groups && groups.length > 0) {
                      const grandTotal = groups.reduce((s, g) => s + g.items.reduce((a, i) => a + i.amount, 0), 0);
                      return (
                        <div className="space-y-6">
                          {groups.map((group, gi) => {
                            const subtotal = group.items.reduce((s, i) => s + i.amount, 0);
                            return (
                              <div key={gi}>
                                <h3 className="text-sm font-bold text-slate-800 mb-2 px-1">{group.period}</h3>
                                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Item</th>
                                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Description</th>
                                        <th className="px-3 py-2 text-center font-semibold text-slate-600">Qty</th>
                                        <th className="px-3 py-2 text-center font-semibold text-slate-600">Unit</th>
                                        <th className="px-3 py-2 text-right font-semibold text-slate-600">Unit Price</th>
                                        <th className="px-3 py-2 text-right font-semibold text-slate-600">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {group.items.map((item, ii) => (
                                        <tr key={ii} className={ii % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                                          <td className="px-3 py-2 font-mono text-slate-700">{item.item}</td>
                                          <td className="px-3 py-2 text-slate-700 max-w-[300px]">{item.description}</td>
                                          <td className="px-3 py-2 text-center text-slate-700">{item.qty}</td>
                                          <td className="px-3 py-2 text-center text-slate-600">{item.unit}</td>
                                          <td className="px-3 py-2 text-right font-mono text-slate-700">${item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                                          <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="border-t border-slate-300 bg-slate-50">
                                        <td colSpan={5} className="px-3 py-2 text-right font-semibold text-slate-600">Subtotal</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                          <div className="flex justify-end px-1">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                              <span className="text-sm font-bold text-amber-800">Grand Total: ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Last resort: show formatted text, NEVER raw array
                    const displayText = getContent("clinData") || "";
                    // If it still looks like raw array/JSON, force-format it
                    if (displayText.startsWith("[") || displayText.startsWith("{")) {
                      const retryGroups = parseClinData(displayText);
                      if (retryGroups) return <div className="max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm font-mono">{formatClinForDisplay(retryGroups)}</div>;
                    }
                    return <div className="max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm font-mono">{displayText}</div>;
                  })()
                ) : (
                  <div className="max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm font-mono">
                    {getContent(currentSection?.key || "")}
                  </div>
                )}

                {/* Excel Pricing Download — RFP only, when spreadsheet pricing detected */}
                {currentSection?.key === "clinData" && currentBidType !== "RFQ" && data?.attachmentAnalysis?.pricingFormatType === "spreadsheet" && data?.attachmentAnalysis?.pricingFormatUrl && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-blue-800">Pricing Spreadsheet Detected</p>
                      <p className="text-[10px] text-blue-600 mt-0.5">Source: {data.attachmentAnalysis.pricingFormatSource || "Solicitation attachment"}</p>
                    </div>
                    <button
                      onClick={handleDownloadPricingExcel}
                      disabled={excelDownloading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {excelDownloading ? "Filling..." : "Download Filled Excel"}
                    </button>
                  </div>
                )}
              </div>

              {/* AI Rewrite Drawer */}
              {aiChatOpen === currentSection?.key && (
                <div className="px-4 sm:px-6 py-4 border-t border-purple-100 bg-purple-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-bold text-purple-800">AI Rewrite — {currentSection?.title}</span>
                    </div>
                    <button onClick={() => { setAiChatOpen(null); setAiPreview(null); setAiError(null); }} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {aiError && (
                    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                      {aiError}
                    </div>
                  )}

                  {/* Chat history */}
                  {(aiHistory[currentSection?.key || ""] || []).length > 0 && (
                    <div className="max-h-32 overflow-y-auto mb-3 space-y-2">
                      {(aiHistory[currentSection?.key || ""] || []).slice(-4).map((msg, i) => (
                        <div key={i} className={`text-[11px] px-3 py-1.5 rounded-lg ${
                          msg.role === "user" ? "bg-white text-slate-600 border border-slate-200 ml-8" : "bg-purple-100 text-purple-700 mr-8"
                        }`}>
                          {msg.role === "user" ? msg.content : "AI rewrote the section based on your request."}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Preview */}
                  {aiPreview && (
                    <div className="mb-3 border border-purple-200 rounded-lg bg-white p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-purple-700 uppercase">Preview — AI Rewrite</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => applyAiRewrite(currentSection?.key || "")}
                            className="px-3 py-1 rounded-lg text-[11px] font-bold bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => setAiPreview(null)}
                            className="px-3 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-700 border border-slate-200"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto text-[11px] text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {aiPreview}
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiInstruction}
                      onChange={(e) => setAiInstruction(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiRewrite(currentSection?.key || ""); } }}
                      placeholder={currentSection?.key === "clinData" ? "e.g. Reduce Option Year 1 pricing by 8%, add clearer CLIN descriptions, keep valid pricing structure..." : "e.g. Add more detail about staffing qualifications, make it more concise..."}
                      className="flex-1 px-3 py-2 rounded-lg border border-purple-200 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-400/30 focus:border-purple-300"
                      disabled={aiLoading}
                    />
                    <button
                      onClick={() => handleAiRewrite(currentSection?.key || "")}
                      disabled={aiLoading || !aiInstruction.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-300 transition-colors"
                    >
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {aiLoading ? "Rewriting..." : "Rewrite"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Tell the AI what changes you want. It will rewrite the section and show a preview for your approval.</p>
                </div>
              )}

              {/* Section Navigation */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                  disabled={activeSection === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200"
                >
                  <ArrowLeft className="w-3 h-3" /> Previous
                </button>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                  {activeSection + 1} / {sections.length}
                </span>
                <button
                  onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                  disabled={activeSection === sections.length - 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200"
                >
                  Next <ArrowLeft className="w-3 h-3 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provenance Modal — shows what sources were used to generate the current section */}
      {provenanceOpen && provenanceMap[provenanceOpen] && (() => {
        const prov = provenanceMap[provenanceOpen];
        const sourceColor = (type: string) => {
          switch (type) {
            case "document": return "bg-blue-50 text-blue-700 border-blue-200";
            case "opportunity": return "bg-amber-50 text-amber-700 border-amber-200";
            case "company_profile": return "bg-green-50 text-green-700 border-green-200";
            case "past_performance": return "bg-purple-50 text-purple-700 border-purple-200";
            case "ai_inference": return "bg-pink-50 text-pink-700 border-pink-200";
            case "industry_standard": return "bg-slate-50 text-slate-700 border-slate-200";
            default: return "bg-slate-50 text-slate-600 border-slate-200";
          }
        };
        const sourceLabel = (type: string) => {
          switch (type) {
            case "document": return "Document";
            case "opportunity": return "Opportunity";
            case "company_profile": return "Company Profile";
            case "past_performance": return "Past Performance";
            case "ai_inference": return "AI Inference";
            case "industry_standard": return "Industry Standard";
            default: return type;
          }
        };
        return (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setProvenanceOpen(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">How this section was generated</h3>
                    <p className="text-xs text-slate-500">{prov.section_title || provenanceOpen}</p>
                  </div>
                </div>
                <button
                  onClick={() => setProvenanceOpen(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                {/* Model used */}
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Model</div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-[11px] font-medium text-indigo-700">
                    <Sparkles className="w-3 h-3" /> {prov.model_used || "gemini-2.5-pro"}
                  </span>
                </div>

                {/* Sources used */}
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Sources used ({prov.sources_used?.length || 0})
                  </div>
                  {(!prov.sources_used || prov.sources_used.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No sources recorded for this section.</p>
                  ) : (
                    <div className="space-y-2">
                      {prov.sources_used.map((src: ProvenanceSource, i: number) => (
                        <div key={i} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${sourceColor(src.type)}`}>
                              {sourceLabel(src.type)}
                            </span>
                            <span className="text-xs font-semibold text-slate-800">{src.name}</span>
                          </div>
                          {src.detail && (
                            <p className="text-[11px] text-slate-600 leading-relaxed mb-1">{src.detail}</p>
                          )}
                          {src.excerpt && (
                            <blockquote className="text-[11px] text-slate-500 italic border-l-2 border-slate-300 pl-2 mt-1.5 line-clamp-3">
                              &ldquo;{src.excerpt}&rdquo;
                            </blockquote>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section L rules followed */}
                {prov.section_l_rules_followed && prov.section_l_rules_followed.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Section L rules followed ({prov.section_l_rules_followed.length})
                    </div>
                    <ul className="space-y-1">
                      {prov.section_l_rules_followed.map((rule: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-slate-700">
                          <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Section L violations */}
                {prov.section_l_violations && prov.section_l_violations.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-red-600 uppercase tracking-wide mb-2">
                      Possible violations ({prov.section_l_violations.length})
                    </div>
                    <ul className="space-y-1">
                      {prov.section_l_violations.map((v: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-red-700">
                          <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Generation reasoning */}
                {prov.generation_reasoning && (
                  <div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Reasoning</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3">
                      {prov.generation_reasoning}
                    </p>
                  </div>
                )}

                {/* Compliance summary (shown on every modal for context) */}
                {complianceReport && (
                  <div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Overall compliance</div>
                    <div className={`text-[11px] px-3 py-2 rounded-lg border ${
                      complianceReport.overall_pass
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}>
                      {complianceReport.overall_pass ? (
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Passed {complianceReport.rules_passed}/{complianceReport.total_rules_checked} Section L rules</span>
                      ) : (
                        <span className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> {complianceReport.rules_failed} of {complianceReport.total_rules_checked} Section L rules failed</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Provenance is recorded by the V2 drafting pipeline for traceability.
                </span>
                <button
                  onClick={() => setProvenanceOpen(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-slate-800 hover:bg-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
