import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useMemo, useState } from "react";
import { ViewEntry } from "../types/zod";
import FileExplorer from "../components/mpq/FileExplorer";
import useMpqManager from "../hooks/useMpqManager";
import useDragDrop from "../hooks/useDragDrop";
import { filterEntries, joinPath, trimPath } from "../helpers/mpqHelper";

export default function Mpq() {
  const [path, setPath] = useState<string>("/");
  const mpq = useMpqManager(path);
  useDragDrop(mpq);

  const visibleEntries = useMemo<ViewEntry[]>(() => {
    if (!mpq.activeMpq) return [];
    return filterEntries(mpq.fileCache[mpq.activeMpq] ?? [], path);
  }, [mpq.activeMpq, path, mpq.fileCache]);

  useEffect(() => {
    if (mpq.activeMpq) {
      setPath("/");
      mpq.fetchFiles(mpq.activeMpq);
    }
  }, [mpq.activeMpq]);

  const selectPath = async () => {
    try {
      const paths: string[] | null = await open({
        title: "Select an MPQ",
        multiple: true,
      });

      if (!paths || paths.length === 0) return;

      await Promise.allSettled(
        paths.map(async (path) => {
          const id = await invoke("open_mpq", { path });

          if (typeof id !== "number")
            return console.error("Non-number value returned");

          return id;
        }),
      );

      await mpq.refresh();
    } catch (err) {
      console.error("Failed to open MPQ archive:", err);
    }
  };

  const navigate = (segment: string) => setPath((p) => joinPath(p, segment));
  const navigateTo = (idx: number) => setPath((p) => trimPath(p, idx));

  const mpqsOpen = Object.keys(mpq.mpqs).length > 0;

  return (
    <div>
      <div className="ayu-page-header">
        <h2 className="ayu-heading mr-auto">MPQ Editor</h2>
        <button onMouseDown={selectPath} className="ayu-btn ayu-btn-orange">
          + Import MPQ
        </button>
      </div>

      {mpqsOpen ? (
        <div className="ayu-muted mb-1">
          Left-click: Open | Right-click: Close
        </div>
      ) : null}

      <div
        className="ayu-panel p-2 mb-4"
        onContextMenu={(e) => e.preventDefault()}
      >
        {mpqsOpen ? (
          Object.keys(mpq.mpqs).map((k) => (
            <button
              key={k}
              className={`ayu-btn ${mpq.activeMpq === k ? "ayu-btn-orange" : "ayu-btn-ghost"} mr-1`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.button === 2 ? mpq.closeMpq(k) : mpq.setActiveMpq(k);
              }}
            >
              {mpq.mpqs[k].name}
            </button>
          ))
        ) : (
          <div>Use the Create or Import MPQ option to see files.</div>
        )}
      </div>

      <FileExplorer
        data={visibleEntries}
        loading={mpq.loading}
        path={path}
        onDirClick={(val: string) => navigate(val)}
        onCrumbClick={(val: number) => navigateTo(val)}
      />
    </div>
  );
}
