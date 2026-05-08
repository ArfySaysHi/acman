import useDbcData from "../../hooks/dbc/useDbcData";
import useDbcEdits from "../../hooks/dbc/useDbcEdits";
import { pathToFileName } from "../../helpers/pathHelper";
import DbcTableBody from "../dbc/DbcTableBody";
import { useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "../../context/ToastContext";

interface DbcViewerProps {
  mpqId: number;
  path: string;
  onClose: () => void;
}

export default function DbcViewer({ mpqId, path, onClose }: DbcViewerProps) {
  const { data, filter, setFilter, indexedRows, filteredRows, loading, reload } = useDbcData({
    id: mpqId,
    path,
  });
  const { pendingEdits, editCell, revertCell, revertAll, isDirty } = useDbcEdits();
  const fileName = pathToFileName(path);
  const colWidths = useMemo(
    () => data?.columns.map((col) => Math.max(col.length * 8 + 24, 80)) ?? [],
    [data?.columns],
  );
  const headerRef = useRef<HTMLDivElement>(null);
  const { push } = useToast();

  async function saveDbcChanges() {
    try {
      const edits = Array.from(pendingEdits.entries()).map(([key, value]) => {
        const [row, col] = key.split(":").map(Number);
        return { row, col, value };
      });
      await invoke("update_dbc", { id: mpqId, archivePath: path, edits });
      revertAll();
      reload();
    } catch (err) {
      push(`Failed to save Dbc changes: ${err}`, "error");
      console.error(err);
    }
  }

  return (
    <div
      className="ayu-panel flex flex-col overflow-hidden"
      style={{ height: "100%", minHeight: 0 }}
    >
      <div
        className="flex items-center gap-3 px-3 shrink-0 border-b border-ayu-border"
        style={{ height: 36, background: "var(--color-ayu-alt)" }}
      >
        <span className="text-[10px]" style={{ color: "var(--color-ayu-cyan)" }}>
          ◈
        </span>
        <span
          className="text-[11px] font-semibold tracking-wide"
          style={{ color: "var(--color-ayu-orange)" }}
        >
          {fileName}
        </span>

        {data && (
          <span className="text-[10px]" style={{ color: "var(--color-ayu-dim)" }}>
            {data.columns.length} cols · {data.rows.length} rows
            {filteredRows.length !== data.rows.length && (
              <span style={{ color: "var(--color-ayu-yellow)" }}>
                {" "}
                → {filteredRows.length} matched
              </span>
            )}
            {isDirty && (
              <span className="ml-1.5" style={{ color: "var(--color-ayu-orange)" }}>
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
          className="flex items-center justify-center flex-1 gap-2 text-[11px]"
          style={{ color: "var(--color-ayu-dim)" }}
        >
          <span style={{ color: "var(--color-ayu-cyan)" }}>⟳</span>
          Parsing {fileName}…
        </div>
      )}

      {data && !loading && (
        <div className="flex flex-col flex-1 min-h-0">
          <DbcTableBody
            rows={indexedRows}
            columns={data.columns}
            onCellChange={editCell}
            onCellRevert={revertCell}
            pendingEdits={pendingEdits}
            colWidths={colWidths}
            headerRef={headerRef}
          />
        </div>
      )}

      {isDirty && (
        <div
          className="flex items-center gap-3 px-3 shrink-0 border-t border-ayu-border text-[10px]"
          style={{
            height: 36,
            background: "color-mix(in srgb, var(--color-ayu-orange) 8%, var(--color-ayu-panel))",
          }}
        >
          <span style={{ color: "var(--color-ayu-orange)" }}>◆</span>
          <span className="flex-1" style={{ color: "var(--color-ayu-dim)" }}>
            {pendingEdits.size} unsaved {pendingEdits.size === 1 ? "edit" : "edits"}
          </span>
          <button className="ayu-btn ayu-btn-ghost" onClick={revertAll}>
            Revert all
          </button>
          <button onClick={saveDbcChanges} className="ayu-btn ayu-btn-orange">
            Save
          </button>
        </div>
      )}
    </div>
  );
}
