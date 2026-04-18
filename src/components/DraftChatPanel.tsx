"use client";

/**
 * DraftChatPanel — ChatGPT-style assistant docked to the right of the draft
 * editor. Lets the user ask questions, request edits, upload files for
 * analysis, and apply / reject every change via diff preview.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X, Send, Paperclip, Trash2, Check, Loader2, FileText,
  Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  listChatMessages, clearChatMessages, uploadChatFile, streamDraftChat,
  type ChatMessage, type ChatUploadRecord, type ProposedChange, type ChatToolCall,
} from "@/lib/api";

export interface PendingProposal extends ProposedChange {
  tool_id?: string;
  message_index: number;
  applied: boolean;
  rejected: boolean;
}

export interface DraftChatPanelProps {
  draftId: string | null;
  open: boolean;
  onClose: () => void;
  /** Called when the user accepts a proposed section change. */
  onApplyChange: (change: ProposedChange) => Promise<void> | void;
  /** Optional: prefill the input box (used by per-section "Discuss" buttons). */
  prefill?: string | null;
  onPrefillConsumed?: () => void;
}

interface UiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolCalls: ChatToolCall[];
  proposals: PendingProposal[];
  attachments?: { file_id: string; file_name: string }[];
  streaming?: boolean;
}

function shortDiff(before: string, after: string): { added: number; removed: number } {
  const a = (before || "").split(/\s+/).filter(Boolean);
  const b = (after || "").split(/\s+/).filter(Boolean);
  return { added: Math.max(0, b.length - a.length), removed: Math.max(0, a.length - b.length) };
}

function ProposalCard({
  proposal,
  onApply,
  onReject,
}: {
  proposal: PendingProposal;
  onApply: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const stats = shortDiff(proposal.before || "", proposal.after || "");
  const labels: Record<string, string> = {
    edit_section: "Edit",
    replace_section: "Replace",
    append_to_section: "Append to",
    add_new_section: "Add new section",
    delete_section: "Delete",
    regenerate_pricing: "Regenerate pricing for",
  };
  const label = labels[proposal.kind] || proposal.kind;

  return (
    <div className="mt-2 rounded-md border border-blue-200 bg-blue-50/60">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-xs">
          <span className="font-bold text-blue-900">{label}</span>
          <span className="ml-1 font-mono text-blue-800">{proposal.section_key}</span>
          {(stats.added > 0 || stats.removed > 0) && (
            <span className="ml-2 text-[10px] text-slate-600">
              <span className="text-emerald-700">+{stats.added}</span>{" "}
              <span className="text-rose-700">−{stats.removed}</span> words
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {proposal.applied ? (
            <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100 rounded">
              APPLIED
            </span>
          ) : proposal.rejected ? (
            <span className="text-[10px] font-bold text-slate-600 px-2 py-0.5 bg-slate-200 rounded">
              REJECTED
            </span>
          ) : (
            <>
              <button
                onClick={onReject}
                className="text-[10px] font-bold text-rose-700 px-2 py-0.5 bg-white hover:bg-rose-50 border border-rose-200 rounded"
              >
                REJECT
              </button>
              <button
                onClick={onApply}
                className="text-[10px] font-bold text-white px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 rounded"
              >
                APPLY
              </button>
            </>
          )}
        </div>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-3 py-1 text-[10px] text-slate-600 hover:bg-blue-100 flex items-center gap-1 border-t border-blue-100"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Hide diff" : "Show diff"}
      </button>

      {expanded && (
        <div className="border-t border-blue-100 max-h-72 overflow-y-auto">
          {proposal.before && (
            <div className="px-3 py-1.5 bg-rose-50 border-b border-rose-100">
              <div className="text-[9px] uppercase font-bold text-rose-700 mb-1">Before</div>
              <pre className="text-[10px] text-slate-700 whitespace-pre-wrap break-words font-mono">
                {(proposal.before || "").slice(0, 1500)}
                {(proposal.before || "").length > 1500 && "…"}
              </pre>
            </div>
          )}
          {proposal.after && (
            <div className="px-3 py-1.5 bg-emerald-50">
              <div className="text-[9px] uppercase font-bold text-emerald-700 mb-1">After</div>
              <pre className="text-[10px] text-slate-700 whitespace-pre-wrap break-words font-mono">
                {(proposal.after || "").slice(0, 1500)}
                {(proposal.after || "").length > 1500 && "…"}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DraftChatPanel({
  draftId, open, onClose, onApplyChange, prefill, onPrefillConsumed,
}: DraftChatPanelProps) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [uploads, setUploads] = useState<ChatUploadRecord[]>([]);
  const [pendingFiles, setPendingFiles] = useState<{ id: string; name: string }[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Convert persisted DB messages → UiMessage shape
  const hydrate = useCallback((dbMessages: ChatMessage[]): UiMessage[] => {
    return dbMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m, idx) => {
        const toolCalls = m.tool_calls || [];
        const proposals: PendingProposal[] = toolCalls
          .map((tc) => {
            // Reconstruct proposal from tool call args/result if present
            const args = (tc.args || {}) as Record<string, unknown>;
            const sectionKey = (args.section_key as string) || "";
            const snap = m.section_snapshots?.[sectionKey];
            const kind = (
              tc.name === "edit_section" ? "edit_section" :
              tc.name === "replace_section" ? "replace_section" :
              tc.name === "append_to_section" ? "append_to_section" :
              tc.name === "add_new_section" ? "add_new_section" :
              tc.name === "delete_section" ? "delete_section" :
              tc.name === "regenerate_pricing" ? "regenerate_pricing" :
              null
            );
            if (!kind || !sectionKey) return null;
            return {
              tool_id: tc.id,
              kind,
              section_key: sectionKey,
              before: snap || "",
              after: "", // Not stored — re-shows as empty; the apply button is hidden via `applied`.
              applied: !!tc.applied,
              rejected: false,
              message_index: idx,
            } as PendingProposal;
          })
          .filter((p): p is PendingProposal => p !== null);
        return {
          id: m.id,
          role: m.role as "user" | "assistant",
          text: m.content || "",
          toolCalls,
          proposals,
          attachments: (m.attachments || []) as { file_id: string; file_name: string }[],
        };
      });
  }, []);

  // Load history on open
  useEffect(() => {
    if (!open || !draftId) return;
    let cancelled = false;
    (async () => {
      const data = await listChatMessages(draftId);
      if (cancelled) return;
      setMessages(hydrate(data.messages || []));
      setUploads(data.uploads || []);
    })();
    return () => { cancelled = true; };
  }, [open, draftId, hydrate]);

  // Apply prefill
  useEffect(() => {
    if (open && prefill) {
      setInput(prefill);
      onPrefillConsumed?.();
    }
  }, [open, prefill, onPrefillConsumed]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const handleFile = useCallback(async (file: File) => {
    if (!draftId) return;
    setUploading(true);
    setError(null);
    const result = await uploadChatFile(draftId, file);
    setUploading(false);
    if (!result.success || !result.fileId) {
      setError(result.error || "Upload failed");
      return;
    }
    setPendingFiles((prev) => [...prev, { id: result.fileId!, name: result.fileName || file.name }]);
    setUploads((prev) => [...prev, {
      id: result.fileId!,
      file_name: result.fileName || file.name,
      page_count: result.pageCount,
      created_at: new Date().toISOString(),
    }]);
  }, [draftId]);

  const handleSend = useCallback(async () => {
    if (!draftId || streaming) return;
    const text = input.trim();
    if (!text && pendingFiles.length === 0) return;

    setError(null);
    setInput("");
    const attachmentIds = pendingFiles.map((f) => f.id);
    const myAttachments = pendingFiles.map((f) => ({ file_id: f.id, file_name: f.name }));
    setPendingFiles([]);

    const userMsgIdx = messages.length;
    setMessages((prev) => [
      ...prev,
      {
        id: `tmp-u-${Date.now()}`,
        role: "user",
        text,
        toolCalls: [],
        proposals: [],
        attachments: myAttachments,
      },
      {
        id: `tmp-a-${Date.now() + 1}`,
        role: "assistant",
        text: "",
        toolCalls: [],
        proposals: [],
        streaming: true,
      },
    ]);
    const assistantMsgIdx = userMsgIdx + 1;

    setStreaming(true);
    try {
      for await (const ev of streamDraftChat({
        draftId, message: text, attachmentIds: attachmentIds.length ? attachmentIds : undefined,
      })) {
        if (ev.type === "token") {
          setMessages((prev) => {
            const next = [...prev];
            const m = next[assistantMsgIdx];
            if (m) next[assistantMsgIdx] = { ...m, text: m.text + ev.delta };
            return next;
          });
        } else if (ev.type === "tool_start") {
          setMessages((prev) => {
            const next = [...prev];
            const m = next[assistantMsgIdx];
            if (m) {
              next[assistantMsgIdx] = {
                ...m,
                toolCalls: [
                  ...m.toolCalls,
                  { id: ev.id, name: ev.name, args: ev.args, result: null, applied: false },
                ],
              };
            }
            return next;
          });
        } else if (ev.type === "tool_result") {
          setMessages((prev) => {
            const next = [...prev];
            const m = next[assistantMsgIdx];
            if (m) {
              next[assistantMsgIdx] = {
                ...m,
                toolCalls: m.toolCalls.map((tc) =>
                  tc.id === ev.id ? { ...tc, result: ev.summary } : tc,
                ),
              };
            }
            return next;
          });
        } else if (ev.type === "proposed_change") {
          const proposal: PendingProposal = {
            ...ev.change,
            tool_id: ev.tool_id,
            applied: false,
            rejected: false,
            message_index: assistantMsgIdx,
          };
          setMessages((prev) => {
            const next = [...prev];
            const m = next[assistantMsgIdx];
            if (m) next[assistantMsgIdx] = { ...m, proposals: [...m.proposals, proposal] };
            return next;
          });
        } else if (ev.type === "error") {
          setError(ev.message);
        } else if (ev.type === "done" || ev.type === "final") {
          // Stream wrapping; nothing to add
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setMessages((prev) => {
        const next = [...prev];
        const m = next[assistantMsgIdx];
        if (m) next[assistantMsgIdx] = { ...m, streaming: false };
        return next;
      });
      setStreaming(false);
    }
  }, [draftId, input, pendingFiles, streaming, messages.length]);

  const handleApply = useCallback(async (msgIdx: number, propIdx: number) => {
    const m = messages[msgIdx];
    if (!m) return;
    const p = m.proposals[propIdx];
    if (!p || p.applied || p.rejected) return;
    try {
      await onApplyChange(p);
      setMessages((prev) => {
        const next = [...prev];
        const target = next[msgIdx];
        if (target) {
          const newProps = target.proposals.slice();
          newProps[propIdx] = { ...p, applied: true };
          next[msgIdx] = { ...target, proposals: newProps };
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apply failed");
    }
  }, [messages, onApplyChange]);

  const handleReject = useCallback((msgIdx: number, propIdx: number) => {
    setMessages((prev) => {
      const next = [...prev];
      const target = next[msgIdx];
      if (!target) return prev;
      const newProps = target.proposals.slice();
      const p = newProps[propIdx];
      if (p) newProps[propIdx] = { ...p, rejected: true };
      next[msgIdx] = { ...target, proposals: newProps };
      return next;
    });
  }, []);

  const handleClear = useCallback(async () => {
    if (!draftId) return;
    if (!confirm("Clear the entire chat history for this draft?")) return;
    await clearChatMessages(draftId);
    setMessages([]);
    setUploads([]);
  }, [draftId]);

  if (!open) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-[420px] max-w-[100vw] z-40 bg-white border-l border-slate-200 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-900">Draft Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            title="Clear chat history"
            className="p-1.5 hover:bg-slate-200 rounded text-slate-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="p-1.5 hover:bg-slate-200 rounded text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-slate-500 mt-8 text-center px-6">
            <Sparkles className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            Ask anything about this draft. Request edits, paste new content, or
            drop a file (PDF / DOCX / XLSX) to have it analyzed and folded into
            the proposal. Every section change is shown as a diff that you
            approve before it lands.
          </div>
        )}

        {messages.map((m, mi) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[92%] rounded-lg px-3 py-2 text-xs ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-900"
              }`}
            >
              {m.attachments && m.attachments.length > 0 && (
                <div className="mb-1.5 flex flex-wrap gap-1">
                  {m.attachments.map((a) => (
                    <span
                      key={a.file_id}
                      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${
                        m.role === "user" ? "bg-blue-500" : "bg-slate-200"
                      }`}
                    >
                      <FileText className="w-2.5 h-2.5" />
                      {a.file_name}
                    </span>
                  ))}
                </div>
              )}

              {m.text && (
                <div className="whitespace-pre-wrap break-words">{m.text}</div>
              )}

              {m.streaming && !m.text && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking…
                </div>
              )}

              {m.toolCalls.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {m.toolCalls.map((tc) => (
                    <div
                      key={tc.id}
                      className="text-[10px] font-mono px-2 py-1 rounded bg-white/40 text-slate-700 border border-slate-300"
                    >
                      <span className="font-bold text-blue-700">{tc.name}</span>
                      {tc.result ? (
                        <span className="ml-1 text-slate-600"> ✓</span>
                      ) : (
                        <Loader2 className="ml-1 w-2.5 h-2.5 inline animate-spin" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {m.proposals.map((p, pi) => (
                <ProposalCard
                  key={`${m.id}-${pi}`}
                  proposal={p}
                  onApply={() => handleApply(mi, pi)}
                  onReject={() => handleReject(mi, pi)}
                />
              ))}
            </div>
          </div>
        ))}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-2 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 bg-slate-50 p-2">
        {pendingFiles.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {pendingFiles.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200"
              >
                <FileText className="w-2.5 h-2.5" />
                {f.name}
                <button
                  onClick={() => setPendingFiles((prev) => prev.filter((x) => x.id !== f.id))}
                  className="ml-1 text-blue-600 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.xlsx,.xls,.doc,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || streaming}
            title="Attach file"
            className="p-1.5 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask the assistant…"
            rows={2}
            className="flex-1 text-xs px-2 py-1.5 border border-slate-300 rounded resize-none focus:outline-none focus:border-blue-500"
            disabled={streaming}
          />

          <button
            onClick={handleSend}
            disabled={streaming || (!input.trim() && pendingFiles.length === 0)}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded"
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {uploads.length > 0 && (
          <div className="mt-1 text-[9px] text-slate-500">
            {uploads.length} file(s) in this conversation
          </div>
        )}
      </div>
    </div>
  );
}
