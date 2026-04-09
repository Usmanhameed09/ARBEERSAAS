/**
 * API client for ARBER FastAPI backend.
 * Two-phase pipeline: Scan (fast metadata) → Analyze (AI pipeline via SSE).
 * Persists data to Supabase DB via backend endpoints.
 */

import type { Opportunity } from "@/data/opportunities";

export const API_BASE = "https://arbersaas.duckdns.org/api";
// export const API_BASE = "http://localhost:8000/api";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("arber_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ============================================================================
// Phase 1: SCAN — Fast SAM.gov metadata lookup + DB cross-reference
// ============================================================================

export interface ScanOpportunity {
  noticeId: string;
  title: string;
  agency: string;
  naicsCode: string;
  postedDate: string;
  dueDate: string;
  setAside: string;
  placeOfPerformance: string;
  type: string;
  isNew: boolean;
  existingStatus: string | null;
}

export interface ScanResult {
  totalOnSam: number;
  found: number;
  newCount: number;
  existingCount: number;
  opportunities: ScanOpportunity[];
}

/** Phase 1: Scan SAM.gov and cross-ref with DB to find new vs existing. */
export async function scanSamGov(
  naicsCodes: string[],
  noticeTypes: string = "k,o,p",
  setAside: string = "",
  limit: number = 50,
  dateRange: string = "3months",
  minDaysUntilDue: number = 14,
): Promise<ScanResult> {
  const resp = await fetch(`${API_BASE}/pipeline/scan`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ naicsCodes, noticeTypes, setAside, limit, dateRange, minDaysUntilDue }),
  });
  if (!resp.ok) {
    throw new Error(`Scan failed: ${resp.status}`);
  }
  return resp.json();
}

// ============================================================================
// Phase 2: ANALYZE — AI pipeline via SSE streaming
// ============================================================================

export interface StreamCallbacks {
  onMeta: (totalOnSam: number, totalToProcess: number) => void;
  onOpportunity: (opportunity: Opportunity, progress: number) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

/**
 * Phase 2: Stream opportunities through AI pipeline via SSE.
 * When noticeIds is provided, only those specific opportunities are processed.
 * Each opportunity is saved to DB by the backend immediately (reload-safe).
 *
 * Returns an abort function to cancel the stream.
 */
export function streamOpportunities(
  naicsCodes: string[],
  limit: number = 50,
  callbacks: StreamCallbacks,
  offset: number = 0,
  noticeTypes: string = "k,o,p",
  setAside: string = "",
  noticeIds?: string[],
  dateRange: string = "3months",
  minDaysUntilDue: number = 14,
): () => void {
  const naicsParam = naicsCodes.join(",");
  let url = `${API_BASE}/test-pipeline/stream?naics=${encodeURIComponent(naicsParam)}&limit=${limit}&offset=${offset}&notice_types=${encodeURIComponent(noticeTypes)}&date_range=${encodeURIComponent(dateRange)}&min_days=${minDaysUntilDue}`;
  if (setAside) url += `&set_aside=${encodeURIComponent(setAside)}`;
  if (noticeIds && noticeIds.length > 0) {
    url += `&notice_ids=${encodeURIComponent(noticeIds.join(","))}`;
  }

  const abortController = new AbortController();

  (async () => {
    try {
      const response = await fetch(url, {
        signal: abortController.signal,
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        callbacks.onError(`Backend error: ${response.status}`);
        callbacks.onDone();
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError("No response body");
        callbacks.onDone();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (end with \n\n)
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "meta") {
              callbacks.onMeta(data.totalOnSam, data.totalToProcess);
            } else if (data.type === "opportunity") {
              callbacks.onOpportunity(data.opportunity, data.progress);
            } else if (data.type === "error") {
              callbacks.onError(data.message);
            } else if (data.type === "done") {
              callbacks.onDone();
            }
          } catch {
            // Skip malformed SSE messages
          }
        }
      }

      // In case "done" wasn't received
      callbacks.onDone();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      callbacks.onError(err instanceof Error ? err.message : "Unknown error");
      callbacks.onDone();
    }
  })();

  return () => abortController.abort();
}

// ============================================================================
// DB Persistence API (auth-protected)
// ============================================================================

/** Load all opportunities from Supabase (auth token identifies user) */
export async function loadOpportunitiesFromDB(
  _userId: string,
): Promise<{ opportunities: Opportunity[] }> {
  const resp = await fetch(`${API_BASE}/opp-store/load`, {
    headers: getAuthHeaders(),
  });
  return resp.json();
}

/** Delete a single archived opportunity by noticeId */
export async function deleteArchivedOpportunity(noticeId: string): Promise<{ success: boolean }> {
  const resp = await fetch(`${API_BASE}/opp-store/delete/${encodeURIComponent(noticeId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return resp.json();
}

/** Delete all archived (non-saved) opportunities */
export async function clearArchivedOpportunities(): Promise<{ success: boolean; deleted: number }> {
  const resp = await fetch(`${API_BASE}/opp-store/clear-archived`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return resp.json();
}

/** Download opportunity attachments as a ZIP generated by the backend. */
export async function downloadOpportunityDocuments(opportunity: Opportunity): Promise<void> {
  const resp = await fetch(`${API_BASE}/opportunities/download-docs`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      noticeId: opportunity.noticeId,
      attachments: opportunity.attachments,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Download failed: ${resp.status}`);
  }

  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${opportunity.noticeId || "opportunity"}_documents.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Save fetch pagination state (auth token identifies user) */
export async function saveFetchState(
  _userId: string,
  state: { fetchOffset: number; totalOnSam: number; lastFetchTime: string; naicsCodes: string[] },
): Promise<void> {
  await fetch(`${API_BASE}/opp-store/save-fetch-state`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(state),
  });
}

/** Fetch full saved opportunities from DB */
export async function fetchSavedOpportunities(): Promise<{ opportunities: Opportunity[] }> {
  const resp = await fetch(`${API_BASE}/saved-opportunities/full`, {
    headers: getAuthHeaders(),
  });
  if (!resp.ok) return { opportunities: [] };
  return resp.json();
}

// ============================================================================
// RFQ Draft Generation
// ============================================================================

export interface DraftResult {
  success: boolean;
  draft?: {
    coverPage: string;
    coverLetter: string;
    companyProfile: string;
    complianceMatrix: string;
    technicalCapability: string;
    managementPlan: string;
    qualityControlPlan: string;
    pastPerformance: string;
    clinData: string;
    repsAndCerts: string;
    draftTitle: string;
    rawText?: string;
    // Legacy fields for backward compatibility
    clinPricing?: string;
    technicalResponse?: string;
  };
  opportunity?: {
    title: string;
    agency: string;
    noticeId: string;
    naicsCode: string;
    dueDate: string;
    bidType: string;
  };
  company?: {
    name: string;
    uei: string;
    cageCode: string;
    address?: string;
    samStatus?: string;
    businessType?: string;
    naicsCode?: string;
    website?: string;
    phone?: string;
    email?: string;
    annualRevenue?: string;
    employeeCount?: string;
    certifications?: string[];
    managerName?: string;
    jobTitle?: string;
  };
  attachmentAnalysis?: {
    sf1449Found: boolean;
    sf1449Source?: string;
    sf1449Pages?: number[];
    sf1449SourceUrl?: string;
    pricingFormatFound: boolean;
    pricingFormatSource?: string;
    pricingFormatType?: string;
    pricingFormatUrl?: string;
  };
  error?: string;
}

// ============================================================================
// V2 DRAFT RESPONSE — provenance + compliance types
// ============================================================================

export interface ProvenanceSource {
  type: "document" | "opportunity" | "company_profile" | "past_performance" | "ai_inference" | "industry_standard" | string;
  name: string;
  excerpt?: string;
  detail?: string;
}

export interface SectionProvenance {
  section_key: string;
  section_title: string;
  sources_used: ProvenanceSource[];
  section_l_rules_followed: string[];
  section_l_violations: string[];
  model_used: string;
  generation_reasoning: string;
  token_count: number;
}

export interface ComplianceViolation {
  rule: string;
  section: string;
  severity: "critical" | "high" | "medium" | "low" | string;
  detail: string;
}

export interface ComplianceVerification {
  overall_pass: boolean;
  total_rules_checked: number;
  rules_passed: number;
  rules_failed: number;
  violations: ComplianceViolation[];
  notes: string;
}

export interface DocAnalysisSummary {
  name: string;
  type: string;
  summary: string;
  pageCount: number;
  taskCount: number;
  clinCount: number;
  hasSectionL: boolean;
  hasSectionM: boolean;
  errors: string[];
}

export interface DraftResultV2 extends DraftResult {
  provenance?: Record<string, SectionProvenance>;
  compliance?: ComplianceVerification | null;
  docAnalyses?: DocAnalysisSummary[];
  errors?: string[];
  pricingExcel?: { base64: string; filename: string; generated: boolean };
}

/** V2 pipeline: Gemini 2.5 Pro per-document readers + section writers + compliance verifier */
export async function generateDraftV2(
  opportunity: Opportunity,
  selectedPricing?: "low" | "recommended" | "high",
): Promise<DraftResultV2> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20 * 60 * 1000); // 20 min timeout for v2
  try {
    const resp = await fetch(`${API_BASE}/generate-draft-v2`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ opportunity, selectedPricing: selectedPricing || "recommended" }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return { success: false, error: `Request failed: ${resp.status} ${text.slice(0, 200)}` };
    }
    const data = await resp.json();
    console.log("[generateDraftV2] Response keys:", Object.keys(data));
    console.log("[generateDraftV2] Draft keys:", data.draft ? Object.keys(data.draft) : "NO DRAFT");
    console.log("[generateDraftV2] Provenance sections:", data.provenance ? Object.keys(data.provenance) : "NONE");
    return data;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { success: false, error: "Request timed out after 20 minutes. Please try again." };
    }
    console.error("[generateDraftV2] Fetch error:", err);
    return { success: false, error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

/** Generate an RFQ proposal draft via GPT-4o */
export async function generateDraft(opportunity: Opportunity, selectedPricing?: "low" | "recommended" | "high"): Promise<DraftResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15 * 60 * 1000); // 15 min timeout
  try {
    const resp = await fetch(`${API_BASE}/generate-draft`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ opportunity, selectedPricing: selectedPricing || "recommended" }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return { success: false, error: `Request failed: ${resp.status} ${text.slice(0, 200)}` };
    }
    const data = await resp.json();
    console.log("[generateDraft] Response keys:", Object.keys(data));
    console.log("[generateDraft] Draft keys:", data.draft ? Object.keys(data.draft) : "NO DRAFT");
    return data;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { success: false, error: "Request timed out after 15 minutes. Please try again." };
    }
    console.error("[generateDraft] Fetch error:", err);
    return { success: false, error: `Network error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ============================================================================
// DRAFT WORKSPACE
// ============================================================================

export interface SavedDraft {
  id: string;
  title: string;
  agency: string;
  notice_id: string;
  due_date: string | null;
  status: string;
  overall_progress: number;
  last_modified: string;
  created_at: string;
  version: number;
  bidType?: string | null;
}

export interface PageLimit {
  volume: string;
  maxPages: number | null;
  source: string;
  isDefault?: boolean;
}

export interface FormattingReq {
  requirement: string;
  source: string;
}

/** Save or update a draft */
export async function saveDraft(payload: {
  draftId?: string | null;
  sectionsJson: Record<string, string>;
  opportunityJson: Record<string, unknown>;
  companyJson: Record<string, unknown>;
  title?: string;
  pageLimits?: PageLimit[];
  formattingRequirements?: FormattingReq[];
  createNewVersion?: boolean;
}): Promise<{ success: boolean; draftId?: string; version?: number; savedAt?: string; error?: string }> {
  const resp = await fetch(`${API_BASE}/drafts/save`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return resp.json();
}

/** List all drafts for current user */
export async function listDrafts(): Promise<{ success: boolean; drafts: SavedDraft[] }> {
  const resp = await fetch(`${API_BASE}/drafts`, { headers: getAuthHeaders() });
  return resp.json();
}

/** Load a single draft by ID */
export async function loadDraft(draftId: string): Promise<DraftResult & { draftId?: string; pageLimits?: PageLimit[]; formattingRequirements?: FormattingReq[]; lastModified?: string }> {
  const resp = await fetch(`${API_BASE}/drafts/${draftId}`, { headers: getAuthHeaders() });
  return resp.json();
}

/** Delete a draft */
export async function deleteDraft(draftId: string): Promise<{ success: boolean; error?: string }> {
  const resp = await fetch(`${API_BASE}/drafts/${draftId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return resp.json();
}

/** AI rewrite a specific section */
export async function rewriteSection(payload: {
  sectionKey: string;
  sectionContent: string;
  instruction: string;
  conversationHistory?: { role: string; content: string }[];
  opportunityContext?: Record<string, unknown>;
  pageLimit?: number | null;
}): Promise<{ success: boolean; rewrittenContent?: string; assistantMessage?: string; error?: string }> {
  const resp = await fetch(`${API_BASE}/draft/rewrite-section`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return resp.json();
}

/** Extract page limits from solicitation */
export async function extractPageLimits(payload: {
  description: string;
  bidType: string;
  naicsCode?: string;
}): Promise<{ success: boolean; pageLimits: PageLimit[]; formattingRequirements: FormattingReq[]; hasExplicitLimits: boolean }> {
  const resp = await fetch(`${API_BASE}/draft/extract-page-limits`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return resp.json();
}

// ============================================================================

/** Load fetch pagination state (auth token identifies user) */
export async function loadFetchState(
  _userId: string,
): Promise<{ fetchOffset: number; totalOnSam: number; lastFetchTime: string | null }> {
  const resp = await fetch(`${API_BASE}/opp-store/load-fetch-state`, {
    headers: getAuthHeaders(),
  });
  return resp.json();
}
