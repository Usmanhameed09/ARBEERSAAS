"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

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

export function SavedOpportunitiesProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

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
