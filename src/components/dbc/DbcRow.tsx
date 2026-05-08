import { memo } from "react";
import { editKey, displayValue } from "../../helpers/dbcHelper";
import { DbcValue } from "../../hooks/dbc/useDbcData";
import { EditKey } from "../../hooks/dbc/useDbcEdits";
import DbcCell from "./DbcCell";

export const ROW_HEIGHT = 26;

interface DbcRowProps {
  row: DbcValue[];
  rowId: number;
  isOdd: boolean;
  onCellChange: (key: EditKey, value: string) => void;
  onCellRevert: (key: EditKey) => void;
  pendingEdits: Map<EditKey, string>;
  colWidths: number[];
  focusedCell: EditKey | null;
  onTab: (key: EditKey, draft: string, forward: boolean, valueChanged: boolean) => void;
}

export function DbcRow({
  row,
  rowId,
  isOdd,
  onCellChange,
  onCellRevert,
  pendingEdits,
  colWidths,
  focusedCell,
  onTab,
}: DbcRowProps) {
  const isDirty = row.some((_, ci) => pendingEdits.has(editKey(rowId, ci)));

  return (
    <div
      className="flex shrink-0 min-w-max border-b border-ayu-border"
      style={{
        height: ROW_HEIGHT,
        background: isDirty
          ? "color-mix(in srgb, var(--color-ayu-orange) 6%, transparent)"
          : isOdd
            ? "color-mix(in srgb, white 1.5%, transparent)"
            : "transparent",
      }}
    >
      <div
        className="shrink-0 flex items-center px-2 border-r border-ayu-border tabular-nums select-none text-[10px]"
        style={{
          width: 48,
          color: isDirty ? "var(--color-ayu-orange)" : "var(--color-ayu-muted)",
        }}
      >
        {isDirty ? "●" : rowId + 1}
      </div>

      {row.map((cell, colId) => {
        const key = editKey(rowId, colId);
        const isFocused = focusedCell === key;

        return (
          <DbcCell
            key={colId}
            editKey={key}
            value={displayValue(cell, key, pendingEdits)}
            isDirty={pendingEdits.has(key)}
            onCommit={onCellChange}
            onRevert={onCellRevert}
            width={colWidths[colId]}
            isFocused={isFocused}
            onTab={onTab}
          />
        );
      })}
    </div>
  );
}

export default memo(DbcRow);
