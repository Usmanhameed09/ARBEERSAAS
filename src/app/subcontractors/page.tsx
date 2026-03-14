"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Star,
  Plus,
  Shield,
} from "lucide-react";
import {
  subcontractors as initialSubs,
  TRADES,
} from "@/data/subcontractors";
import type { Subcontractor } from "@/data/subcontractors";
import AddSubcontractorModal from "@/components/AddSubcontractorModal";
import SubcontractorDetailModal from "@/components/SubcontractorDetailModal";

type StatusTab = "all" | "active" | "ready" | "verified" | "preferred";

export default function SubcontractorsPage() {
  const [subs, setSubs] = useState<Subcontractor[]>(initialSubs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState("All Trades");
  const [selectedInsurance, setSelectedInsurance] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingSub, setViewingSub] = useState<Subcontractor | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const activeCount = subs.length;
  const readyCount = subs.filter((s) => s.insuranceReady === "Verified").length;
  const preferredCount = subs.filter((s) => s.preferred).length;

  const locations = ["All", ...Array.from(new Set(subs.map((s) => s.location).filter(Boolean)))];
  const insuranceOptions = ["All", "Verified", "Pending", "Expired"];

  const filtered = subs.filter((sub) => {
    const matchesSearch =
      searchQuery === "" ||
      sub.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.contactName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTrade =
      selectedTrade === "All Trades" || sub.trade === selectedTrade;

    const matchesInsurance =
      selectedInsurance === "All" || sub.insuranceReady === selectedInsurance;

    const matchesLocation =
      selectedLocation === "All" || sub.location === selectedLocation;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "ready" && sub.insuranceReady === "Verified") ||
      (activeTab === "preferred" && sub.preferred);

    return matchesSearch && matchesTrade && matchesInsurance && matchesLocation && matchesTab;
  });

  const handleAdd = (newSub: Subcontractor) => {
    setSubs((prev) => [newSub, ...prev]);
    setShowAddModal(false);
  };

  const handleTogglePreferred = (id: string) => {
    setSubs((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, preferred: !s.preferred } : s
      )
    );
    if (viewingSub && viewingSub.id === id) {
      setViewingSub({ ...viewingSub, preferred: !viewingSub.preferred });
    }
  };

  const insuranceColors: Record<string, string> = {
    Verified: "text-green-600",
    Pending: "text-amber-500",
    Expired: "text-red-500",
  };

  const insuranceDot: Record<string, string> = {
    Verified: "bg-green-500",
    Pending: "bg-amber-400",
    Expired: "bg-red-500",
  };

  const tabs: { key: StatusTab; label: string; count: number }[] = [
    { key: "all", label: "Active", count: activeCount },
    { key: "ready", label: "Ready (COI)", count: readyCount },
    { key: "preferred", label: "Preferred", count: preferredCount },
  ];

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Subcontractors</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Subcontractor
        </button>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search all subcontractors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
            showFilters
              ? "bg-[#1e2a3a] text-white border-[#1e2a3a]"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filter
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`font-semibold transition-colors cursor-pointer ${
              activeTab === tab.key
                ? "text-blue-700"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <span className={`${activeTab === tab.key ? "text-blue-700" : "text-gray-800"} font-bold`}>
              {tab.count}
            </span>{" "}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter pills */}
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap mb-4 bg-white border border-gray-100 rounded-xl p-3">
          <select
            value={selectedTrade}
            onChange={(e) => setSelectedTrade(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white outline-none"
          >
            {TRADES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={selectedInsurance}
            onChange={(e) => setSelectedInsurance(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white outline-none"
          >
            {insuranceOptions.map((o) => (
              <option key={o} value={o}>Insurance: {o}</option>
            ))}
          </select>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white outline-none"
          >
            {locations.map((l) => (
              <option key={l} value={l}>{l === "All" ? "Location: All" : l}</option>
            ))}
          </select>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-400">
          Showing {filtered.length} of {subs.length}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-gray-50/80 text-left border-b border-gray-100">
              <th className="px-5 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                <span className="flex items-center gap-1 cursor-pointer">Trade <ChevronDown className="w-3 h-3" /></span>
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                <span className="flex items-center gap-1 cursor-pointer">Company <ChevronDown className="w-3 h-3" /></span>
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                <span className="flex items-center gap-1 cursor-pointer">Location <ChevronDown className="w-3 h-3" /></span>
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                <span className="flex items-center gap-1 cursor-pointer">Insurance Ready <ChevronDown className="w-3 h-3" /></span>
              </th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wider">
                <span className="flex items-center gap-1 cursor-pointer">Experience <ChevronDown className="w-3 h-3" /></span>
              </th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sub) => (
              <tr
                key={sub.id}
                className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
              >
                <td className="px-5 py-3 text-gray-600">{sub.trade}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">
                      {sub.company.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                        {sub.company}
                        {sub.preferred && (
                          <span title="Preferred - Always in Pipeline"><Shield className="w-3.5 h-3.5 text-orange-500" /></span>
                        )}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {sub.certifications.map((c) => (
                          <span key={c} className="px-1.5 py-0 bg-blue-50 text-blue-500 text-[9px] font-medium rounded">
                            {c}
                          </span>
                        ))}
                        {sub.source !== "Manual" && (
                          <span className="text-[9px] text-gray-400 ml-1">
                            via {sub.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{sub.location}</td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${insuranceColors[sub.insuranceReady]}`}>
                    <span className={`w-2 h-2 rounded-full ${insuranceDot[sub.insuranceReady]}`} />
                    {sub.insuranceReady}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-600">{sub.experience}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTogglePreferred(sub.id)}
                      className={`p-1 rounded transition-colors ${
                        sub.preferred
                          ? "text-orange-400 hover:text-orange-500"
                          : "text-gray-300 hover:text-orange-400"
                      }`}
                      title={sub.preferred ? "Remove from preferred" : "Set as preferred"}
                    >
                      <Star className={`w-4 h-4 ${sub.preferred ? "fill-orange-400" : ""}`} />
                    </button>
                    <button
                      onClick={() => setViewingSub(sub)}
                      className="px-3 py-1 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400">No subcontractors match your filters.</p>
          </div>
        )}
      </div>

      {/* Footer text */}
      <p className="text-xs text-gray-400 mt-3">
        Build and maintain your trusted network of <strong>subcontractors</strong>.
        Preferred contractors are automatically included in pipeline pricing.
      </p>

      {/* Modals */}
      {showAddModal && (
        <AddSubcontractorModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}

      {viewingSub && (
        <SubcontractorDetailModal
          sub={viewingSub}
          onClose={() => setViewingSub(null)}
          onTogglePreferred={handleTogglePreferred}
        />
      )}
    </div>
  );
}
