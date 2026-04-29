import { createContext, useCallback, useContext, useRef, useState } from "react";

export type ToastKind = "error" | "success" | "info";

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  toasts: Toast[];
  push: (message: string, kind?: ToastKind) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, kind }]);

      const ttl = kind === "error" ? 8000 : 4000;
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), ttl),
      );
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const KIND_STYLES: Record<ToastKind, { border: string; label: string; labelColor: string }> = {
  error: { border: "border-l-ayu-red", label: "ERR", labelColor: "text-ayu-red" },
  success: { border: "border-l-ayu-green", label: "OK", labelColor: "text-ayu-green" },
  info: { border: "border-l-ayu-cyan", label: "INFO", labelColor: "text-ayu-cyan" },
};

function ToastContainer() {
  const { toasts, dismiss } = useContext(ToastContext)!;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((toast) => {
        const s = KIND_STYLES[toast.kind];
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start gap-3
              bg-ayu-panel border border-ayu-border border-l-4 ${s.border}
              rounded px-3 py-2 min-w-64 max-w-sm
              animate-[fadeIn_0.15s_ease-out]
            `}
          >
            <span
              className={`text-[10px] font-bold tracking-widest mt-px shrink-0 ${s.labelColor}`}
            >
              {s.label}
            </span>
            <span className="text-ayu-fg text-[11px] leading-relaxed flex-1 wrap-break-words">
              {toast.message}
            </span>
            <button
              onMouseDown={() => dismiss(toast.id)}
              className="text-ayu-muted hover:text-ayu-dim text-[11px] shrink-0 mt-px transition-colors cursor-pointer"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
