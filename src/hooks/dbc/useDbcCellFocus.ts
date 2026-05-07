import { useState } from "react";
import { EditKey } from "./useDbcEdits";
import { IndexedRow } from "./useDbcData";

interface UseDbcCellFocusProps {
  rows: IndexedRow[];
  colCount: number;
}

export default function useDbcCellFocus({ rows, colCount }: UseDbcCellFocusProps) {
  const [focusedCell, setFocusedCell] = useState<EditKey | null>(null);

  function moveTab(currentKey: EditKey, forward: boolean) {
    const [row, col] = currentKey.split(":").map(Number);
    let nextRow = row;
    let nextCol = col + (forward ? 1 : -1);

    if (nextCol >= colCount) {
      nextCol = 0;
      nextRow += 1;
    }
    if (nextCol < 0) {
      nextCol = colCount - 1;
      nextRow -= 1;
    }

    const exists = rows.some((r) => r.originalIdx === nextRow);
    if (exists) setFocusedCell(`${nextRow}:${nextCol}`);
  }

  return { focusedCell, setFocusedCell, moveTab };
}
