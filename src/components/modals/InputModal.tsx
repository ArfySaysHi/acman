import { useEffect, useRef, useState } from "react";

interface ModalProps {
  title: string;
  label: string;
  hint?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export default function InputModal({
  title,
  label,
  hint,
  placeholder,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
}: ModalProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim()) onConfirm(value.trim());
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ayu-panel w-full max-w-[420px] overflow-hidden">
        <div
          className="flex items-center justify-between px-3.5 py-2.5"
          style={{ borderBottom: "1px solid var(--color-ayu-border)" }}
        >
          <span className="ayu-heading">{title}</span>
          <button
            onMouseDown={onClose}
            className="text-ayu-dim hover:text-ayu-fg text-sm leading-none cursor-pointer bg-transparent border-none"
          >
            ✕
          </button>
        </div>

        <div className="px-3.5 py-4">
          <label className="block text-[10px] font-semibold tracking-widest uppercase text-ayu-orange mb-2">
            {label}
          </label>
          <input
            ref={inputRef}
            className="ayu-input w-full"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {hint && <p className="text-[10px] text-ayu-dim mt-2">{hint}</p>}
        </div>

        <div
          className="flex justify-end gap-2 px-3.5 py-2.5"
          style={{ borderTop: "1px solid var(--color-ayu-border)" }}
        >
          <button onMouseDown={onClose} className="ayu-btn ayu-btn-ghost">
            Cancel
          </button>
          <button
            onMouseDown={() => value.trim() && onConfirm(value.trim())}
            className="ayu-btn ayu-btn-green"
            disabled={!value.trim()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
