"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface SavedOpportunitiesContextType {
  savedIds: Set<string>;
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
  count: number;
}

const SavedOpportunitiesContext = createContext<SavedOpportunitiesContextType>({
  savedIds: new Set(),
  toggle: () => {},
  isSaved: () => false,
  count: 0,
});

const STORAGE_KEY = "arber_saved_opportunities";

export function SavedOpportunitiesProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist to localStorage whenever savedIds changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...savedIds]));
    } catch { /* ignore */ }
  }, [savedIds]);

  const toggle = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
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
