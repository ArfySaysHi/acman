import { DbcValue } from "../hooks/dbc/useDbcData";
import { EditKey } from "../hooks/dbc/useDbcEdits";

export default class DbcHelper {
  static editKey(rowId: number, colId: number): EditKey {
    return `${rowId}:${colId}`;
  }

  static displayValue(rawCell: DbcValue, key: EditKey, pendingEdits: Map<EditKey, string>): string {
    if (pendingEdits.has(key)) return pendingEdits.get(key)!;
    const isFloat = typeof rawCell === "number" && !Number.isInteger(rawCell);
    return isFloat ? (rawCell as number).toFixed(4).replace(/\.?0+$/, "") : String(rawCell);
  }
}
