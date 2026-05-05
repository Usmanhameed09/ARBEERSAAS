"use client";

/**
 * PdfPlacementEditor — modal for fine-tuning the positions of the AI's
 * filled-form placements before downloading the final PDF.
 *
 * Flow:
 *  1. AI fills a flat/scanned PDF and returns {source_file_id, placements}.
 *  2. User clicks "Edit Positions" on the chat download card → this modal opens.
 *  3. Each placement appears as a draggable, editable box overlaid on the
 *     rendered PDF page.
 *  4. User drags / edits / deletes / adds placements, then clicks Save.
 *  5. Modal POSTs the adjusted placements to /api/draft/pdf-edit/render and
 *     swaps the chat download card to point at the new file id.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";

export interface EditorPlacement {
  id?: string;            // local-only stable id
  page: number;
  x_pct: number;          // top-left x as percentage of page width
  y_pct: number;          // top-left y as percentage of page height
  text: string;
  font_size?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  draftId: string | null;
  sourceFileId: string;             // the original blank PDF
  initialPlacements: EditorPlacement[];
  initialFileName?: string;
  /** Called with the new file_id once the user saves. */
  onSaved: (newFileId: string, newFileName: string) => void;
}

interface PageMeta { pageCount: number; width: number; height: number }

function ensureIds(list: EditorPlacement[]): EditorPlacement[] {
  return list.map((p, i) => ({ ...p, id: p.id || `p${i}-${Math.random().toString(36).slice(2, 8)}` }));
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("arber_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function PdfPlacementEditor({
  open, onClose, draftId, sourceFileId, initialPlacements, initialFileName, onSaved,
}: Props) {
  const [placements, setPlacements] = useState<EditorPlacement[]>(() => ensureIds(initialPlacements));
  const [activePage, setActivePage] = useState(1);
  const [pageMeta, setPageMeta] = useState<Record<number, PageMeta>>({});
  const [pageImages, setPageImages] = useState<Record<number, string>>({});
  const [loadingPage, setLoadingPage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offsetXPct: number; offsetYPct: number } | null>(null);

  // Reset placements when modal reopens.
  useEffect(() => {
    if (open) {
      setPlacements(ensureIds(initialPlacements));
      setActivePage(1);
      setError(null);
      setSelectedId(null);
    }
  }, [open, initialPlacements]);

  // Load the active page's image + metadata.
  useEffect(() => {
    if (!open || !sourceFileId) return;
    let cancelled = false;
    (async () => {
      setLoadingPage(true);
      setError(null);
      try {
        const url = `${API_BASE}/draft/pdf-page-image?file_id=${encodeURIComponent(sourceFileId)}&page=${activePage}&dpi=110`;
        const resp = await fetch(url, { headers: authHeaders() });
        if (!resp.ok) throw new Error(`Failed to load page (${resp.status})`);
        const pageCount = parseInt(resp.headers.get("X-Page-Count") || "1", 10);
        const width = parseFloat(resp.headers.get("X-Page-Width") || "612");
        const height = parseFloat(resp.headers.get("X-Page-Height") || "792");
        const blob = await resp.blob();
        const dataUrl = URL.createObjectURL(blob);
        if (cancelled) { URL.revokeObjectURL(dataUrl); return; }
        setPageMeta((prev) => ({ ...prev, [activePage]: { pageCount, width, height } }));
        setPageImages((prev) => {
          const old = prev[activePage];
          if (old) URL.revokeObjectURL(old);
          return { ...prev, [activePage]: dataUrl };
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load page");
      } finally {
        if (!cancelled) setLoadingPage(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activePage, open, sourceFileId]);

  // Cleanup blob URLs on unmount.
  useEffect(() => () => {
    Object.values(pageImages).forEach((u) => URL.revokeObjectURL(u));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = pageMeta[activePage]?.pageCount || 1;
  const placementsOnPage = useMemo(
    () => placements.filter((p) => p.page === activePage),
    [placements, activePage],
  );

  const updatePlacement = useCallback((id: string, patch: Partial<EditorPlacement>) => {
    setPlacements((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const deletePlacement = useCallback((id: string) => {
    setPlacements((prev) => prev.filter((p) => p.id !== id));
    setSelectedId((sid) => (sid === id ? null : sid));
  }, []);

  const addPlacement = useCallback(() => {
    const newId = `p-new-${Date.now()}`;
    setPlacements((prev) => [
      ...prev,
      { id: newId, page: activePage, x_pct: 30, y_pct: 30, text: "New text", font_size: 11 },
    ]);
    setSelectedId(newId);
  }, [activePage]);

  // ── Drag handling ──────────────────────────────────────────────────────────
  const onPointerDownItem = useCallback((e: React.PointerEvent, p: EditorPlacement) => {
    if (!p.id) return;
    e.stopPropagation();
    setSelectedId(p.id);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const pageEl = pageRef.current;
    if (!pageEl) return;
    const pageRect = pageEl.getBoundingClientRect();
    // Pointer offset from box top-left, expressed as % of page.
    const pointerXPct = ((e.clientX - pageRect.left) / pageRect.width) * 100;
    const pointerYPct = ((e.clientY - pageRect.top) / pageRect.height) * 100;
    dragRef.current = {
      id: p.id,
      offsetXPct: pointerXPct - p.x_pct,
      offsetYPct: pointerYPct - p.y_pct,
    };
  }, []);

  const onPointerMoveItem = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    const pageEl = pageRef.current;
    if (!drag || !pageEl) return;
    const pageRect = pageEl.getBoundingClientRect();
    const pointerXPct = ((e.clientX - pageRect.left) / pageRect.width) * 100;
    const pointerYPct = ((e.clientY - pageRect.top) / pageRect.height) * 100;
    let nx = pointerXPct - drag.offsetXPct;
    let ny = pointerYPct - drag.offsetYPct;
    nx = Math.max(0, Math.min(100, nx));
    ny = Math.max(0, Math.min(100, ny));
    updatePlacement(drag.id, { x_pct: nx, y_pct: ny });
  }, [updatePlacement]);

  const onPointerUpItem = useCallback((e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        draft_id: draftId,
        source_file_id: sourceFileId,
        placements: placements.map(({ id: _id, ...rest }) => rest),
        filename: initialFileName,
      };
      const resp = await fetch(`${API_BASE}/draft/pdf-edit/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(`Save failed (${resp.status})`);
      const data = await resp.json();
      if (!data.success) throw new Error(data.error || "Save failed");
      onSaved(data.file_id, data.file_name);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [draftId, sourceFileId, placements, initialFileName, onSaved, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Edit Form Field Positions</h2>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Drag any text to reposition. Click to edit content. Add or delete fields as needed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addPlacement}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-white border border-slate-300 hover:bg-slate-50"
            >
              <Plus className="w-3.5 h-3.5" /> Add Field
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Save & Use"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-200"
              aria-label="Close editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Page tabs */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 bg-white">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pn) => {
              const count = placements.filter((p) => p.page === pn).length;
              return (
                <button
                  key={pn}
                  onClick={() => setActivePage(pn)}
                  className={`px-3 py-1 text-xs rounded ${
                    activePage === pn
                      ? "bg-amber-100 text-amber-900 font-semibold border border-amber-300"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-transparent"
                  }`}
                >
                  Page {pn}
                  {count > 0 && (
                    <span className="ml-1.5 text-[10px] opacity-70">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Body: PDF canvas + side panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* PDF page with draggable overlays */}
          <div className="flex-1 overflow-auto bg-slate-200 p-4 flex items-start justify-center">
            <div
              ref={pageRef}
              className="relative bg-white shadow-md select-none"
              style={{
                width: "min(800px, 100%)",
                aspectRatio: pageMeta[activePage]
                  ? `${pageMeta[activePage].width} / ${pageMeta[activePage].height}`
                  : "8.5 / 11",
              }}
              onClick={() => setSelectedId(null)}
            >
              {pageImages[activePage] && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={pageImages[activePage]}
                  alt={`page ${activePage}`}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              )}
              {loadingPage && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}

              {/* Draggable placement overlays */}
              {placementsOnPage.map((p) => (
                <div
                  key={p.id}
                  onPointerDown={(e) => onPointerDownItem(e, p)}
                  onPointerMove={onPointerMoveItem}
                  onPointerUp={onPointerUpItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(p.id || null);
                  }}
                  className={`absolute cursor-move whitespace-pre-wrap leading-tight ${
                    selectedId === p.id
                      ? "outline outline-2 outline-amber-500 bg-amber-50/80"
                      : "outline outline-1 outline-blue-400/60 bg-blue-50/40 hover:outline-blue-500"
                  }`}
                  style={{
                    left: `${p.x_pct}%`,
                    top: `${p.y_pct}%`,
                    fontSize: `${(p.font_size || 11) * 0.85}px`,
                    fontFamily: "Helvetica, Arial, sans-serif",
                    color: "#000",
                    padding: "1px 3px",
                    minWidth: "20px",
                    maxWidth: `${100 - p.x_pct}%`,
                  }}
                >
                  {p.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: list + inspector */}
          <div className="w-80 border-l border-slate-200 bg-white flex flex-col">
            {/* Inspector for selected */}
            {selectedId && (() => {
              const sel = placements.find((p) => p.id === selectedId);
              if (!sel) return null;
              return (
                <div className="p-3 border-b border-slate-200 bg-amber-50/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[11px] font-bold text-amber-900">Selected field</div>
                    <button
                      onClick={() => deletePlacement(sel.id!)}
                      className="text-rose-600 hover:bg-rose-50 p-1 rounded"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={sel.text}
                    onChange={(e) => updatePlacement(sel.id!, { text: e.target.value })}
                    rows={3}
                    className="w-full text-xs p-2 rounded border border-slate-300 font-mono"
                  />
                  <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
                    <label className="flex flex-col">
                      <span className="text-slate-500">Page</span>
                      <input
                        type="number" min={1} max={totalPages}
                        value={sel.page}
                        onChange={(e) => updatePlacement(sel.id!, { page: parseInt(e.target.value) || 1 })}
                        className="px-1.5 py-1 rounded border border-slate-300"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-slate-500">X %</span>
                      <input
                        type="number" step={0.1} min={0} max={100}
                        value={sel.x_pct.toFixed(1)}
                        onChange={(e) => updatePlacement(sel.id!, { x_pct: parseFloat(e.target.value) || 0 })}
                        className="px-1.5 py-1 rounded border border-slate-300"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-slate-500">Y %</span>
                      <input
                        type="number" step={0.1} min={0} max={100}
                        value={sel.y_pct.toFixed(1)}
                        onChange={(e) => updatePlacement(sel.id!, { y_pct: parseFloat(e.target.value) || 0 })}
                        className="px-1.5 py-1 rounded border border-slate-300"
                      />
                    </label>
                    <label className="flex flex-col col-span-3">
                      <span className="text-slate-500">Font size</span>
                      <input
                        type="number" min={6} max={32}
                        value={sel.font_size || 11}
                        onChange={(e) => updatePlacement(sel.id!, { font_size: parseInt(e.target.value) || 11 })}
                        className="px-1.5 py-1 rounded border border-slate-300"
                      />
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* All placements list */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-2 text-[11px] font-bold text-slate-700 sticky top-0 bg-white border-b border-slate-200">
                All fields ({placements.length}) — page {activePage}: {placementsOnPage.length}
              </div>
              {placements.length === 0 && (
                <div className="px-3 py-4 text-xs text-slate-500">No fields yet — click Add Field to start.</div>
              )}
              {placements.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setActivePage(p.page); setSelectedId(p.id || null); }}
                  className={`block w-full text-left px-3 py-1.5 text-xs border-b border-slate-100 hover:bg-slate-50 ${
                    selectedId === p.id ? "bg-amber-50" : ""
                  }`}
                >
                  <span className="text-[10px] font-mono text-slate-500">p{p.page}</span>
                  <span className="ml-2 text-slate-800">{p.text.slice(0, 40)}{p.text.length > 40 ? "…" : ""}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
