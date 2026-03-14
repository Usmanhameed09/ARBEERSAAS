/**
 * API client for ARBER FastAPI backend.
 * Two-phase pipeline: Scan (fast metadata) → Analyze (AI pipeline via SSE).
 * Persists data to Supabase DB via backend endpoints.
 */

import type { Opportunity } from "@/data/opportunities";

const API_BASE = "https://arbersaas.duckdns.org/api";

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
): Promise<ScanResult> {
  const resp = await fetch(`${API_BASE}/pipeline/scan`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ naicsCodes, noticeTypes, setAside, limit, dateRange }),
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
): () => void {
  const naicsParam = naicsCodes.join(",");
  let url = `${API_BASE}/test-pipeline/stream?naics=${encodeURIComponent(naicsParam)}&limit=${limit}&offset=${offset}&notice_types=${encodeURIComponent(noticeTypes)}&date_range=${encodeURIComponent(dateRange)}`;
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

/** Load fetch pagination state (auth token identifies user) */
export async function loadFetchState(
  _userId: string,
): Promise<{ fetchOffset: number; totalOnSam: number; lastFetchTime: string | null }> {
  const resp = await fetch(`${API_BASE}/opp-store/load-fetch-state`, {
    headers: getAuthHeaders(),
  });
  return resp.json();
}
