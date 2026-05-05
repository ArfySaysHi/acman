import { useState } from "react";

export type EditKey = `${number}:${number}`;

export default function useDbcEdits() {
  const [pendingEdits, setPendingEdits] = useState<Map<EditKey, string>>(new Map());

  const isDirty = pendingEdits.size > 0;

  function editCell(key: EditKey, value: string) {
    setPendingEdits((prev) => {
      const next = new Map(prev);
      next.set(key, value);
      return next;
    });
  }

  function revertCell(key: EditKey) {
    setPendingEdits((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }

  function revertAll() {
    setPendingEdits(new Map());
  }

  return { pendingEdits, editCell, revertCell, revertAll, isDirty };
}
