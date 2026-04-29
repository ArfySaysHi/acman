import { formatBytes } from "../../helpers/mpqHelper";
import { ViewEntry } from "../../types/zod";

interface FileExplorerProps {
  data: ViewEntry[];
  selected: ViewEntry[];
  path: string;
  onDirClick: (val: string) => void;
  onCrumbClick: (val: number) => void;
  onCreateDirClick: () => void;
  onRenameDirClick: () => void;
  onExtractClick: () => void;
  onRowClick: (e: React.MouseEvent, fe: ViewEntry) => void;
  onDoubleClick: (ve: ViewEntry) => void;
  loading: boolean;
}

export default function FileExplorer({
  data,
  selected,
  loading,
  path,
  onDirClick,
  onCrumbClick,
  onCreateDirClick,
  onRenameDirClick,
  onExtractClick,
  onRowClick,
  onDoubleClick,
}: FileExplorerProps) {
  const crumbs = path === "/" ? [] : path.replace(/^\//, "").split("/").filter(Boolean);

  return (
    <>
      <div className="flex flex-col overflow-hidden">
        <div
          className="flex items-center gap-0 pl-2 pt-2 pb-2 flex-wrap"
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
          <button className="ayu-btn ayu-btn-orange ml-auto" onMouseDown={() => onCreateDirClick()}>
            + New Folder
          </button>
          <button className="ayu-btn ayu-btn-orange ml-3" onMouseDown={() => onRenameDirClick()}>
            Rename Entry
          </button>
          <button
            className="ayu-btn ayu-btn-orange ml-3"
            onMouseDown={onExtractClick}
            disabled={selected.length === 0}
          >
            Extract Selected
          </button>
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
              {data.map((entry) => {
                const isSelected = selected.some((ve) => ve.name === entry.name);

                return entry.kind === "dir" ? (
                  <tr
                    key={`dir:${entry.name}`}
                    className={`cursor-pointer ${isSelected ? "selected" : ""}`}
                    onClick={(e) => onRowClick(e, entry)}
                  >
                    <td
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onDirClick(entry.name);
                      }}
                    >
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
                  <tr
                    key={`file:${entry.name}`}
                    className={`cursor-pointer ${isSelected ? "selected" : ""}`}
                    onClick={(e) => onRowClick(e, entry)}
                    onDoubleClick={() => onDoubleClick(entry)}
                  >
                    <td>
                      <span className="text-ayu-fg">{entry.name}</span>
                    </td>
                    <td className="text-ayu-dim tabular-nums">{formatBytes(entry.entry.size)}</td>
                    <td className="text-ayu-dim tabular-nums">
                      {formatBytes(entry.entry.compressed_size)}
                    </td>
                    <td className="text-ayu-dim tabular-nums">
                      {formatBytes(entry.entry.size - entry.entry.compressed_size)}
                    </td>
                    <td className="text-ayu-dim font-mono text-[10px]">
                      0x
                      {entry.entry.flags.toString(16).padStart(8, "0").toUpperCase()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
