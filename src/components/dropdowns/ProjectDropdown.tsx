import { useState, useRef, useEffect } from "react";

interface Props {
  projects: string[];
  selected: string | null;
  onSelect: (project: string) => void;
  disabled?: boolean;
}

export default function ProjectDropdown({
  projects,
  selected,
  onSelect,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        onMouseDown={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 ayu-btn ayu-btn-md ayu-btn-ghost text-left"
      >
        <span className={selected ? "text-ayu-fg" : "text-ayu-muted"}>
          {selected ?? "Select a project…"}
        </span>
        <span className="text-ayu-dim text-[9px]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full ayu-panel overflow-hidden">
          {projects.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-ayu-muted">
              No projects found
            </div>
          ) : (
            projects.map((p) => (
              <div
                key={p}
                onMouseDown={() => {
                  onSelect(p);
                  setOpen(false);
                }}
                className={`px-3 py-2 text-[11px] cursor-pointer transition-colors
                  ${
                    p === selected
                      ? "text-ayu-orange bg-[color-mix(in_srgb,var(--color-ayu-orange)_8%,transparent)]"
                      : "text-ayu-fg hover:bg-[color-mix(in_srgb,white_3%,transparent)]"
                  }`}
              >
                {p}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
