import DbcHelper from "../../helpers/DbcHelper";
import { DbcValue } from "../../hooks/dbc/useDbcData";
import { EditKey } from "../../hooks/dbc/useDbcEdits";
import DbcCell from "./DbcCell";

interface DbcRowProps {
  row: DbcValue[];
  rowId: number;
  pendingEdits: Map<EditKey, string>;
}

export default function DbcRow({ row, rowId, pendingEdits }: DbcRowProps) {
  const isDirty = row.some((_, ci) => pendingEdits.has(DbcHelper.editKey(rowId, ci)));

  function displayValue(originalRowIdx: number, colIdx: number, rawCell: DbcValue): string {
    const key = DbcHelper.editKey(originalRowIdx, colIdx);
    if (pendingEdits.has(key)) return pendingEdits.get(key)!;
    const isFloat = typeof rawCell === "number" && !Number.isInteger(rawCell);
    return isFloat ? (rawCell as number).toFixed(4).replace(/\.?0+$/, "") : String(rawCell);
  }

  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid var(--color-ayu-border)",
        background: isDirty
          ? "color-mix(in srgb, var(--color-ayu-orange) 6%, transparent)"
          : "transparent",
      }}
    >
      <div
        style={{
          width: 48,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          fontSize: 10,
          color: isDirty ? "var(--color-ayu-orange)" : "var(--color-ayu-muted)",
          borderRight: "1px solid var(--color-ayu-border)",
          fontVariantNumeric: "tabular-nums",
          userSelect: "none",
        }}
      >
        {isDirty ? "●" : "ROWNUMHERE"}
      </div>

      {row.map((cell, colId) => {
        const key = DbcHelper.editKey(rowId, colId);
        const isDirtyCell = pendingEdits.has(key);
        const cellDisplay = displayValue(rowId, colId, cell);

        return (
          <DbcCell
            key={colId}
            value={cellDisplay}
            onClick={() => {}}
            onContextMenu={() => {}}
            isDirty={isDirtyCell}
          />
        );
      })}
    </div>
  );
}
