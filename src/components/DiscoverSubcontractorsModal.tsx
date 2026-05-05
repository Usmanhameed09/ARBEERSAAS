"use client";

/**
 * DiscoverSubcontractorsModal — find candidate subs from real federal data.
 *
 * 4 sources, ranked by signal quality:
 *   Tier 1 (Past Federal Subs) — USASpending sub-awards
 *   Tier 2 (Past Prime Winners) — USASpending prime awards
 *   Tier 3 (Registered Vendors) — SAM.gov entity search
 *   Tier 4 (Local Businesses) — Google Places (only if user has Places key + trade keyword)
 *
 * User picks NAICS + location → backend runs all sources in parallel + enriches +
 * dedupes → results shown in 4 tabs → user checks the ones to save to network.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search, Loader2, Award, Building2, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import {
  discoverSubcontractors,
  saveDiscoveredSubs,
  type DiscoveredSubItem,
  type DiscoverResponse,
} from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultNaics?: string[];     // pre-fill from opportunity context
  defaultState?: string;
  defaultCity?: string;
  defaultTrade?: string;
  onSaved?: (count: number) => void;
}

type TabKey = "merged" | "subawards" | "primes" | "sam" | "places";

const TAB_LABELS: Record<TabKey, string> = {
  merged: "All (de-duped)",
  subawards: "Past Federal Subs",
  primes: "Past Prime Winners",
  sam: "Registered Vendors",
  places: "Local Businesses",
};

const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  usaspending_subaward: { label: "Subaward", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  usaspending_prime: { label: "Prime", color: "bg-blue-100 text-blue-800 border-blue-300" },
  sam: { label: "SAM.gov", color: "bg-purple-100 text-purple-800 border-purple-300" },
  google_places: { label: "Local", color: "bg-amber-100 text-amber-800 border-amber-300" },
};

function fmtCurrency(n?: number | null): string {
  if (!n || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function fmtYear(s?: string | null): string {
  if (!s) return "—";
  return s.slice(0, 4);
}

function rowKey(it: DiscoveredSubItem): string {
  return it.uei
    ? `uei:${it.uei}`
    : `name:${(it.company || "").toLowerCase()}|st:${(it.state || "").toUpperCase()}`;
}

export default function DiscoverSubcontractorsModal({
  open, onClose, defaultNaics = [], defaultState = "", defaultCity = "", defaultTrade = "", onSaved,
}: Props) {
  const [naicsInput, setNaicsInput] = useState(defaultNaics.join(", "));
  const [state, setState] = useState(defaultState);
  const [city, setCity] = useState(defaultCity);
  const [trade, setTrade] = useState(defaultTrade);
  const [monthsBack, setMonthsBack] = useState(36);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DiscoverResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("merged");
  const [selected, setSelected] = useState<Record<string, DiscoveredSubItem>>({});
  const [saving, setSaving] = useState(false);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setNaicsInput(defaultNaics.join(", "));
    setState(defaultState);
    setCity(defaultCity);
    setTrade(defaultTrade);
    setResults(null);
    setSelected({});
    setError(null);
  }, [open, defaultNaics, defaultState, defaultCity, defaultTrade]);

  const runDiscovery = useCallback(async () => {
    const naicsCodes = naicsInput.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (naicsCodes.length === 0) { setError("Enter at least one NAICS code"); return; }
    if (!state) { setError("Select a state"); return; }
    setError(null);
    setLoading(true);
    try {
      const r = await discoverSubcontractors({
        naicsCodes,
        state,
        city: city || undefined,
        tradeKeyword: trade || undefined,
        monthsBack,
      });
      if (!r.success) {
        setError(r.error || "Discovery failed");
        setResults(null);
      } else {
        setResults(r);
        setActiveTab("merged");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Discovery failed");
    } finally {
      setLoading(false);
    }
  }, [naicsInput, state, city, trade, monthsBack]);

  const tabItems = useMemo<DiscoveredSubItem[]>(() => {
    if (!results) return [];
    return (results[activeTab] || []) as DiscoveredSubItem[];
  }, [results, activeTab]);

  const toggleSelected = (it: DiscoveredSubItem) => {
    if (it.alreadyInNetwork) return;
    const k = rowKey(it);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[k]) delete next[k];
      else next[k] = it;
      return next;
    });
  };

  const selectedCount = Object.keys(selected).length;

  const handleSave = useCallback(async () => {
    const items = Object.values(selected);
    if (items.length === 0) return;
    setSaving(true);
    try {
      const r = await saveDiscoveredSubs(items);
      if (r) {
        onSaved?.(r.savedCount);
        onClose();
      } else {
        setError("Save failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [selected, onSaved, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal((
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-lg shadow-2xl w-full max-w-[1400px] h-[100vh] sm:h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Find Subcontractors</h2>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Search USASpending, SAM.gov, and Google Places for candidates by NAICS + location.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={selectedCount === 0 || saving}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Save {selectedCount > 0 ? `(${selectedCount})` : ""} to Network
            </button>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-200" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 px-3 py-3 border-b border-slate-200 bg-white">
          <input
            value={naicsInput}
            onChange={(e) => setNaicsInput(e.target.value)}
            placeholder="NAICS codes (comma sep) e.g. 561730, 561740"
            className="md:col-span-2 px-2.5 py-1.5 text-xs rounded border border-slate-300"
          />
          <input
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="State (e.g. MN)"
            className="px-2.5 py-1.5 text-xs rounded border border-slate-300"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (optional)"
            className="px-2.5 py-1.5 text-xs rounded border border-slate-300"
          />
          <input
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            placeholder="Trade keyword (e.g. lawn maintenance)"
            className="px-2.5 py-1.5 text-xs rounded border border-slate-300"
          />
          <button
            onClick={runDiscovery}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {loading ? "Searching..." : "Discover"}
          </button>
        </div>

        {error && (
          <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        {/* Results tabs */}
        {results && (
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 bg-white overflow-x-auto">
            {(Object.keys(TAB_LABELS) as TabKey[]).map((k) => {
              const count = (results[k] || []).length;
              return (
                <button
                  key={k}
                  onClick={() => setActiveTab(k)}
                  className={`shrink-0 px-3 py-1 text-xs rounded whitespace-nowrap ${
                    activeTab === k
                      ? "bg-blue-100 text-blue-900 font-semibold border border-blue-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-transparent"
                  }`}
                >
                  {TAB_LABELS[k]} <span className="ml-1 text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Results table */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Searching federal data sources…
            </div>
          )}
          {!loading && !results && (
            <div className="px-6 py-12 text-center text-sm text-slate-500 max-w-2xl mx-auto">
              <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              Enter NAICS codes + state above and click Discover.
              <div className="mt-2 text-[11px] text-slate-400">
                Trade keyword is optional — used only for Google Places search of local businesses.
              </div>
            </div>
          )}
          {!loading && results && tabItems.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No results in this tab. Try other tabs or broaden NAICS / location.
            </div>
          )}
          {!loading && tabItems.length > 0 && (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left text-slate-600 border-b border-slate-200">
                  <th className="px-2 py-2 w-10"></th>
                  <th className="px-2 py-2">Company</th>
                  <th className="px-2 py-2">Source</th>
                  <th className="px-2 py-2">Location</th>
                  <th className="px-2 py-2">Past Federal</th>
                  <th className="px-2 py-2">Contact</th>
                  <th className="px-2 py-2">Certifications</th>
                </tr>
              </thead>
              <tbody>
                {tabItems.map((it, i) => {
                  const k = rowKey(it);
                  const checked = !!selected[k];
                  const inNet = it.alreadyInNetwork;
                  const badge = SOURCE_BADGE[it.source] || { label: it.source, color: "bg-slate-100 text-slate-700 border-slate-300" };
                  return (
                    <tr
                      key={`${k}-${i}`}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${inNet ? "opacity-60" : ""} ${checked ? "bg-emerald-50/40" : ""}`}
                      onClick={() => toggleSelected(it)}
                    >
                      <td className="px-2 py-2">
                        {inNet ? (
                          <span title="Already in your network" className="text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <input type="checkbox" checked={checked} onChange={() => toggleSelected(it)} onClick={(e) => e.stopPropagation()} />
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="font-semibold text-slate-900">{it.company}</div>
                        {it.uei && <div className="text-[10px] text-slate-500 font-mono">UEI {it.uei}{it.cage ? ` · CAGE ${it.cage}` : ""}</div>}
                      </td>
                      <td className="px-2 py-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.color}`}>{badge.label}</span>
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {[it.city, it.state].filter(Boolean).join(", ") || "—"}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {(it.past_federal_award_count || 0) > 0 ? (
                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3 text-emerald-600" />
                            <span>{it.past_federal_award_count} · {fmtCurrency(it.past_federal_award_total)} · last {fmtYear(it.last_federal_award_date)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-700">
                        {it.email ? (
                          <span className="text-emerald-700">{it.email}</span>
                        ) : it.phone ? (
                          <span className="text-slate-700">📞 {it.phone}</span>
                        ) : (
                          <span className="text-amber-600 text-[11px]">⚠ no contact</span>
                        )}
                        {it.contact_name && <div className="text-[10px] text-slate-500">{it.contact_name}</div>}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(it.certifications || []).map((c) => (
                            <span key={c} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{c}</span>
                          ))}
                        </div>
                        {(!it.certifications || it.certifications.length === 0) && it.business_type && (
                          <span className="text-[10px] text-slate-500">{it.business_type}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {results && (
          <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-600 flex items-center gap-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>{(results.merged || []).length} unique candidates across {Object.keys(TAB_LABELS).length - 1} sources</span>
            <span className="ml-auto">{selectedCount} selected</span>
          </div>
        )}
      </div>
    </div>
  ), document.body);
}
