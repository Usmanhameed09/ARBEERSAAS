"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import type { Opportunity } from "@/data/opportunities";
import OpportunityCard from "@/components/OpportunityCard";
import OpportunityDetailModal from "@/components/OpportunityDetailModal";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";

export default function SavedOpportunitiesPage() {
  const { savedIds } = useSavedOpportunities();
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [allOpps, setAllOpps] = useState<Opportunity[]>([]);

  // Load all opportunities from localStorage (same source as opportunities page)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("arber_opportunities");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.opportunities?.length > 0) {
          setAllOpps(parsed.opportunities);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const savedOpps = allOpps.filter((opp) => savedIds.has(opp.id));

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <Bookmark className="w-5 h-5 text-amber-500" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Saved Opportunities
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {savedOpps.length} opportunity{savedOpps.length !== 1 ? "ies" : "y"} saved
          </p>
        </div>
      </div>

      {savedOpps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {savedOpps.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onViewDetails={setSelectedOpp}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <Bookmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 mb-1">
            No saved opportunities yet
          </p>
          <p className="text-xs text-gray-400">
            Click the star icon on any opportunity card to save it here
          </p>
        </div>
      )}

      {selectedOpp && (
        <OpportunityDetailModal
          opportunity={selectedOpp}
          onClose={() => setSelectedOpp(null)}
        />
      )}
    </div>
  );
}
