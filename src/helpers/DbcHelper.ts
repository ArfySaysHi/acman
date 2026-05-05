import { EditKey } from "../hooks/dbc/useDbcEdits";

export default class DbcHelper {
  static editKey(rowId: number, colId: number): EditKey {
    return `${rowId}:${colId}`;
  }
}
