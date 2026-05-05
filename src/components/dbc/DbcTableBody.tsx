import { DbcValue } from "../../hooks/dbc/useDbcData";
import { EditKey } from "../../hooks/dbc/useDbcEdits";
import DbcRow from "./DbcRow";

interface DbcTableBodyProps {
  rows: DbcValue[][];
  pendingEdits: Map<EditKey, string>;
}

export default function DbcTableBody({ rows, pendingEdits }: DbcTableBodyProps) {
  return (
    <div style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}>
      {rows.length === 0 ? (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            color: "var(--color-ayu-dim)",
            fontSize: 11,
          }}
        >
          No rows match the filter
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            minWidth: "max-content",
          }}
        >
          <div
            style={{
              position: "absolute",
            }}
          >
            {rows.map((row, id: number) => {
              return <DbcRow key={id} row={row} rowId={id} pendingEdits={pendingEdits} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
