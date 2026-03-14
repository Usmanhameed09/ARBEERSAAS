"use client";

import { useState } from "react";
import {
  Search,
  PhoneCall,
  Clock,
  Filter,
  ChevronDown,
  Play,
} from "lucide-react";
import { callLogs } from "@/data/outreach";
import type { CallLog } from "@/data/outreach";

type OutcomeFilter = "All" | "Interested" | "Not Available" | "Voicemail" | "Declined" | "Follow-up";

export default function CallLogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("All");
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  const filtered = callLogs.filter((call) => {
    const matchesSearch =
      searchQuery === "" ||
      call.contractorCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.contractorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      call.contractTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesOutcome =
      outcomeFilter === "All" || call.outcome === outcomeFilter;

    return matchesSearch && matchesOutcome;
  });

  const outcomeColors: Record<string, string> = {
    Interested: "bg-green-100 text-green-700",
    "Not Available": "bg-gray-100 text-gray-600",
    Voicemail: "bg-amber-100 text-amber-700",
    Declined: "bg-red-100 text-red-700",
    "Follow-up": "bg-blue-100 text-blue-700",
  };

  const outcomeDot: Record<string, string> = {
    Interested: "bg-green-500",
    "Not Available": "bg-gray-400",
    Voicemail: "bg-amber-400",
    Declined: "bg-red-500",
    "Follow-up": "bg-blue-500",
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Call Log</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            VAPI call summaries from contractor outreach
          </p>
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search calls by contractor or contract..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
          />
        </div>
        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value as OutcomeFilter)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-xs bg-white outline-none font-medium text-gray-600"
        >
          <option value="All">All Outcomes</option>
          <option value="Interested">Interested</option>
          <option value="Follow-up">Follow-up</option>
          <option value="Voicemail">Voicemail</option>
          <option value="Not Available">Not Available</option>
          <option value="Declined">Declined</option>
        </select>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        Showing {filtered.length} of {callLogs.length} calls
      </p>

      {/* Call list */}
      <div className="space-y-3">
        {filtered.map((call) => (
          <div
            key={call.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div
              className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
              onClick={() =>
                setExpandedCall(expandedCall === call.id ? null : call.id)
              }
            >
              <div className="w-10 h-10 rounded-full bg-[#1e2a3a] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {call.contractorCompany.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {call.contractorCompany}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${outcomeColors[call.outcome]}`}
                  >
                    {call.outcome}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {call.contractTitle}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
                <span className="flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5" />
                  {call.contractorName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {call.duration}
                </span>
                <span>{call.date} {call.time}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    expandedCall === call.id ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>

            {expandedCall === call.id && (
              <div className="px-5 pb-4 border-t border-gray-100">
                <div className="mt-3 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-blue-500" />
                    Call Summary
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {call.summary}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                  <span>
                    Phone: <span className="text-gray-600">{call.phoneNumber}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${outcomeDot[call.outcome]}`} />
                    Outcome: <span className="text-gray-600">{call.outcome}</span>
                  </span>
                  <span>
                    Duration: <span className="text-gray-600">{call.duration}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <p className="text-sm text-gray-400">No calls match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
