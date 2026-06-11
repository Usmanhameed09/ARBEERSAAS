"use client";

/**
 * App-wide toast surface for errors and successes.
 *
 * Any code — including non-React modules like src/lib/api.ts — can trigger a
 * toast by calling `notifyError(message)` / `notifySuccess(message)`. Those
 * dispatch a DOM CustomEvent that this mounted provider listens for, so there
 * is no React-context coupling and no need to thread callbacks everywhere.
 *
 * This is the global safety net: even an unhandled API failure can surface a
 * readable message to the user instead of failing silently.
 */

import { useEffect, useState, useCallback } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastKind = "error" | "success";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const EVENT_NAME = "arber:toast";

interface ToastEventDetail {
  kind: ToastKind;
  message: string;
}

/** Fire a toast from anywhere (React or plain modules). */
export function notify(kind: ToastKind, message: string) {
  if (typeof window === "undefined" || !message) return;
  window.dispatchEvent(new CustomEvent<ToastEventDetail>(EVENT_NAME, { detail: { kind, message } }));
}
export const notifyError = (message: string) => notify("error", message);
export const notifySuccess = (message: string) => notify("success", message);

let counter = 0;

export default function GlobalToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastEventDetail>).detail;
      if (!detail?.message) return;
      counter += 1;
      const id = counter;
      setToasts((prev) => [...prev, { id, kind: detail.kind, message: detail.message }]);
      // Auto-dismiss: errors linger longer than successes
      const ttl = detail.kind === "error" ? 8000 : 4000;
      window.setTimeout(() => remove(id), ttl);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, [remove]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const isError = t.kind === "error";
        return (
          <div
            key={t.id}
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 shadow-lg text-sm ${
              isError
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
            role="alert"
          >
            {isError ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
