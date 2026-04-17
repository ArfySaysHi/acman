import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";

interface DbcResponse {
  columns: string[];
  rows: DbcValue[][];
}

type DbcValue = number | string;

interface DbcViewerProps {
  mpqId: number;
  path: string;
  onClose: () => void;
}

const ROW_HEIGHT = 26;
const OVERSCAN = 10;

export default function DbcViewer({ mpqId, path, onClose }: DbcViewerProps) {
  const [data, setData] = useState<DbcResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [scrollTop, setScrollTop] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  const fileName = path.split(/[/\\]/).pop() ?? path;

  useEffect(() => {
    setLoading(true);
    setError(null);
    setFilter("");
    setScrollTop(0);

    invoke<DbcResponse>("read_dbc", { id: mpqId, path })
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [mpqId, path]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setContainerHeight(entries[0].contentRect.height);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const filteredRows =
    data && filter.trim()
      ? data.rows.filter((row) =>
          row.some((cell) =>
            String(cell).toLowerCase().includes(filter.toLowerCase()),
          ),
        )
      : (data?.rows ?? []);

  const totalHeight = filteredRows.length * ROW_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIdx = Math.min(filteredRows.length, startIdx + visibleCount);
  const visibleRows = filteredRows.slice(startIdx, endIdx);
  const offsetY = startIdx * ROW_HEIGHT;

  const colWidths =
    data?.columns.map((col) => Math.max(col.length * 8 + 24, 80)) ?? [];

  return (
    <div
      className="ayu-panel flex flex-col"
      style={{ height: "100%", minHeight: 0, overflow: "hidden" }}
    >
      <div
        className="flex items-center gap-3 px-3 flex-shrink-0"
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
            {filter && filteredRows.length !== data.rows.length && (
              <span style={{ color: "var(--color-ayu-yellow)" }}>
                {" "}
                → {filteredRows.length} matched
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
              onChange={(e) => {
                setFilter(e.target.value);
                setScrollTop(0);
                if (scrollRef.current) scrollRef.current.scrollTop = 0;
              }}
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
          <span style={{ color: "var(--color-ayu-cyan)", marginRight: 8 }}>
            ⟳
          </span>
          Parsing {fileName}…
        </div>
      )}

      {error && (
        <div className="ayu-error m-3" style={{ fontSize: 11 }}>
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="flex flex-col flex-1 min-h-0">
          <div
            style={{
              overflowX: "hidden",
              borderBottom: "1px solid var(--color-ayu-border)",
              flexShrink: 0,
            }}
            id="dbc-header-scroll"
          >
            <div style={{ display: "flex", minWidth: "max-content" }}>
              <div
                style={{
                  width: 48,
                  flexShrink: 0,
                  padding: "5px 8px",
                  fontSize: 10,
                  color: "var(--color-ayu-muted)",
                  borderRight: "1px solid var(--color-ayu-border)",
                  background: "var(--color-ayu-panel)",
                }}
              />
              {data.columns.map((col, i) => (
                <div
                  key={i}
                  style={{
                    width: colWidths[i],
                    flexShrink: 0,
                    padding: "5px 10px",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-ayu-orange)",
                    borderRight: "1px solid var(--color-ayu-border)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    background: "var(--color-ayu-panel)",
                  }}
                  title={col}
                >
                  {col}
                </div>
              ))}
            </div>
          </div>

          <div
            ref={(el) => {
              (
                containerRef as React.MutableRefObject<HTMLDivElement | null>
              ).current = el;
              (
                scrollRef as React.MutableRefObject<HTMLDivElement | null>
              ).current = el;
            }}
            style={{ flex: 1, overflowY: "auto", overflowX: "auto" }}
            onScroll={(e) => {
              const target = e.currentTarget;
              setScrollTop(target.scrollTop);
              const header = document.getElementById("dbc-header-scroll");
              if (header) header.scrollLeft = target.scrollLeft;
            }}
          >
            {filteredRows.length === 0 ? (
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
                  height: totalHeight,
                  position: "relative",
                  minWidth: "max-content",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: offsetY,
                    left: 0,
                    right: 0,
                  }}
                >
                  {visibleRows.map((row, relIdx) => {
                    const absIdx = startIdx + relIdx;
                    const originalIdx = filter
                      ? data.rows.indexOf(filteredRows[absIdx])
                      : absIdx;
                    return (
                      <div
                        key={absIdx}
                        style={{
                          display: "flex",
                          height: ROW_HEIGHT,
                          borderBottom: "1px solid var(--color-ayu-border)",
                          background:
                            absIdx % 2 === 0
                              ? "transparent"
                              : "color-mix(in srgb, white 1.5%, transparent)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background =
                            "color-mix(in srgb, white 3%, transparent)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background =
                            absIdx % 2 === 0
                              ? "transparent"
                              : "color-mix(in srgb, white 1.5%, transparent)";
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
                            color: "var(--color-ayu-muted)",
                            borderRight: "1px solid var(--color-ayu-border)",
                            fontVariantNumeric: "tabular-nums",
                            userSelect: "none",
                          }}
                        >
                          {originalIdx + 1}
                        </div>

                        {row.map((cell, ci) => {
                          const isNum = typeof cell === "number";
                          const isFloat = isNum && !Number.isInteger(cell);
                          const cellStr = isFloat
                            ? (cell as number).toFixed(4).replace(/\.?0+$/, "")
                            : String(cell);

                          return (
                            <div
                              key={ci}
                              style={{
                                width: colWidths[ci],
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                padding: "0 10px",
                                fontSize: 11,
                                borderRight:
                                  "1px solid var(--color-ayu-border)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: isNum
                                  ? "var(--color-ayu-cyan)"
                                  : cell === ""
                                    ? "var(--color-ayu-muted)"
                                    : "var(--color-ayu-fg)",
                                fontVariantNumeric: "tabular-nums",
                              }}
                              title={cellStr}
                            >
                              {cell === "" ? (
                                <span
                                  style={{
                                    color: "var(--color-ayu-muted)",
                                    fontSize: 9,
                                  }}
                                >
                                  —
                                </span>
                              ) : (
                                cellStr
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
