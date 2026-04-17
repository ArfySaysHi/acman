import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useMemo, useState } from "react";
import { ViewEntry } from "../types/zod";
import FileExplorer from "../components/mpq/FileExplorer";
import useMpqManager from "../hooks/useMpqManager";
import useDragDrop from "../hooks/useDragDrop";
import { filterEntries, joinPath, trimPath } from "../helpers/mpqHelper";
import InputModal from "../components/modals/InputModal";

export default function Mpq() {
  const mpq = useMpqManager();
  useDragDrop(mpq);

  const [modal, setModal] = useState<string | null>(null);
  const [selected, setSelected] = useState<ViewEntry[]>([]);

  const visibleEntries = useMemo<ViewEntry[]>(() => {
    if (!mpq.activeMpq) return [];
    return filterEntries(mpq.fileCache[mpq.activeMpq] ?? [], mpq.archivePath);
  }, [mpq.activeMpq, mpq.archivePath, mpq.fileCache]);

  useEffect(() => {
    if (mpq.activeMpq) {
      mpq.setArchivePath("/");
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

  const navigate = (segment: string) =>
    mpq.setArchivePath((p) => joinPath(p, segment));
  const navigateTo = (idx: number) =>
    mpq.setArchivePath((p) => trimPath(p, idx));

  const mpqsOpen = Object.keys(mpq.mpqs).length > 0;

  const selectRow = (e: React.MouseEvent, viewEntry: ViewEntry) => {
    const isPresent = selected.some((ve) => ve.name === viewEntry.name);

    const filterVe = () =>
      setSelected((prev) => prev.filter((ve) => ve.name !== viewEntry.name));
    const addVe = () => setSelected((prev) => [...prev, viewEntry]);

    if (e.ctrlKey) {
      if (isPresent) return filterVe();
      else return addVe();
    }

    if (isPresent && selected.length === 1) setSelected([]);
    else setSelected([viewEntry]);
  };

  return (
    <div>
      {modal === "mkdir" && (
        <InputModal
          title="Create Directory"
          label="Name"
          hint="Will be created at the current archive path."
          placeholder="e.g. Interface"
          confirmLabel="Create"
          onConfirm={(name) => {
            mpq.createDir(name);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "rename" && (
        <InputModal
          title="Rename Entry"
          label="Name"
          confirmLabel="Rename"
          onConfirm={(name) => {
            if (selected.length === 0) return;
            mpq.renameEntry(selected[0], name);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      <div className="ayu-page-header">
        <h2 className="ayu-heading mr-auto">MPQ Editor</h2>
        <button onMouseDown={mpq.createMpq} className="ayu-btn ayu-btn-green">
          + Create MPQ
        </button>
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
        selected={selected}
        loading={mpq.loading}
        path={mpq.archivePath}
        onDirClick={(val: string) => navigate(val)}
        onCrumbClick={(val: number) => navigateTo(val)}
        onCreateDirClick={() => setModal("mkdir")}
        onRenameDirClick={() => setModal("rename")}
        onRowClick={selectRow}
      />
    </div>
  );
}
