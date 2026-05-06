import { useState } from "react";
import { DbcValue } from "../../hooks/dbc/useDbcData";
import { EditKey } from "../../hooks/dbc/useDbcEdits";

interface DbcCellProps {
  value: DbcValue;
  editKey: EditKey;
  isDirty: boolean;
  onCommit: (key: EditKey, value: string) => void;
  onRevert: (key: EditKey) => void;
  width: number;
}

export default function DbcCell({
  value,
  editKey,
  isDirty,
  onCommit,
  onRevert,
  width,
}: DbcCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const displayed = String(value === "" ? "-" : value);
  const isNum = typeof value === "number";

  function beginEdit() {
    setDraft(displayed);
    setIsEditing(true);
  }

  function commit() {
    setIsEditing(false);
    onCommit(editKey, draft);
  }

  function cancel() {
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div
        className="relative flex items-center shrink-0 border-r border-ayu-border outline-1 outline-ayu-cyan -outline-offset-1 bg-ayu-cyan/10"
        style={{ width }}
      >
        <input
          autoFocus
          className="w-full h-full bg-transparent border-none outline-none px-2.5 text-[11px] text-ayu-fg font-mono tabular-nums"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center shrink-0 border-r border-ayu-border cursor-text overflow-hidden px-2.5 text-[11px] tabular-nums whitespace-nowrap"
      style={{
        width,
        color: isDirty
          ? "var(--color-ayu-yellow)"
          : isNum
            ? "var(--color-ayu-cyan)"
            : "var(--color-ayu-fg)",
      }}
      onClick={beginEdit}
      onContextMenu={(e) => {
        e.preventDefault();
        onRevert(editKey);
      }}
      title={isDirty ? `Edited · original: ${displayed}` : undefined}
    >
      {isDirty && (
        <span className="absolute top-0.75 left-0.75 w-1 h-1 rounded-full bg-ayu-orange shrink-0" />
      )}
      <span className="overflow-hidden text-ellipsis">{displayed}</span>
    </div>
  );
}
