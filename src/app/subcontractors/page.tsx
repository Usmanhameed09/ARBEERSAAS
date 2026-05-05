"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search, Filter, Star, Plus, Shield, Compass, Award, Globe, Phone, Mail, Loader2,
  CheckCircle2, AlertCircle, X,
} from "lucide-react";
import {
  listSubcontractors, createSubcontractor, deleteSubcontractor,
  updateSubcontractor, type SubcontractorRecord,
} from "@/lib/api";
import DiscoverSubcontractorsModal from "@/components/DiscoverSubcontractorsModal";
import { useAuth } from "@/context/AuthContext";

type StatusTab = "all" | "ready" | "preferred" | "discovered";

const SOURCE_LABEL: Record<string, string> = {
  manual: "Manual",
  usaspending_subaward: "USASpending Subaward",
  usaspending_prime: "USASpending Prime",
  sam: "SAM.gov",
  google_places: "Google Places",
};

function fmtCurrency(n?: number): string {
  if (!n || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

export default function SubcontractorsPage() {
  const { companyProfile } = useAuth();
  const [subs, setSubs] = useState<SubcontractorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedInsurance, setSelectedInsurance] = useState("All");
  const [selectedSource, setSelectedSource] = useState("All");
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSubcontractors();
      setSubs(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load subcontractors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const profileNaics = (companyProfile?.naicsCodes || []) as string[];
  // CompanyProfile stores a single companyAddress string (not split into city/state).
  // We try to extract a 2-letter state code from the end of the address as a default;
  // otherwise leave the modal fields blank for the user to fill in.
  const profileState = (() => {
    const addr = companyProfile?.companyAddress || "";
    const m = addr.match(/,\s*([A-Z]{2})\s*\d{0,5}\s*$/);
    return m ? m[1] : "";
  })();
  const profileCity = (() => {
    const addr = companyProfile?.companyAddress || "";
    const m = addr.match(/,\s*([^,]+),\s*[A-Z]{2}\s*\d{0,5}\s*$/);
    return m ? m[1].trim() : "";
  })();

  const states = useMemo(
    () => ["All", ...Array.from(new Set(subs.map((s) => s.state).filter(Boolean) as string[])).sort()],
    [subs]
  );

  const filtered = subs.filter((sub) => {
    const matchesSearch = !searchQuery ||
      sub.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.contactName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.naicsCodes || []).some((n) => n.includes(searchQuery));
    const matchesState = selectedState === "All" || sub.state === selectedState;
    const matchesInsurance = selectedInsurance === "All" || sub.insuranceStatus === selectedInsurance.toLowerCase();
    const matchesSource = selectedSource === "All" || sub.source === selectedSource;
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "ready" && sub.insuranceStatus === "verified") ||
      (activeTab === "preferred" && sub.preferred) ||
      (activeTab === "discovered" && sub.source !== "manual");
    return matchesSearch && matchesState && matchesInsurance && matchesSource && matchesTab;
  });

  const handleTogglePreferred = async (sub: SubcontractorRecord) => {
    const updated = await updateSubcontractor(sub.id, { preferred: !sub.preferred });
    if (updated) {
      setSubs((prev) => prev.map((s) => (s.id === sub.id ? updated : s)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this subcontractor from your network?")) return;
    if (await deleteSubcontractor(id)) {
      setSubs((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const tabs: { key: StatusTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: subs.length },
    { key: "ready", label: "Insurance Ready", count: subs.filter((s) => s.insuranceStatus === "verified").length },
    { key: "preferred", label: "Preferred", count: subs.filter((s) => s.preferred).length },
    { key: "discovered", label: "From Discovery", count: subs.filter((s) => s.source !== "manual").length },
  ];

  return (
    <div className="p-3 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Subcontractors</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Your trusted network — discovered from USASpending + SAM.gov, or added manually.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDiscover(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Compass className="w-4 h-4" /> Discover Subs
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Manually
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company, contact name, or NAICS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 text-sm rounded-lg pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-medium border ${
            showFilters ? "bg-[#1e2a3a] text-white border-[#1e2a3a]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-3.5 h-3.5" /> Filter
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`font-semibold ${activeTab === t.key ? "text-blue-700" : "text-gray-400 hover:text-gray-600"}`}
          >
            <span className={`${activeTab === t.key ? "text-blue-700" : "text-gray-800"} font-bold`}>{t.count}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Filter pills */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-white border border-gray-100 rounded-xl p-3">
          <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white">
            {states.map((s) => <option key={s} value={s}>{s === "All" ? "State: All" : s}</option>)}
          </select>
          <select value={selectedInsurance} onChange={(e) => setSelectedInsurance(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white">
            {["All", "Verified", "Pending", "Expired", "Unknown"].map((o) => <option key={o} value={o}>Insurance: {o}</option>)}
          </select>
          <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white">
            <option value="All">Source: All</option>
            <option value="manual">Manual</option>
            <option value="usaspending_subaward">USASpending Subaward</option>
            <option value="usaspending_prime">USASpending Prime</option>
            <option value="sam">SAM.gov</option>
            <option value="google_places">Google Places</option>
          </select>
        </div>
      )}

      {/* Loading / error */}
      {loading && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading your subcontractor network…
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg p-3 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && subs.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <Compass className="w-12 h-12 text-blue-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No subcontractors yet</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
            Use <strong>Discover Subs</strong> to pull real federal contractors from USASpending and SAM.gov by NAICS + location, or add them manually.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setShowDiscover(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg">
              <Compass className="w-4 h-4" /> Discover Subs
            </button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50">
              <Plus className="w-4 h-4" /> Add Manually
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && subs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50/80 text-left border-b border-gray-100">
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Company</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Source</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Location</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Past Federal</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">NAICS</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Contact</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500 text-[11px] uppercase">Score</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr key={sub.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0 mt-0.5">
                        {sub.company.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                          {sub.company}
                          {sub.preferred && <Shield className="w-3.5 h-3.5 text-orange-500" />}
                        </div>
                        {sub.uei && (
                          <div className="text-[10px] text-gray-400 font-mono">UEI {sub.uei}{sub.cage ? ` · CAGE ${sub.cage}` : ""}</div>
                        )}
                        {(sub.certifications || []).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {(sub.certifications || []).map((c) => (
                              <span key={c} className="px-1.5 py-0 bg-blue-50 text-blue-600 text-[9px] font-medium rounded">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {SOURCE_LABEL[sub.source] || sub.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {[sub.city, sub.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {(sub.pastFederalAwardCount || 0) > 0 ? (
                      <div className="flex items-center gap-1 text-emerald-700">
                        <Award className="w-3 h-3" />
                        {sub.pastFederalAwardCount} · {fmtCurrency(sub.pastFederalAwardTotal)}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                    {(sub.naicsCodes || []).slice(0, 2).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {sub.contactEmail ? (
                      <div className="flex items-center gap-1 text-emerald-700"><Mail className="w-3 h-3" /> {sub.contactEmail}</div>
                    ) : sub.contactPhone ? (
                      <div className="flex items-center gap-1 text-gray-700"><Phone className="w-3 h-3" /> {sub.contactPhone}</div>
                    ) : sub.website ? (
                      <a href={sub.website} target="_blank" rel="noopener" className="flex items-center gap-1 text-blue-600 hover:underline"><Globe className="w-3 h-3" /> website</a>
                    ) : (
                      <span className="text-amber-600 text-[11px]">⚠ none</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-bold text-gray-700">{sub.responseScore || 50}</div>
                    {(sub.timesEmailed || 0) > 0 && (
                      <div className="text-[10px] text-gray-400">{sub.timesEmailed} emailed · {sub.timesReplied || 0} replied</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleTogglePreferred(sub)} className={`p-1 rounded ${sub.preferred ? "text-orange-400" : "text-gray-300 hover:text-orange-400"}`} title={sub.preferred ? "Remove preferred" : "Mark preferred"}>
                        <Star className={`w-4 h-4 ${sub.preferred ? "fill-orange-400" : ""}`} />
                      </button>
                      <button onClick={() => handleDelete(sub.id)} className="p-1 text-gray-300 hover:text-red-500" title="Remove">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-sm text-gray-400">No subcontractors match your filters.</div>
          )}
        </div>
      )}

      {/* Discover modal */}
      {showDiscover && (
        <DiscoverSubcontractorsModal
          open
          onClose={() => setShowDiscover(false)}
          defaultNaics={profileNaics}
          defaultState={profileState}
          defaultCity={profileCity}
          onSaved={(n) => {
            if (n > 0) refresh();
          }}
        />
      )}

      {/* Add manual modal */}
      {showAdd && (
        <ManualAddModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); refresh(); }}
        />
      )}
    </div>
  );
}

// ─── Inline simple Add modal ──────────────────────────────────────────────

function ManualAddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    company: "", contactName: "", contactEmail: "", contactPhone: "", website: "",
    city: "", state: "", naicsCodes: "", certifications: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.company.trim()) { setError("Company name required"); return; }
    setSaving(true);
    setError(null);
    try {
      const r = await createSubcontractor({
        company: form.company.trim(),
        contactName: form.contactName.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        website: form.website.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim().toUpperCase().slice(0, 2) || undefined,
        naicsCodes: form.naicsCodes.split(/[,\s]+/).filter(Boolean),
        certifications: form.certifications.split(/[,\s]+/).filter(Boolean),
        source: "manual",
      });
      if (!r) throw new Error("save failed");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold">Add Subcontractor</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-2 text-xs">
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">Company *</label>
            <input value={form.company} onChange={(e) => update("company", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">Contact Name</label>
            <input value={form.contactName} onChange={(e) => update("contactName", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">Email</label>
            <input value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">Phone</label>
            <input value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">Website</label>
            <input value={form.website} onChange={(e) => update("website", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">City</label>
            <input value={form.city} onChange={(e) => update("city", e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">State (2-letter)</label>
            <input value={form.state} onChange={(e) => update("state", e.target.value.toUpperCase())} maxLength={2} className="w-full px-2 py-1.5 border border-slate-300 rounded" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">NAICS Codes (comma sep)</label>
            <input value={form.naicsCodes} onChange={(e) => update("naicsCodes", e.target.value)} placeholder="561730, 561740" className="w-full px-2 py-1.5 border border-slate-300 rounded" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">Certifications (comma sep)</label>
            <input value={form.certifications} onChange={(e) => update("certifications", e.target.value)} placeholder="SBA, 8a, HUBZone" className="w-full px-2 py-1.5 border border-slate-300 rounded" />
          </div>
          {error && <div className="col-span-2 text-rose-700 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {error}</div>}
        </div>
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-100">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.company.trim()} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
