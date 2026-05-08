import { useEffect, useRef, useState } from "react";
import { IndexedRow } from "../../hooks/dbc/useDbcData";
import { EditKey } from "../../hooks/dbc/useDbcEdits";
import DbcRow, { ROW_HEIGHT } from "./DbcRow";
import useDbcCellFocus from "../../hooks/dbc/useDbcCellFocus";

const OVERSCAN = 10;

interface DbcTableBodyProps {
  rows: IndexedRow[];
  columns: string[];
  onCellChange: (key: EditKey, value: string) => void;
  onCellRevert: (key: EditKey) => void;
  pendingEdits: Map<EditKey, string>;
  colWidths: number[];
  headerRef: React.RefObject<HTMLDivElement | null>;
  onResizeColumn: (i: number, width: number) => void;
}

export default function DbcTableBody({
  rows,
  columns,
  onCellChange,
  onCellRevert,
  pendingEdits,
  colWidths,
  headerRef,
  onResizeColumn,
}: DbcTableBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const { focusedCell, moveTab } = useDbcCellFocus({
    rows,
    colCount: columns.length,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalHeight = rows.length * ROW_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIdx = Math.min(rows.length, startIdx + visibleCount);
  const offsetY = startIdx * ROW_HEIGHT;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto"
      onScroll={(e) => {
        setScrollTop(e.currentTarget.scrollTop);
        if (headerRef.current) headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
      }}
    >
      <div
        className="sticky top-0 z-10 flex min-w-max border-b border-ayu-border"
        style={{ background: "var(--color-ayu-panel)" }}
      >
        <div className="shrink-0 border-r border-ayu-border" style={{ width: 48 }} />
        {columns.map((col, i) => (
          <div
            key={i}
            className="relative shrink-0 border-r border-ayu-border"
            style={{ width: colWidths[i] }}
          >
            <div
              className="px-2.5 py-1.25 text-[10px] font-semibold uppercase tracking-widest overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ color: "var(--color-ayu-orange)" }}
              title={col}
            >
              {col}
            </div>

            <div
              className="absolute top-0 right-0 h-full w-1 cursor-col-resize"
              onPointerDown={(e) => {
                e.preventDefault();

                const startX = e.clientX;
                const startWidth = colWidths[i];

                const onMove = (ev: PointerEvent) => {
                  const delta = ev.clientX - startX;
                  onResizeColumn(i, startWidth + delta);
                };

                const onUp = () => {
                  window.removeEventListener("pointermove", onMove);
                  window.removeEventListener("pointerup", onUp);

                  document.body.style.userSelect = "";
                };

                document.body.style.userSelect = "none";

                window.addEventListener("pointermove", onMove);
                window.addEventListener("pointerup", onUp);
              }}
            />
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="p-8 text-center text-[11px]" style={{ color: "var(--color-ayu-dim)" }}>
          No rows match the filter
        </div>
      ) : (
        <div className="relative min-w-max" style={{ height: totalHeight }}>
          <div style={{ position: "absolute", top: offsetY, left: 0, right: 0 }}>
            {rows.slice(startIdx, endIdx).map((indexedRow) => {
              return (
                <DbcRow
                  key={indexedRow.originalIdx}
                  row={indexedRow.row}
                  rowId={indexedRow.originalIdx}
                  isOdd={indexedRow.originalIdx % 2 === 1}
                  onCellChange={onCellChange}
                  onCellRevert={onCellRevert}
                  pendingEdits={pendingEdits}
                  colWidths={colWidths}
                  focusedCell={focusedCell}
                  onTab={(key: EditKey, draft: string, forward: boolean, valueChanged: boolean) => {
                    if (valueChanged) onCellChange(key, draft);
                    moveTab(key, forward);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
