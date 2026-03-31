"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Bookmark, Loader2, Search } from "lucide-react";
import type { Opportunity } from "@/data/opportunities";
import OpportunityCard from "@/components/OpportunityCard";
import OpportunityDetailModal from "@/components/OpportunityDetailModal";
import { fetchSavedOpportunities } from "@/lib/api";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";

function SavedOpportunitiesContent() {
  const searchParams = useSearchParams();
  const { savedIds } = useSavedOpportunities();
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [savedOpps, setSavedOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  // Fetch saved opportunities from DB on mount and when savedIds changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await fetchSavedOpportunities();
        if (!cancelled) setSavedOpps(data.opportunities || []);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [savedIds.size]);

  // When user unsaves from this page, filter them out reactively
  const visibleOpps = savedOpps.filter((opp) => savedIds.has(opp.id));
  const filteredOpps = visibleOpps.filter((opp) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      opp.noticeId.toLowerCase().includes(q) ||
      opp.title.toLowerCase().includes(q) ||
      opp.agency.toLowerCase().includes(q) ||
      opp.naicsCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-3 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              Saved Opportunities
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
              {loading ? "Loading..." : `${filteredOpps.length} of ${visibleOpps.length} opportunity${visibleOpps.length !== 1 ? "ies" : "y"} shown`}
            </p>
          </div>
        </div>

        {(loading || visibleOpps.length > 0 || !!searchQuery) && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by solicitation #, title, agency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 sm:p-16 text-center">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 mx-auto mb-3 animate-spin" />
          <p className="text-xs sm:text-sm font-medium text-gray-500">
            Loading saved opportunities...
          </p>
        </div>
      ) : filteredOpps.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredOpps.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onViewDetails={setSelectedOpp}
            />
          ))}
        </div>
      ) : visibleOpps.length > 0 && searchQuery ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 sm:p-16 text-center">
          <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
            No saved opportunities match &quot;{searchQuery}&quot;
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400">
            Try the solicitation number, agency, or title.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 sm:p-16 text-center">
          <Bookmark className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">
            No saved opportunities yet
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400">
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

export default function SavedOpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-3 sm:p-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 sm:p-16 text-center">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 mx-auto mb-3 animate-spin" />
            <p className="text-xs sm:text-sm font-medium text-gray-500">
              Loading saved opportunities...
            </p>
          </div>
        </div>
      }
    >
      <SavedOpportunitiesContent />
    </Suspense>
  );
}
