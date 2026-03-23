"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";

// const API_BASE = "https://arbersaas.duckdns.org/api";
const API_BASE = "http://localhost:8000/api";
const LOCAL_STORAGE_KEY = "arber_saved_opportunities";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("arber_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface SavedOpportunitiesContextType {
  savedIds: Set<string>;
  toggle: (id: string, noticeId: string) => void;
  isSaved: (id: string) => boolean;
  count: number;
}

const SavedOpportunitiesContext = createContext<SavedOpportunitiesContextType>({
  savedIds: new Set(),
  toggle: () => {},
  isSaved: () => false,
  count: 0,
});

export function SavedOpportunitiesProvider({ children }: { children: ReactNode }) {
  // savedIds stores frontend IDs (sam-{noticeId})
  // savedNoticeIds stores raw noticeIds for DB sync
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedNoticeIds, setSavedNoticeIds] = useState<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // 1. Load from localStorage immediately, then sync from DB
  useEffect(() => {
    // Load local cache first for instant UI
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.ids) setSavedIds(new Set(parsed.ids));
        if (parsed.noticeIds) setSavedNoticeIds(new Set(parsed.noticeIds));
      }
    } catch {}

    // Then fetch from DB (authoritative source)
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("arber_token") : null;
        if (!token) {
          initializedRef.current = true;
          return;
        }

        const resp = await fetch(`${API_BASE}/saved-opportunities/list`, {
          headers: getAuthHeaders(),
        });
        if (!resp.ok) {
          initializedRef.current = true;
          return;
        }
        const data = await resp.json();
        const dbNoticeIds: string[] = data.savedNoticeIds || [];

        // Convert noticeIds to frontend IDs
        const dbIds = new Set(dbNoticeIds.map((nid: string) => `sam-${nid}`));
        const dbNoticeSet = new Set(dbNoticeIds);

        setSavedIds(dbIds);
        setSavedNoticeIds(dbNoticeSet);

        // Update localStorage cache
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
          ids: [...dbIds],
          noticeIds: dbNoticeIds,
        }));
      } catch {
        // Keep local state if DB fails
      } finally {
        initializedRef.current = true;
      }
    })();
  }, []);

  // Persist to localStorage whenever state changes (after init)
  useEffect(() => {
    if (!initializedRef.current) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        ids: [...savedIds],
        noticeIds: [...savedNoticeIds],
      }));
    } catch {}
  }, [savedIds, savedNoticeIds]);

  const toggle = useCallback((id: string, noticeId: string) => {
    // Derive noticeId from id if not provided
    const effectiveNoticeId = noticeId || id.replace("sam-", "");

    setSavedIds((prev) => {
      const next = new Set(prev);
      const nowSaved = !next.has(id);
      if (nowSaved) {
        next.add(id);
      } else {
        next.delete(id);
      }

      // Sync to DB in background
      fetch(`${API_BASE}/saved-opportunities/toggle`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ noticeId: effectiveNoticeId, saved: nowSaved }),
      }).catch(console.error);

      return next;
    });

    setSavedNoticeIds((prev) => {
      const next = new Set(prev);
      if (next.has(effectiveNoticeId)) {
        next.delete(effectiveNoticeId);
      } else {
        next.add(effectiveNoticeId);
      }
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  return (
    <SavedOpportunitiesContext.Provider
      value={{ savedIds, toggle, isSaved, count: savedIds.size }}
    >
      {children}
    </SavedOpportunitiesContext.Provider>
  );
}

export function useSavedOpportunities() {
  return useContext(SavedOpportunitiesContext);
}
