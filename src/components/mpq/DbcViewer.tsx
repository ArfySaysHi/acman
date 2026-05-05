import useDbcData from "../../hooks/dbc/useDbcData";
import useDbcEdits from "../../hooks/dbc/useDbcEdits";
import PathHelper from "../../helpers/PathHelper";
import { useMemo } from "react";
import DbcTableBody from "../dbc/DbcTableBody";
import DbcTableHead from "../dbc/DbcTableHead";

interface DbcViewerProps {
  mpqId: number;
  path: string;
  onClose: () => void;
}

export default function DbcViewer({ mpqId, path, onClose }: DbcViewerProps) {
  const { data, filter, setFilter, filteredRows, loading } = useDbcData({ id: mpqId, path });
  const { pendingEdits, isDirty } = useDbcEdits();

  const fileName = useMemo(() => PathHelper.pathToFileName(path), [path]);

  return (
    <div
      className="ayu-panel flex flex-col"
      style={{ height: "100%", minHeight: 0, overflow: "hidden" }}
    >
      <div
        className="flex items-center gap-3 px-3 shrink-0"
        style={{
          height: 36,
          borderBottom: "1px solid var(--color-ayu-border)",
          background: "var(--color-ayu-alt)",
        }}
      >
        <span style={{ color: "var(--color-ayu-cyan)", fontSize: 10 }}>◈</span>
        <span
          style={{
            color: "var(--color-ayu-orange)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          {fileName}
        </span>
        {data && (
          <span style={{ color: "var(--color-ayu-dim)", fontSize: 10 }}>
            {data.columns.length} cols · {data.rows.length} rows
            {filteredRows.length !== data.rows.length && (
              <span style={{ color: "var(--color-ayu-yellow)" }}>
                {" "}
                → {filteredRows.length} matched
              </span>
            )}
            {isDirty && (
              <span style={{ color: "var(--color-ayu-orange)", marginLeft: 6 }}>
                · {pendingEdits.size} unsaved {pendingEdits.size === 1 ? "edit" : "edits"}
              </span>
            )}
          </span>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {data && (
            <input
              className="ayu-input"
              placeholder="Filter rows…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: 160, height: 22, padding: "0 8px", fontSize: 10 }}
            />
          )}
          <button className="ayu-btn ayu-btn-ghost" onMouseDown={onClose}>
            ✕
          </button>
        </div>
      </div>

      {loading && (
        <div
          className="flex items-center justify-center flex-1"
          style={{ color: "var(--color-ayu-dim)", fontSize: 11 }}
        >
          <span style={{ color: "var(--color-ayu-cyan)", marginRight: 8 }}>⟳</span>
          Parsing {fileName}…
        </div>
      )}

      {data && !loading && (
        <div className="flex flex-col flex-1 min-h-0">
          <DbcTableHead columns={data.columns} />
          <DbcTableBody rows={data.rows} pendingEdits={pendingEdits} />
        </div>
      )}
    </div>
  );
}
