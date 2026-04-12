"use client";

/**
 * SectionContent — renders draft section Markdown with support for
 * inline Mermaid diagrams (```mermaid ... ``` fenced code blocks).
 *
 * Design:
 *   - Plain text segments render with the existing `whitespace-pre-wrap` style
 *   - Each mermaid block renders as an inline SVG via dynamically-loaded mermaid.js
 *   - If a diagram fails to parse, the raw source is shown inside a soft warning box
 *   - Mermaid is imported lazily so SSR + non-diagram sections pay no cost
 *
 * Content shape (persisted verbatim in section text — no schema changes):
 *
 *   Normal markdown text here.
 *
 *   ```mermaid
 *   gantt
 *       title Project Timeline
 *       ...
 *   ```
 *
 *   More text after.
 */

import { useEffect, useId, useRef, useState } from "react";

// ── Mermaid theme tuned to federal / professional proposal styling ──────────
const MERMAID_THEME = {
  theme: "base" as const,
  themeVariables: {
    // Clean corporate palette — dark navy primary, muted slate accents
    primaryColor: "#1e3a8a",        // indigo-900 (headings, active nodes)
    primaryTextColor: "#ffffff",
    primaryBorderColor: "#1e3a8a",
    secondaryColor: "#eff6ff",      // blue-50 (fills)
    secondaryTextColor: "#0f172a",  // slate-900
    tertiaryColor: "#f1f5f9",       // slate-100 (backgrounds)
    lineColor: "#475569",           // slate-600 (connectors)
    textColor: "#0f172a",
    fontFamily: "Helvetica, Arial, sans-serif",
    fontSize: "14px",
    // Gantt-specific
    ganttFontSize: "12px",
    sectionBkgColor: "#e0f2fe",     // sky-100
    altSectionBkgColor: "#f1f5f9",
    gridColor: "#cbd5e1",
    todayLineColor: "#dc2626",      // red-600
    taskBkgColor: "#1e3a8a",
    taskTextColor: "#ffffff",
    taskTextOutsideColor: "#0f172a",
    activeTaskBkgColor: "#2563eb",  // blue-600
    activeTaskBorderColor: "#1e40af",
    doneTaskBkgColor: "#94a3b8",    // slate-400
    doneTaskBorderColor: "#64748b",
    critBkgColor: "#dc2626",
    critBorderColor: "#991b1b",
  },
  securityLevel: "loose" as const,
  startOnLoad: false,
};

// Cached mermaid module (singleton)
let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      const instance = m.default;
      instance.initialize(MERMAID_THEME);
      return instance;
    });
  }
  return mermaidPromise;
}

// ── Single diagram renderer ────────────────────────────────────────────────

function MermaidBlock({ code }: { code: string }) {
  const uniqueId = useId().replace(/:/g, "-");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = await loadMermaid();
        // mermaid.render returns { svg }
        const result = await mermaid.render(`mmd-${uniqueId}`, code);
        if (!cancelled) {
          setSvg(result.svg);
          setError(null);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, uniqueId]);

  if (error) {
    return (
      <div className="my-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-800">
        <div className="font-bold mb-1">Diagram preview failed to render</div>
        <pre className="whitespace-pre-wrap font-mono text-[10px] text-amber-900">{code}</pre>
        <div className="mt-1 text-[10px] opacity-70">{error}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-mermaid-rendered="true"
      data-mermaid-source={code}
      className="my-4 flex justify-center overflow-x-auto rounded-lg border border-slate-200 bg-white p-4"
    >
      {svg ? (
        <div
          className="mermaid-svg-wrap max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="text-[11px] text-slate-400">Rendering diagram…</div>
      )}
    </div>
  );
}

// ── Parser: split Markdown text into plain + mermaid segments ──────────────

type Segment =
  | { kind: "text"; value: string }
  | { kind: "mermaid"; code: string };

function splitContent(content: string): Segment[] {
  const segments: Segment[] = [];
  const re = /```mermaid\s*\n([\s\S]*?)```/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIdx) {
      segments.push({ kind: "text", value: content.slice(lastIdx, m.index) });
    }
    segments.push({ kind: "mermaid", code: m[1].trim() });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < content.length) {
    segments.push({ kind: "text", value: content.slice(lastIdx) });
  }
  return segments;
}

// ── Public component ───────────────────────────────────────────────────────

export default function SectionContent({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const segments = splitContent(content || "");

  // Fast path — no diagrams. Keep exact original look.
  if (segments.length <= 1 && segments[0]?.kind === "text") {
    return (
      <div
        className={
          className ||
          "max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm font-mono"
        }
      >
        {content}
      </div>
    );
  }

  return (
    <div className={className || "max-w-none text-slate-700 leading-relaxed text-xs sm:text-sm"}>
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <div key={i} className="whitespace-pre-wrap font-mono leading-relaxed">
            {seg.value}
          </div>
        ) : (
          <MermaidBlock key={i} code={seg.code} />
        ),
      )}
    </div>
  );
}

// ── Helpers exported for PDF pipeline ──────────────────────────────────────

export { splitContent, loadMermaid };
export type { Segment };
