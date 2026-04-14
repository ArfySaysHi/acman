import { ViewEntry } from "../../types/zod";

interface FileExplorerProps {
  data: ViewEntry[];
  path: string;
  onDirClick: (val: string) => void;
  onCrumbClick: (val: number) => void;
  loading: boolean;
}

export default function FileExplorer({
  data,
  loading,
  path,
  onDirClick,
  onCrumbClick,
}: FileExplorerProps) {
  const crumbs =
    path === "/" ? [] : path.replace(/^\//, "").split("/").filter(Boolean);

  return (
    <>
      <div className="flex flex-col overflow-hidden flex-1">
        <div
          className="flex items-center gap-0 px-3 py-2 flex-wrap"
          style={{ borderBottom: "1px solid var(--color-ayu-border)" }}
        >
          <button
            onMouseDown={() => onCrumbClick(-1)}
            className="text-ayu-orange cursor-pointer text-[11px] hover:text-ayu-fg transition-colors"
          >
            root
          </button>
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center">
              <span className="text-ayu-muted text-[11px] px-1">/</span>
              <button
                onMouseDown={() => onCrumbClick(i)}
                className={`text-[11px] transition-colors cursor-pointer ${
                  i === crumbs.length - 1
                    ? "text-ayu-fg cursor-default"
                    : "text-ayu-dim hover:text-ayu-fg"
                }`}
              >
                {crumb}
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-ayu-dim text-[12px]">
            Loading archive…
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-ayu-dim text-[12px]">
            Empty directory
          </div>
        ) : (
          <table className="ayu-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Compressed</th>
                <th>Saved</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) =>
                entry.kind === "dir" ? (
                  <tr
                    key={`dir:${entry.name}`}
                    className="cursor-pointer"
                    onMouseDown={() => onDirClick(entry.name)}
                  >
                    <td>
                      <span className="flex items-center gap-2">
                        <span className="text-ayu-yellow text-[11px]">▶</span>
                        <span className="text-ayu-fg">{entry.name}</span>
                      </span>
                    </td>
                    <td className="text-ayu-muted">—</td>
                    <td className="text-ayu-muted">—</td>
                    <td className="text-ayu-muted">—</td>
                    <td className="text-ayu-muted">—</td>
                  </tr>
                ) : (
                  <tr key={`file:${entry.name}`}>
                    <td>
                      <span className="text-ayu-fg">{entry.name}</span>
                    </td>
                    <td className="text-ayu-dim tabular-nums">
                      {entry.entry.size}
                    </td>
                    <td className="text-ayu-dim tabular-nums">
                      {entry.entry.compressed_size}
                    </td>
                    <td className="text-ayu-dim tabular-nums">
                      {(entry.entry.size, entry.entry.compressed_size)}
                    </td>
                    <td className="text-ayu-dim font-mono text-[10px]">
                      0x
                      {entry.entry.flags
                        .toString(16)
                        .padStart(8, "0")
                        .toUpperCase()}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
